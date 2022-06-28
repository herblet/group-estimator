import { RxStompConfig, RxStomp  } from "@stomp/rx-stomp";
import { take, tap } from "rxjs/operators";

export class Socket {
  client: RxStomp;

  constructor(session: string) {
    console.log("Connecting websocket...")

    const config = new RxStompConfig()

    config.brokerURL = "ws://localhost:3030/"

    config.connectHeaders = {
      "host" : "localhost",
    }

    this.client = new RxStomp()
    this.client.configure(config)

    this.client.connected$.pipe(take(1)).subscribe(() => {
      console.log("Connected to Stomp Server");
    });

    this.client.activate()
  }

  public send(message: string) {
  }
}

export const connect = (session: string) => new Socket(session);
