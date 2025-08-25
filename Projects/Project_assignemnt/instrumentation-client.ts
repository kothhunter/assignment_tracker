import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Set tracesSampleRate to 1.0 to capture 100%
  // of the transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Set profilesSampleRate to 1.0 to profile every transaction.
  // Since profilesSampleRate is relative to tracesSampleRate,
  // the final profiling rate can be computed as tracesSampleRate * profilesSampleRate
  // For example, a tracesSampleRate of 0.5 and profilesSampleRate of 0.5 would
  // result in 25% of transactions being profiled (0.5*0.5=0.25)
  profilesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Capture Replay for 10% of all sessions,
  // plus for 100% of sessions with an error
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // You can remove this option if you're not planning to use the Sentry webpack plugin for uploading source maps.
  debug: process.env.NODE_ENV === "development",

  environment: process.env.NODE_ENV,

  beforeSend(event, hint) {
    // Filter out development errors and noise
    if (process.env.NODE_ENV === "development") {
      // Skip certain types of errors in development
      if (event.exception) {
        const error = hint.originalException;
        if (error instanceof Error) {
          // Skip HMR and development-only errors
          if (error.message.includes('ResizeObserver loop limit exceeded') ||
              error.message.includes('Non-Error promise rejection captured') ||
              error.message.includes('Loading chunk')) {
            return null;
          }
        }
      }
    }
    return event;
  },

  integrations: [
    Sentry.replayIntegration(),
  ],
});

// Export router transition hook as required by Sentry
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;