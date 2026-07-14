import { Hono } from 'hono'

// import { env } from './config/env';

const app = new Hono()

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

export default app