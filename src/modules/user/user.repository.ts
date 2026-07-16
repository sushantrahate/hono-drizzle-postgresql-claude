import type { CreateUserInput, UpdateUserInput, User } from './user.types';

/**
 * Port for user persistence — `user.service.ts` depends only on this
 * interface, never on `user.repository.drizzle.ts` directly, so the ORM
 * stays swappable.
 */
export interface UserRepository {
  /** Returns every user. */
  findAll(): Promise<User[]>;

  /** Returns the user with this id, or `null` if none exists. */
  findById(id: string): Promise<User | null>;

  /** Returns the user with this email, or `null` if none exists. */
  findByEmail(email: string): Promise<User | null>;

  /** Inserts a new user and returns it. */
  create(input: CreateUserInput): Promise<User>;

  /** Updates the user with this id and returns it, or `null` if none exists. */
  update(id: string, input: UpdateUserInput): Promise<User | null>;

  /** Deletes the user with this id, returning `true` if a user was deleted. */
  delete(id: string): Promise<boolean>;
}
