import { immerable } from "immer";
import type { Participant } from "./participant";
import type { Session, SessionType } from "./session";

export class State {
    [immerable] = true;

    readonly self? : Participant;
    readonly sessionType? : SessionType;
    readonly session? : Session; 
}