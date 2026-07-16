import { ERROR } from '../../constants/messages.constants';
import { ConflictError, NotFoundError } from '../../errors/app-error';
import type { UserRepository } from './user.repository';
import type { CreateUserInput, UpdateUserInput, User } from './user.types';

/**
 * User business logic — enforces rules the repository layer doesn't know
 * about (email uniqueness, existence checks), so `user.handler.ts` never
 * branches on DB state itself. Depends only on the `UserRepository`
 * interface, never the Drizzle implementation.
 */
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  /** Returns every user. */
  async listUsers(): Promise<User[]> {
    return this.userRepository.findAll();
  }

  /**
   * Returns a single user by id.
   * @throws {NotFoundError} if no user has this id
   */
  async getUserById(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundError(ERROR.USER_NOT_FOUND);
    }
    return user;
  }

  /**
   * Creates a user after lowercasing the email and verifying it isn't
   * already registered — email uniqueness is a business rule, not a DB
   * constraint the caller should have to interpret.
   * @throws {ConflictError} if the email is already registered
   */
  async createUser(input: CreateUserInput): Promise<User> {
    const email = input.email.toLowerCase();
    const existing = await this.userRepository.findByEmail(email);
    if (existing) {
      throw new ConflictError(ERROR.EMAIL_ALREADY_IN_USE);
    }
    return this.userRepository.create({ ...input, email });
  }

  /**
   * Updates a user's name.
   * @throws {NotFoundError} if no user has this id
   */
  async updateUser(id: string, input: UpdateUserInput): Promise<User> {
    const updated = await this.userRepository.update(id, input);
    if (!updated) {
      throw new NotFoundError(ERROR.USER_NOT_FOUND);
    }
    return updated;
  }

  /**
   * Deletes a user.
   * @throws {NotFoundError} if no user has this id
   */
  async deleteUser(id: string): Promise<void> {
    const deleted = await this.userRepository.delete(id);
    if (!deleted) {
      throw new NotFoundError(ERROR.USER_NOT_FOUND);
    }
  }
}
