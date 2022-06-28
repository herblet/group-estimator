import {v4 as uuid} from "uuid";

export interface Participant {
  key: string;
  name: string;
}

export function createParticipant(name: string): Participant {
  return {
    key: uuid(),
    name,
  }
}
