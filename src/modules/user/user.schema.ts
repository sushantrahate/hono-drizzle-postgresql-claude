import { z } from 'zod';

/** POST /users body — email is lowercased/uniqueness-checked in `user.service.ts`, not here. */
export const createUserSchema = z.object({
  email: z.email(),
  name: z.string().min(1).optional(),
});

/** PATCH /users/:id body — no required fields; only `name` is updatable in this pass. */
export const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
});

/** `:id` path param shared by GET/PATCH/DELETE /users/:id. */
export const userIdParamSchema = z.object({
  id: z.uuid(),
});
