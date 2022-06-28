import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { enablePatches, produceWithPatches } from 'immer';
import { Subject, of } from 'rxjs';
import { filter, take, takeLast } from 'rxjs/operators';
import { Commands, CommandType, type Command } from './model/commands';
import { Session, SessionType } from './model/session';
import { Story } from './model/story';

import { StateManager } from './StateManager';
import type { State } from './model/state';

enablePatches();

describe('StateManager', () => {
	let stateManager;

	let receiver: Subject<Command>;
	let sender;
	let constructorArgs: any;

	beforeEach(() => {
		receiver = new Subject<Command>();
		sender = new Subject<{ command: Command; participantKey?: string }>();

		stateManager = new StateManager(
			(sessionKey: string, participantKey: string, sessionType: SessionType) => {
				constructorArgs = { sessionKey, participantKey, sessionType };
				return of({
					receiver,
					sender: (command, participantKey) => sender.next({ command, participantKey })
				});
			}
		);
	});

	afterEach(() => {
		stateManager.stop();
		stateManager = undefined;
	});

	it('should cache the current state', async () => {
		stateManager.updateState(Commands.start('Alice', 'Tea Party'));

		const received = await stateManager.state$.pipe(take(1)).toPromise();

		expect(received).toBeTruthy();
	});

	describe('START Command', () => {
		it('should produce HOST Session', async () => {
			stateManager.updateState(Commands.start('Alice', 'Tea Party'));

			const received = await stateManager.state$.pipe(take(1)).toPromise();

			expect(received.self.name).toBe('Alice');
			expect(received.sessionType).toBe(SessionType.HOST);
			expect(received.session.title).toBe('Tea Party');
		});

		it('should call StateExchangerFactory', async () => {
			stateManager.updateState(Commands.start('Alice', 'Tea Party'));

			expect(constructorArgs).toBeDefined();

			expect(constructorArgs.sessionKey).toBeTruthy();
			expect(constructorArgs.participantKey).toBeTruthy();
			expect(constructorArgs.sessionType).toBe(SessionType.HOST);
		});
	});

	describe('JOIN Command', () => {
		it('produces PARTICIPANT Session', async () => {
			stateManager.updateState(Commands.join('Alice', 'a-b-c'));

			const received = await stateManager.state$.pipe(take(1)).toPromise();

			expect(received.self.name).toBe('Alice');
			expect(received.sessionType).toBe(SessionType.PARTICIPANT);
			expect(received.session).toBeFalsy();
		});

		it('calls StateExchangerFactory', async () => {
			stateManager.updateState(Commands.join('Alice', 'a-b-c'));

			expect(constructorArgs).toBeDefined();

			expect(constructorArgs.sessionKey).toBe('a-b-c');
			expect(constructorArgs.participantKey).toBeTruthy();
			expect(constructorArgs.sessionType).toBe(SessionType.PARTICIPANT);
		});
	});

	describe('ADD_PARTICIPANT Command', () => {
		it('adds participant', async () => {
			stateManager.updateState(Commands.start('Alice', 'Tea Party'));
			stateManager.updateState(
				Commands.addParticipant({
					key: 'hatter',
					name: 'Hatter'
				})
			);

			const received = (await stateManager.state$.pipe(take(1)).toPromise()) as State;

			expect(received.session.participants).toHaveLength(2);
			expect(received.session.participants.find((p) => p.name == 'Hatter')).toBeTruthy();
			expect(received.session.participants.find((p) => p.name == 'Alice')).toBeTruthy();
			expect(received.session.version).toBe(1);
		});

		it('sends session to new participant', async () => {
			stateManager.updateState(Commands.start('Alice', 'Tea Party'));

			const promise = sender
				.pipe(
					filter((value: { command: Command; participantKey?: string }, index) => {
						return value.command && value.command.type === CommandType.SESSION;
					}),
					take(1)
				)
				.toPromise();

			receiver.next(
				Commands.addParticipant({
					key: 'hatter',
					name: 'Hatter'
				})
			);

			const { command, participantKey } = await promise;

			expect(participantKey).toBe('hatter');
			expect(command.type).toBe(CommandType.SESSION);

			const session = command.data as Session;
			expect(session.participants).toHaveLength(2);
			expect(session.participants.find((p) => p.name == 'Hatter')).toBeTruthy();
			expect(session.participants.find((p) => p.name == 'Alice')).toBeTruthy();
			expect(session.version).toBe(1);
		});

		it('broadcasts UPDATE', async () => {
			stateManager.updateState(Commands.start('Alice', 'Tea Party'));

			const promise = sender
				.pipe(
					filter((value: { command: Command; participantKey?: string }, index) => {
						return value.command && value.command.type === CommandType.UPDATE;
					}),
					take(1)
				)
				.toPromise();

			receiver.next(
				Commands.addParticipant({
					key: 'hatter',
					name: 'Hatter'
				})
			);

			const { command, participantKey } = await promise;

			expect(participantKey).toBeUndefined();

			expect(command.data.priorVersion).toBe(0);
		});
	});
	describe('SESSION Command', () => {
		it('adds the session to the receiver', async () => {
			const session = new Session('foobar');

			stateManager.updateState(Commands.session(session));

			const received = (await stateManager.state$.pipe(take(1)).toPromise()) as State;

			expect(received.session.key).toBe('foobar');
		});

		it('fails if session is already set', async () => {
			const session = new Session('foobar');

			stateManager.updateState(Commands.session(session));

			const session2 = new Session('barfoo');

			stateManager.updateState(Commands.session(session2));

			const received = (await stateManager.state$.pipe(take(1)).toPromise()) as State;

			console.log(received);
			
			expect(received.session.key).toBe('foobar');

			const error = stateManager.error$.value;

			expect(error).toBeTruthy();
			expect(error.message).toContain('Session');
		});
	});

	describe('UPDATE Command', () => {
		it('updates the session', async () => {
			const session = new Session('foobar');

			stateManager.updateState(Commands.session(session));

			const [newSession, patches] = produceWithPatches({ session }, (draft) => {
				draft.session.title = 'Changed title';
			});

			const preUpdate = (await stateManager.state$.pipe(take(1)).toPromise()) as State;

			expect(preUpdate.session.title).toBeFalsy();

			stateManager.updateState(Commands.update(preUpdate.session.version, patches));

			stateManager.stop();

			const received = (await stateManager.state$.pipe(take(1)).toPromise()) as State;

			expect(received.session.title).toBe('Changed title');
		});

		it('ignores the update if outdated', async () => {
			const session = new Session('foobar');

			stateManager.updateState(Commands.session(session));

			const [newSession, patches] = produceWithPatches({ session }, (draft) => {
				draft.session.title = 'Changed title';
			});

			const preUpdate = (await stateManager.state$.pipe(take(1)).toPromise()) as State;

			expect(preUpdate.session.title).toBeFalsy();

			stateManager.updateState(Commands.update(preUpdate.session.version - 1, patches));

			stateManager.stop();

			const received = (await stateManager.state$.pipe(take(1)).toPromise()) as State;

			// Should still undefined since update ignored
			expect(received.session.title).toBeUndefined();
		});
	});

	describe('ADD_STORY Command', () => {
		it('adds a story to the session', async () => {
			const session = new Session('foobar');

			stateManager.updateState(Commands.session(session));

			stateManager.updateState(Commands.addStory(new Story('ABC-123', 'My First Story')));

			stateManager.stop();

			const received = (await stateManager.state$.pipe(takeLast(1)).toPromise()) as State;

			expect(received.session.stories).toHaveLength(1);
			expect(received.session.stories[0].title).toBe('My First Story');
		});
	});
});
