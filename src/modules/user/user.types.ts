/** A registered user. */
export interface User {
  id: string;
  email: string;
  name: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Payload for creating a user — `email` is lowercased/uniqueness-checked in `user.service.ts`. */
export interface CreateUserInput {
  email: string;
  name?: string;
}

/** Payload for updating a user — only `name` is updatable in this pass. */
export interface UpdateUserInput {
  name?: string;
}
