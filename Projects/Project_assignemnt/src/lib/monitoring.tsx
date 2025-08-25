import * as Sentry from '@sentry/nextjs';
import * as React from 'react';
import { trackPerformance, trackError, EVENTS } from './analytics';

// Performance monitoring utilities
export class PerformanceMonitor {
  private static measurements = new Map<string, number>();

  // Start timing an operation
  static startTiming(operation: string): void {
    this.measurements.set(operation, performance.now());
  }

  // End timing and record the metric
  static endTiming(operation: string, tags?: Record<string, string>): number {
    const startTime = this.measurements.get(operation);
    if (!startTime) {
      console.warn(`No start time found for operation: ${operation}`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.measurements.delete(operation);

    // Track to both Sentry and analytics
    trackPerformance(operation, duration, tags);
    
    return duration;
  }

  // Monitor a function's execution time
  static async monitor<T>(
    operation: string,
    fn: () => Promise<T>,
    tags?: Record<string, string>
  ): Promise<T> {
    this.startTiming(operation);
    
    try {
      const result = await fn();
      const duration = this.endTiming(operation, tags);
      
      console.log(`${operation} completed in ${duration.toFixed(2)}ms`);
      return result;
    } catch (error) {
      this.endTiming(operation, { ...tags, status: 'error' });
      throw error;
    }
  }
}

// Error boundary for React components
export function withErrorBoundary<T extends React.ComponentType<any>>(
  Component: T
): T {
  const WrappedComponent = Sentry.withErrorBoundary(Component, {
    fallback: DefaultErrorFallback,
    showDialog: process.env.NODE_ENV === 'development',
  });

  return WrappedComponent as T;
}

// Default error fallback component
function DefaultErrorFallback({ error, resetError }: { error: unknown; resetError(): void }) {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
  
  return (
    <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
      <h2 className="text-lg font-semibold text-red-800 mb-2">Something went wrong</h2>
      <p className="text-red-600 mb-4">
        {process.env.NODE_ENV === 'development' 
          ? errorMessage 
          : 'An unexpected error occurred. Please try again.'}
      </p>
      <button 
        onClick={resetError}
        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
      >
        Try again
      </button>
    </div>
  );
}

// API monitoring wrapper
export async function monitoredApiCall<T>(
  name: string,
  apiCall: () => Promise<T>,
  options?: {
    timeout?: number;
    retries?: number;
    tags?: Record<string, string>;
  }
): Promise<T> {
  const { timeout = 30000, retries = 0, tags = {} } = options || {};
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await PerformanceMonitor.monitor(
        `api_${name}`,
        async () => {
          // Add timeout wrapper
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('API call timeout')), timeout);
          });

          return Promise.race([apiCall(), timeoutPromise]);
        },
        { ...tags, attempt: attempt.toString() }
      );
    } catch (error) {
      lastError = error as Error;
      
      trackError(lastError, {
        api_name: name,
        attempt,
        max_attempts: retries + 1,
        ...tags,
      });

      if (attempt === retries) {
        throw lastError;
      }

      // Exponential backoff for retries
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }

  throw lastError;
}

// Database monitoring
export function monitorDatabase() {
  return {
    async query<T>(name: string, queryFn: () => Promise<T>): Promise<T> {
      return PerformanceMonitor.monitor(
        `db_${name}`,
        queryFn,
        { type: 'database' }
      );
    }
  };
}

// Custom error classes for better error handling
export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public endpoint: string,
    public response?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public value: any
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Health check utilities
export async function checkSystemHealth() {
  try {
    const response = await fetch('/api/health');
    const health = await response.json();
    
    if (health.status !== 'healthy') {
      Sentry.captureMessage(`System health degraded: ${JSON.stringify(health)}`, 'warning');
    }
    
    return health;
  } catch (error) {
    const healthError = new Error('Health check failed');
    trackError(healthError, { original_error: (error as Error).message });
    throw healthError;
  }
}

// Resource usage monitoring
export function monitorResourceUsage() {
  if (typeof window !== 'undefined' && 'performance' in window) {
    // Monitor memory usage (Chrome only)
    if ('memory' in window.performance) {
      const memory = (window.performance as any).memory;
      trackPerformance('browser_memory_used', memory.usedJSHeapSize, {
        type: 'browser',
        unit: 'bytes'
      });
    }

    // Monitor connection info
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      trackPerformance('network_downlink', connection.downlink, {
        type: 'network',
        effective_type: connection.effectiveType
      });
    }
  }
}

// Initialize monitoring
export function initializeMonitoring() {
  // Set up error handlers
  if (typeof window !== 'undefined') {
    window.addEventListener('error', (event) => {
      trackError(new Error(event.message), {
        filename: event.filename,
        line: event.lineno,
        column: event.colno,
        type: 'javascript_error'
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      trackError(new Error(event.reason), {
        type: 'unhandled_promise_rejection'
      });
    });

    // Monitor page performance
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        trackPerformance('page_load_time', navigation.loadEventEnd - navigation.fetchStart, {
          type: 'page_performance'
        });

        trackPerformance('dom_content_loaded', navigation.domContentLoadedEventEnd - navigation.fetchStart, {
          type: 'page_performance'
        });
      }, 1000);
    });
  }

  console.log('Monitoring initialized');
}