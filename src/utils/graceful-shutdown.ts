// src/utils/graceful-shutdown.ts
import { type ServerType, serve } from '@hono/node-server';

import app from '../app';
import { env } from '../config/env';
import { log } from '../config/logger.config';
import { client } from '../db/client';

const SHUTDOWN_TIMEOUT_MS = 10_000;

type ShutdownSignal = 'SIGTERM' | 'SIGINT';

/**
 * No WebSocket server exists in this boilerplate yet. When one is added,
 * close its connections/server here as part of the shutdown sequence.
 */
function closeWebSockets(): void {}

export class Server {
  private httpServer: ServerType | undefined;
  private shuttingDown = false;

  start(): void {
    this.httpServer = serve(
      {
        fetch: app.fetch,
        port: env.PORT,
      },
      (info) => {
        log.info(`Server is running on http://localhost:${info.port}`);
      },
    );

    process.on('SIGTERM', () => this.shutdown('SIGTERM'));
    process.on('SIGINT', () => this.shutdown('SIGINT'));
    process.on('uncaughtException', (err) => this.crash('uncaughtException', err));
    process.on('unhandledRejection', (reason) => this.crash('unhandledRejection', reason));
  }

  private shutdown(signal: ShutdownSignal): void {
    // SIGTERM/SIGINT can arrive more than once (e.g. a second Ctrl+C); ignore
    // repeats instead of racing multiple shutdown sequences against each other.
    if (this.shuttingDown) return;
    this.shuttingDown = true;

    log.info(`Received ${signal}, starting graceful shutdown`);

    // Belt-and-braces: if close()/client.end() never call back (e.g. a
    // connection that never drains), force-exit rather than hang forever.
    // unref() so this timer alone can't keep the process alive once
    // everything else has finished.
    const forceExitTimer = setTimeout(() => {
      log.error(`Graceful shutdown timed out after ${SHUTDOWN_TIMEOUT_MS}ms, forcing exit`);
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);
    forceExitTimer.unref();

    // server.close() stops accepting new connections immediately but waits
    // for in-flight requests/keep-alive sockets to finish before invoking
    // this callback — that's what makes the shutdown "graceful".
    this.httpServer?.close((err) => {
      if (err) {
        log.withError(err).error('Error while closing HTTP server');
      } else {
        log.info('HTTP server closed, no longer accepting connections');
      }

      closeWebSockets();

      client
        .end()
        .then(() => log.info('Database connection closed'))
        .catch((dbErr: unknown) =>
          log.withError(dbErr).error('Error while closing database connection'),
        )
        .finally(() => {
          clearTimeout(forceExitTimer);
          log.info('Graceful shutdown complete');
          process.exit(0);
        });
    });
  }

  private crash(source: 'uncaughtException' | 'unhandledRejection', error: unknown): void {
    // No graceful cleanup here on purpose: once the process state is this
    // unreliable, attempting server.close()/client.end() risks hanging or
    // masking the real error, per Node's own guidance on these events.
    log.withError(error).error(`${source} — exiting immediately`);
    process.exit(1);
  }
}
