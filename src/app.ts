import { Hono } from 'hono'

// import { env } from './config/env';
import { requestLogger } from './middleware/request-logger.middleware';
import type { AppVariables } from './types/hono';

const app = new Hono<{ Variables: AppVariables }>()

app.use(requestLogger);

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

export default app