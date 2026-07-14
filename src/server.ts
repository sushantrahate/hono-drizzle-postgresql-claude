// src/server.ts

// env validation
import './config/env';

import { Server } from './utils/graceful-shutdown';

new Server().start();
