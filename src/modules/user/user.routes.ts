import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';

import type { AppVariables } from '../../types/hono';
import { UserHandler } from './user.handler';
import { DrizzleUserRepository } from './user.repository.drizzle';
import { createUserSchema, updateUserSchema, userIdParamSchema } from './user.schema';
import { UserService } from './user.service';

// Composition root for this module: repository -> service -> handler, wired once.
const userRepository = new DrizzleUserRepository();
const userService = new UserService(userRepository);
const userHandler = new UserHandler(userService);

export const userRoutes = new Hono<{ Variables: AppVariables }>();

// POST /users — create a user; 409 if the email is already registered
userRoutes.post('/', zValidator('json', createUserSchema), userHandler.createUser);

// GET /users — list all users
userRoutes.get('/', userHandler.listUsers);

// GET /users/:id — get a single user by id; 404 if not found
userRoutes.get('/:id', zValidator('param', userIdParamSchema), userHandler.getUserById);

// PATCH /users/:id — update a user's name; 404 if not found
userRoutes.patch(
  '/:id',
  zValidator('param', userIdParamSchema),
  zValidator('json', updateUserSchema),
  userHandler.updateUser,
);

// DELETE /users/:id — delete a user; 404 if not found
userRoutes.delete('/:id', zValidator('param', userIdParamSchema), userHandler.deleteUser);

export default userRoutes;
