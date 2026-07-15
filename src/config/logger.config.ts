// src/config/logger.config.ts

import { getSimplePrettyTerminal } from '@loglayer/transport-simple-pretty-terminal';
import { ConsoleTransport, LogLayer } from 'loglayer';

import { env } from './env';

const isProduction = env.NODE_ENV === 'production';
const level = env.LOG_LEVEL ?? 'info';

export const log = new LogLayer({
  transport: [
    getSimplePrettyTerminal({
      runtime: 'node',
      enabled: !isProduction,
      level,
    }),
    new ConsoleTransport({
      logger: console,
      enabled: isProduction,
      level,
    }),
  ],
});
