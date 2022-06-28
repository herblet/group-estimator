import { describe, expect, it } from 'vitest';

import { Session } from './session';
import { createParticipant } from './participant';
import produce from 'immer';

describe("The model", async () => {

  it('Passed key passed is kept', () => {
    const session = new Session('abcd');
    
    expect(session.key).toBe('abcd');
  });
  
  it('If no key passed, one is generated', () => {
    const session = new Session();
    
    expect(session.key).not.toBeUndefined();
  });
  
  it('Can add participant', () => {
    const session = produce(new Session('abcd'), (draft) => {
      draft.title = 'Test Session';
    });
    
    const alice = createParticipant('Alice');
    const clonedWith = produce(session, (draft) => {
      draft.participants.push(alice);
    });
    
    expect(session.participants).toHaveLength(0);
    
    expect(clonedWith.participants).toHaveLength(1);
    expect(clonedWith.participants[0].name).toBe('Alice');
  });
  
  it('Can update using immer', () => {
    let session = produce(new Session('abcd'), (draft) => {
      draft.title = 'Test Session';
    });
    
    const alice = createParticipant('Alice');
    
    session = produce(session, (draft) => {
      draft.participants.push(alice);
    });
    
    const updated = produce(session, (draft) => {
      draft.participants[0].name = 'Hatter';
    });
    
    expect(updated.participants[0].name).toBe('Hatter');
    expect(session.participants[0].name).toBe('Alice');
  });
  
})