import { immerable } from "immer";
import { Identified } from "./base";
import type { Participant } from "./participant";
import type { Story } from "./story";

export enum SessionType {
  PARTICIPANT = "participant",
  HOST = "host"
}

export class Session extends Identified<Session> {
  [immerable] = true;

  readonly version: number = 0;
  readonly title: string;
  readonly participants: Participant[] = [];
  readonly stories: Story[] = [];

  constructor(key?: string) {
    super(key);
  }
}
