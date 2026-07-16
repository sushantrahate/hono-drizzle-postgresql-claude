import { eq, sql } from 'drizzle-orm';
import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { db } from '../../db/client';
import type { UserRepository } from './user.repository';
import type { CreateUserInput, UpdateUserInput } from './user.types';

// Only file in this module allowed to import drizzle-orm, per coding-standards.md.
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/** Drizzle/Postgres implementation of {@link UserRepository}. */
export class DrizzleUserRepository implements UserRepository {
  /** See {@link UserRepository.findAll}. */
  async findAll() {
    return db.select().from(users);
  }

  /** See {@link UserRepository.findById}. */
  async findById(id: string) {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return user ?? null;
  }

  /** See {@link UserRepository.findByEmail}. */
  async findByEmail(email: string) {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return user ?? null;
  }

  /** See {@link UserRepository.create}. */
  async create(input: CreateUserInput) {
    const [user] = await db.insert(users).values(input).returning();
    // A single-row insert always returns exactly one row (a unique-email
    // conflict throws before returning), so this is safe.
    // biome-ignore lint/style/noNonNullAssertion: see comment above
    return user!;
  }

  /**
   * See {@link UserRepository.update}. `updatedAt` isn't part of
   * `UpdateUserInput` — refreshed here on every write, stamped by Postgres's
   * clock (not `new Date()`) so it can never land before `createdAt`
   * (also DB-stamped) if the app server and DB clocks ever drift.
   */
  async update(id: string, input: UpdateUserInput) {
    const [user] = await db
      .update(users)
      .set({ ...input, updatedAt: sql`now()` })
      .where(eq(users.id, id))
      .returning();
    return user ?? null;
  }

  /** See {@link UserRepository.delete}. */
  async delete(id: string) {
    const [deleted] = await db.delete(users).where(eq(users.id, id)).returning({ id: users.id });
    return deleted !== undefined;
  }
}
