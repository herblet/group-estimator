import { immerable } from "immer";
import {v4 as uuid} from "uuid";

export class Identified<T extends Identified<T>> {
  [immerable] = true;

  readonly key: string;

  constructor(key?: string) {
    this.key = key || uuid();
  }
}