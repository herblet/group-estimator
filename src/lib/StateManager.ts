import { produceWithPatches, current, applyPatches } from 'immer';
import type { Patch } from 'immer';
import type { WritableDraft } from 'immer/dist/internal';
import { BehaviorSubject, Subject, of } from 'rxjs';
import {
	catchError,
	onErrorResumeNext,
	scan,
	shareReplay,
	skip,
	take,
	takeUntil
} from 'rxjs/operators';
import { Commands, CommandType } from './model/commands';
import type { Command } from './model/commands';
import { createParticipant } from './model/participant';
import type { Participant } from './model/participant';
import { Session, SessionType } from './model/session';
import { State } from './model/state';
import type { Story } from './model/story';
import type { StateExchangerFactory } from './StateExchanger';

/**
 * Manages the application state by applying received commands to the current state.
 */
export class StateManager {
	// Observable indicating when the state manager is done
	private completed$ = new Subject<void>();

	private command$ = new Subject<Command>();

	private send?: (command: Command, participantKey?: string) => void;

	public error$ = new BehaviorSubject<Error | undefined>(undefined);

	public state$ = this.command$.pipe(
		takeUntil(this.completed$),
		scan(this.handleCommand.bind(this), new State()),

		// Pass any error to the error$ stream
		catchError((error) => {
			console.log('Error in state manager', error);
			this.error$.next(error);
			throw error;
		}),
		// Skip further processing of errors and wait for next
		onErrorResumeNext(),

		shareReplay<State>(1)
	);

	// sender: (command: Command, participantKey: string) => void;

	constructor(private readonly exchangerFactory: StateExchangerFactory) {
		// Want the sharing to start
		this.state$.pipe(takeUntil(this.completed$)).subscribe(() => {
			/* do nothing */
		});
	}

	/**
	 * Stop this statemanager, and in particular the update loop
	 */
	public stop() {
		this.completed$.next();
	}

	/**
	 * Update the current state by applying the given command
	 *
	 * @param command The command to apply to the state
	 */
	public updateState(command: Command) {
		this.command$.next(command);
	}

	/**
	 * Applies the provided command to the provided state, returning the resulting new state.
	 */
	private handleCommand(currentState: State, command: Command): State {
		if (command.type == CommandType.UPDATE) {
			return this.update(currentState, command);
		}

		const handler = this[command.type].bind(this);

		if (!handler || typeof handler !== 'function') {
			throw new Error(`No handler for command ${command.type}`);
		}

		const priorVersion = currentState.session?.version ?? 0;

		const [newState, patches] = produceWithPatches(currentState, (draft) => {
			handler(draft, command);
		});

		if (currentState.sessionType === SessionType.HOST) {
			this.exchangeState(
				Commands.update(
					priorVersion,
					patches.filter((patch) => patch.path[0] === 'session')
				)
			);
		}

		return newState;
	}

	private init() {
		// Needed to enable indexing, do nothing
	}

	private start(state: WritableDraft<State>, command: Command) {
		if (state.session) {
			throw new Error('Session already running');
		}

		state.self = createParticipant(command.data.name);
		state.sessionType = SessionType.HOST;

		state.session = new Session();
		state.session.title = command.data.title;
		state.session.participants.push(state.self);

		this.initStateExchanger(state.session.key, state.sessionType, state.self.key);
	}

	private join(state: WritableDraft<State>, command: Command) {
		if (state.session) {
			throw new Error('Session already running');
		}

		state.self = createParticipant(command.data.name);
		state.sessionType = SessionType.PARTICIPANT;

		this.initStateExchanger(command.data.key, state.sessionType, state.self.key);
	}

	private initStateExchanger(key: string, type: SessionType, participantKey: string) {
		console.debug('Initializing state exchanger');
		this.exchangerFactory(key, participantKey, type).subscribe(({ receiver, sender }) => {
			receiver.subscribe((command) => {
				console.debug('Received command', command);

				this.updateState(command);
			});

			this.send = sender;

			// Need this to get the current state
			this.currentState().then((state) => {
				if (state.self) {
					this.exchangeState(Commands.addParticipant(state.self));
				}
			});
		});
	}

	private currentState(): Promise<State> {
		return this.state$.pipe(take(1)).toPromise();
	}

	private addParticipant(state: WritableDraft<State>, command: Command) {
		if (!state.session) {
			throw new Error('No active session');
		}

		const newParticipant = command.data as Participant;

		this.incrementVersion(state.session);
		state.session.participants.push(newParticipant);

		if (this.send) {
			this.send(Commands.session(current(state.session)), newParticipant.key);
		}
	}

	private session(state: WritableDraft<State>, command: Command) {
		if (state.session) {
			throw new Error('Session already set');
		}

		state.session = command.data;
	}

	private update(state: State, command: Command): State {
		if (!state.session) {
			throw new Error('No active session');
		}

		if (state.session.version !== command.data.priorVersion) {
			console.log('Received outdated version of state, ignoring');
			return state;
		}

		const patches: Patch[] = command.data.patches;

		const newState = applyPatches(state, patches);

		return newState;
	}

	private addStory(state: WritableDraft<State>, command: Command) {
		if (!state.session) {
			throw new Error('No active session');
		}

		const newStory = command.data as Story;

		this.incrementVersion(state.session);
		state.session.stories.push(newStory);
	}

	private incrementVersion(session: WritableDraft<Session>) {
		session.version++;
	}

	private exchangeState(command: Command) {
		if (!this.send) {
			throw new Error('State Exchanger not initialized');
		} else {
			this.send(command);
		}
	}
}
