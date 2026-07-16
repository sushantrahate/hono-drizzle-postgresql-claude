import type { Context } from 'hono';
import { unifiedResponse } from 'uni-response';
import type { z } from 'zod';

import { SUCCESS } from '../../constants/messages.constants';
import { NotFoundError } from '../../errors/app-error';
import type { AppVariables } from '../../types/hono';
import type { createUserSchema, updateUserSchema, userIdParamSchema } from './user.schema';
import type { UserService } from './user.service';

type Env = { Variables: AppVariables };

// `Context<E, P, I>.req.valid(target)` only ever reads `I['out']` (see
// hono's HonoRequest<P, I['out']>) — `in` is never consumed, so it's
// omitted here rather than mirrored for no reason. This only covers plain
// (non-`z.coerce`) `json`/`param` targets; a schema that coerces its output
// would need a more faithful copy of @hono/zod-validator's `DefaultInput`.
type JsonBody<S extends z.ZodType> = { out: { json: z.output<S> } };
type ParamValues<S extends z.ZodType> = { out: { param: z.output<S> } };

/**
 * Logs update/delete attempts against a user id that turned out not to
 * exist (per the feature spec) and rethrows so the centralized error
 * handler still shapes the response — this is diagnostic logging, not
 * response branching, so it doesn't count as handler business logic.
 */
function warnIfNotFound(c: Context<Env>, action: string, id: string, error: unknown): never {
  if (error instanceof NotFoundError) {
    c.var.log.warn(`${action} attempted on non-existent user: ${id}`);
  }
  throw error;
}

/** Thin Hono handlers for `/users` — validation already ran in routes.ts; this only calls the service. */
export class UserHandler {
  constructor(private readonly userService: UserService) {}

  /** Creates a user; the service throws `ConflictError` (409) if the email is already registered. */
  createUser = async (c: Context<Env, '/', JsonBody<typeof createUserSchema>>) => {
    const input = c.req.valid('json');
    const user = await this.userService.createUser(input);
    return c.json(unifiedResponse(true, SUCCESS.USER_CREATED, user), 201);
  };

  /** Lists every user. */
  listUsers = async (c: Context<Env, '/'>) => {
    const users = await this.userService.listUsers();
    return c.json(unifiedResponse(true, SUCCESS.USERS_RETRIEVED, users), 200);
  };

  /** Fetches a user by id; the service throws `NotFoundError` (404) if it doesn't exist. */
  getUserById = async (c: Context<Env, '/:id', ParamValues<typeof userIdParamSchema>>) => {
    const { id } = c.req.valid('param');
    const user = await this.userService.getUserById(id);
    return c.json(unifiedResponse(true, SUCCESS.USER_RETRIEVED, user), 200);
  };

  /** Updates a user's name; the service throws `NotFoundError` (404) if it doesn't exist. */
  updateUser = async (
    c: Context<
      Env,
      '/:id',
      ParamValues<typeof userIdParamSchema> & JsonBody<typeof updateUserSchema>
    >,
  ) => {
    const { id } = c.req.valid('param');
    const input = c.req.valid('json');
    try {
      const user = await this.userService.updateUser(id, input);
      return c.json(unifiedResponse(true, SUCCESS.USER_UPDATED, user), 200);
    } catch (error) {
      warnIfNotFound(c, 'Update', id, error);
    }
  };

  /** Deletes a user; the service throws `NotFoundError` (404) if it doesn't exist. */
  deleteUser = async (c: Context<Env, '/:id', ParamValues<typeof userIdParamSchema>>) => {
    const { id } = c.req.valid('param');
    try {
      await this.userService.deleteUser(id);
      return c.json(unifiedResponse(true, SUCCESS.USER_DELETED));
    } catch (error) {
      warnIfNotFound(c, 'Delete', id, error);
    }
  };
}
