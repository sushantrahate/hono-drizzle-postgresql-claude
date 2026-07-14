// src/server.ts

// env validation
import './config/env';

import { serve } from '@hono/node-server'
import app from './app'

import { env } from './config/env';
import { log } from './config/logger.config';

const PORT = Number(env.PORT) || 4000;

serve({
  fetch: app.fetch,
  port: PORT,
}, (info) => {
  log.info(`Server is running on http://localhost:${info.port}`)
})