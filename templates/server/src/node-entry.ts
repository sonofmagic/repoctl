import { serve } from '@hono/node-server'
import { consola } from 'consola'
import { logger } from 'hono/logger'
import { app } from './app.ts'
import { port } from './config.ts'

app.use(logger())
serve({
  fetch: app.fetch,
  port,
})

consola.success(`Server listening on http://localhost:${port}`)
