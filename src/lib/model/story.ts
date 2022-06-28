import { immerable } from "immer";
import { Identified } from "./base";

export class Vote {
  constructor(
    public readonly participantKey: string,
    public readonly value: number
  ) {}
}

export class Story extends Identified<Story> {
  [immerable] = true;

  readonly version: number = 0;
  readonly votes: Vote[] = [];

  constructor(key: string, public readonly title: string) {
    super(key);
  }
}