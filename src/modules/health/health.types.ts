/** Result of a health check — overall status plus the individual dependency checks behind it. */
export interface HealthStatus {
  status: 'ok' | 'error';
  uptime: number;
  timestamp: string;
  database: 'ok' | 'error';
}
