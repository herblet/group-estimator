import type { Patch } from "immer";
import type { Session } from "../model/session";
import type { Participant } from "./participant";
import type { Story } from "./story";

/**
 * The available types of commands
 */
export enum CommandType {
  INIT = "init",
  START = "start",
  JOIN = "join",
  ADD_PARTICIPANT = "addParticipant",
  SESSION = "session",
  UPDATE = "update",
  ADD_STORY = "addStory",
}

/**
 * A command which can be applied to change the state.
 */
export interface Command {
  type: CommandType;
  data: any;
}

/**
 * Factor methods to create commands
 */
export const Commands = {
  /**
   * Creates a {@link CommandType.START} command, which will start a new {@link SessionType.HOST} session.
   *
   * @param name The name of the user
   * @param title The title of the session
   *
   * @returns The START command
   */
  start(name: string, title: string): Command {
    return {
      type: CommandType.START,
      data: {
        name,
        title,
      },
    };
  },

  /**
   * Creates a {@link CommandType.JOIN} command, which will start a new {@link SessionType.PARTICIPANT} session.
   *
   * @param name The name of the user
   * @param key The key of the session to join
   *
   * @returns The JOIN command
   */
  join(name: string, key: string): Command {
    return {
      type: CommandType.JOIN,
      data: {
        name,
        key,
      },
    };
  },

  /**
   * Creates a {@link CommandType.ADD_PARTICIPANT} command, which will add a new {@link Participant} to the session.
   *
   * @param name The name of the new participant
   *
   * @returns The ADD_PARTICIPANT command
   */
  addParticipant(participant: Participant): Command {
    return {
      type: CommandType.ADD_PARTICIPANT,
      data: participant,
    };
  },

  /**
   * Creates a {@link CommandType.SESSION} command, which will set the provided session on the receiver.
   *
   * @param session The session to set
   * @returns The SESSION command
   */
  session(session: Session): Command {
    return {
      type: CommandType.SESSION,
      data: session,
    };
  },

  /**
   * Creates a {@link CommandType.UPDATE} command, which update the session on the receiver.
   *
   * @param patch The update to apply
   * @returns The SESSION command
   */
  update(priorVersion: number, patches: Patch[]): Command {
    return {
      type: CommandType.UPDATE,
      data: {
        priorVersion,
        patches,
      },
    };
  },

  /**
   * Creates a {@link CommandType.ADD_STORY} command, which will add a new {@link Story} to the session.
   *
   * @param story The story to add
   * @returns Tgh ADD_STORY command
   */
  addStory(story: Story) {
    return {
      type: CommandType.ADD_STORY,
      data: story,
    };
  },
};
