/**
 * Sentry configuration
 */
export interface SentryConfig {
    dsn: string | undefined;
    environment: string;
    enabled: boolean;
}

export function getSentryConfig(): SentryConfig {
    return {
        dsn: process.env.SENTRY_DSN,
        environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || "development",
        enabled: !!process.env.SENTRY_DSN,
    };
}
