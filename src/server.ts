// src/server.ts

// env validation
import './config/env';

import { serve } from '@hono/node-server'
import app from './app'

import { env } from './config/env';

const PORT = Number(env.PORT) || 4000;

serve({
  fetch: app.fetch,
  port: PORT,
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})