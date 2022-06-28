import { RxStomp, RxStompConfig } from "@stomp/rx-stomp";
import { concat, merge, Observable } from "rxjs";
import { map, tap } from "rxjs/operators";
import type { Command } from "./model/commands";
import { SessionType } from "./model/session";

export type StateExchangerFactory = (sessionKey: string, participantKey: string, sessionType: SessionType) => Observable<{
  receiver: Observable<Command>;
  sender: (command: Command, participantKey?: string) => void;
}>;


export class StateExchanger {
  private readonly stompClient: RxStomp;
  private commandDestination: string;

  readonly started$: Observable<{
    receiver: Observable<Command>;
    sender: (command: Command, participantKey?: string) => void;
  }>;

  constructor(
    private readonly sessionKey: string,
    private readonly sessionType: SessionType,
    private readonly selfKey: string
  ) {
    const config = new RxStompConfig();
    config.webSocketFactory = () => new WebSocket(`ws://localhost:3030/`);
    config.connectHeaders = {
      host: "localhost",
    };
    //    config.debug = (message: string) => console.debug(message);
    // config.heartbeatIncoming = 1000;
    // config.heartbeatOutgoing = 1000;

    this.stompClient = new RxStomp();
    this.stompClient.configure(config);

    const broadcastDestination = `/sessions/${sessionKey}/broadcast`;
    const hostDestination = `/sessions/${sessionKey}/host`;
    const selfDestination = sessionType === SessionType.PARTICIPANT
      ? `/sessions/${sessionKey}/${selfKey}`
      : hostDestination;

    this.commandDestination =
      this.sessionType === SessionType.HOST
        ? broadcastDestination
        : hostDestination;

    this.started$ = this.stompClient.connected$.pipe(
      tap(() => {
        console.log("connected");
      }),
      map(() => {
        if (sessionType === SessionType.HOST) {
          this.stompClient.watch(broadcastDestination).subscribe((message) => {
            console.log(message);
          });
          return {
              receiver: this.stompClient.watch(selfDestination).pipe(
                map((message) => {
                    const command: Command = JSON.parse(message.body);
                    return command;
                    }),
                    
                ),
                sender: this.send.bind(this)
                };
        } else {
          return {
            receiver: merge(
              this.stompClient.watch(broadcastDestination),
              this.stompClient.watch(selfDestination)
            ).pipe(
              map((message) => {
                const command: Command = JSON.parse(message.body);
                return command;
              })
            ),
            sender: this.send.bind(this),
          };
        }
      })
    );
    this.stompClient.activate();
  }

  /**
   * Send the provided command to this exchanger's receivers.
   *
   * @param command The command, and current state version, to send
   */
  public send(command: Command, participantKey?: string): void {
    this.stompClient.publish({
      destination: participantKey
        ? `/sessions/${this.sessionKey}/${participantKey}`
        : this.commandDestination,
      body: JSON.stringify(command),
    });
  }

  /**
   * Stops the exchanger
   */
  public stop(): void {
    this.stompClient.deactivate();
  }
}

export const stompStateExchanger: StateExchangerFactory = (sessionKey, participantKey, sessionType) => {
    const exchanger = new StateExchanger(sessionKey, sessionType, participantKey)

    return exchanger.started$
}