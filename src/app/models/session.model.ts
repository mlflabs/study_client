import { ID } from '@datorama/akita';

export interface Session {
  id: ID;
  timestamp?: Date;
  email: string;
  firstName?: string;
  lastName?: string;
  token: string;
}


export function createSession({
  id = null, timestamp = null, email = '', token = ''
}: Partial<Session>) {
  return {
    id,
    timestamp,
    email,
    token
  };
}
