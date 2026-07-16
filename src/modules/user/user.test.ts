import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';

import { ERROR } from '@/constants/messages.constants';
import { ConflictError, NotFoundError } from '@/errors/app-error';
import type { UserRepository } from '@/modules/user/user.repository';
import { UserService } from '@/modules/user/user.service';
import type { CreateUserInput, UpdateUserInput, User } from '@/modules/user/user.types';

// In-memory stand-in for DrizzleUserRepository so the service is tested
// against the `UserRepository` port only, with no real DB.
class FakeUserRepository implements UserRepository {
  private readonly users = new Map<string, User>();

  async findAll(): Promise<User[]> {
    return [...this.users.values()];
  }

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) ?? null;
  }

  async findByEmail(email: string): Promise<User | null> {
    return [...this.users.values()].find((user) => user.email === email) ?? null;
  }

  async create(input: CreateUserInput): Promise<User> {
    const user: User = {
      id: randomUUID(),
      email: input.email,
      name: input.name ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  async update(id: string, input: UpdateUserInput): Promise<User | null> {
    const existing = this.users.get(id);
    if (!existing) {
      return null;
    }
    const updated: User = { ...existing, ...input, updatedAt: new Date() };
    this.users.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return this.users.delete(id);
  }
}

function buildService() {
  return new UserService(new FakeUserRepository());
}

describe('UserService', () => {
  it('creates a user', async () => {
    const service = buildService();
    const user = await service.createUser({ email: 'ada@example.com', name: 'Ada' });
    expect(user).toMatchObject({ email: 'ada@example.com', name: 'Ada' });
  });

  it('rejects creating a user with a duplicate email', async () => {
    const service = buildService();
    await service.createUser({ email: 'ada@example.com' });

    await expect(service.createUser({ email: 'ada@example.com' })).rejects.toThrow(ConflictError);
    await expect(service.createUser({ email: 'ada@example.com' })).rejects.toThrow(
      ERROR.EMAIL_ALREADY_IN_USE,
    );
  });

  it('gets an existing user by id', async () => {
    const service = buildService();
    const created = await service.createUser({ email: 'ada@example.com', name: 'Ada' });

    const found = await service.getUserById(created.id);
    expect(found).toEqual(created);
  });

  it('rejects getting a non-existent user', async () => {
    const service = buildService();

    await expect(service.getUserById(randomUUID())).rejects.toThrow(NotFoundError);
  });

  it('updates an existing user', async () => {
    const service = buildService();
    const created = await service.createUser({ email: 'ada@example.com' });

    const updated = await service.updateUser(created.id, { name: 'Ada Lovelace' });
    expect(updated.name).toBe('Ada Lovelace');
  });

  it('rejects updating a non-existent user', async () => {
    const service = buildService();

    await expect(service.updateUser(randomUUID(), { name: 'Nobody' })).rejects.toThrow(
      NotFoundError,
    );
  });

  it('deletes an existing user', async () => {
    const service = buildService();
    const created = await service.createUser({ email: 'ada@example.com' });

    await expect(service.deleteUser(created.id)).resolves.toBeUndefined();
    await expect(service.getUserById(created.id)).rejects.toThrow(NotFoundError);
  });

  it('rejects deleting a non-existent user', async () => {
    const service = buildService();

    await expect(service.deleteUser(randomUUID())).rejects.toThrow(NotFoundError);
  });
});
