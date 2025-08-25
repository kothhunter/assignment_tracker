export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Server-side Sentry configuration
    const { init } = await import('@sentry/nextjs');
    
    init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
      profilesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
      debug: process.env.NODE_ENV === "development",
      environment: process.env.NODE_ENV,
      beforeSend(event, hint) {
        if (process.env.NODE_ENV === "development") {
          if (event.exception) {
            const error = hint.originalException;
            if (error instanceof Error) {
              if (error.message.includes('ENOENT') ||
                  error.message.includes('fetch failed') ||
                  error.message.includes('connect ECONNREFUSED')) {
                return null;
              }
            }
          }
        }
        return event;
      },
    });
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    // Edge runtime Sentry configuration
    const { init } = await import('@sentry/nextjs');
    
    init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
      debug: process.env.NODE_ENV === "development",
      environment: process.env.NODE_ENV,
    });
  }
}