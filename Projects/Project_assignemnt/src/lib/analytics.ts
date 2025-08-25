import * as Sentry from '@sentry/nextjs';

// Analytics events for tracking user interactions
export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  userId?: string;
}

// Custom analytics provider - can be extended to integrate with services like Mixpanel, Amplitude, etc.
class Analytics {
  private isEnabled: boolean;
  
  constructor() {
    this.isEnabled = process.env.NODE_ENV === 'production';
  }

  // Track user events
  track(event: AnalyticsEvent) {
    if (!this.isEnabled) {
      console.log('Analytics (dev):', event);
      return;
    }

    try {
      // Send to Sentry as breadcrumb for debugging context
      Sentry.addBreadcrumb({
        message: event.name,
        category: 'user-action',
        level: 'info',
        data: event.properties,
      });

      // Here you would integrate with your analytics service
      // Example: Mixpanel, Amplitude, Google Analytics, etc.
      // mixpanel.track(event.name, event.properties);
      
      console.log('Analytics tracked:', event);
    } catch (error) {
      console.error('Analytics tracking failed:', error);
      Sentry.captureException(error);
    }
  }

  // Track page views
  page(pageName: string, properties?: Record<string, any>) {
    this.track({
      name: 'page_viewed',
      properties: {
        page: pageName,
        ...properties,
      },
    });
  }

  // Track user identification
  identify(userId: string, traits?: Record<string, any>) {
    if (!this.isEnabled) {
      console.log('Analytics identify (dev):', { userId, traits });
      return;
    }

    try {
      // Set user context in Sentry
      Sentry.setUser({ id: userId, ...traits });
      
      // Here you would identify the user in your analytics service
      // mixpanel.identify(userId);
      // mixpanel.people.set(traits);
      
      console.log('User identified:', userId);
    } catch (error) {
      console.error('Analytics identify failed:', error);
      Sentry.captureException(error);
    }
  }

  // Track application errors (in addition to Sentry)
  error(error: Error, context?: Record<string, any>) {
    console.error('Application error:', error, context);
    
    // Send to Sentry
    Sentry.captureException(error, {
      contexts: {
        application: context,
      },
    });
    
    // Track as event for business intelligence
    this.track({
      name: 'error_occurred',
      properties: {
        error_name: error.name,
        error_message: error.message,
        ...context,
      },
    });
  }

  // Track performance metrics
  performance(metric: string, value: number, tags?: Record<string, string>) {
    try {
      // Send to Sentry as breadcrumb instead of metric (metrics API not available in this version)
      Sentry.addBreadcrumb({
        message: `Performance: ${metric}`,
        category: 'performance',
        level: 'info',
        data: {
          metric,
          value,
          unit: 'ms',
          tags,
        },
      });

      this.track({
        name: 'performance_metric',
        properties: {
          metric,
          value,
          tags,
        },
      });
    } catch (error) {
      console.error('Performance tracking failed:', error);
    }
  }
}

// Export singleton instance
export const analytics = new Analytics();

// Convenience functions for common events
export const trackEvent = (name: string, properties?: Record<string, any>) => {
  analytics.track({ name, properties });
};

export const trackPageView = (pageName: string, properties?: Record<string, any>) => {
  analytics.page(pageName, properties);
};

export const identifyUser = (userId: string, traits?: Record<string, any>) => {
  analytics.identify(userId, traits);
};

export const trackError = (error: Error, context?: Record<string, any>) => {
  analytics.error(error, context);
};

export const trackPerformance = (metric: string, value: number, tags?: Record<string, string>) => {
  analytics.performance(metric, value, tags);
};

// Common event names for consistency
export const EVENTS = {
  // Authentication
  USER_SIGNED_IN: 'user_signed_in',
  USER_SIGNED_OUT: 'user_signed_out',
  USER_REGISTERED: 'user_registered',

  // Assignment Management
  ASSIGNMENT_CREATED: 'assignment_created',
  ASSIGNMENT_UPDATED: 'assignment_updated',
  ASSIGNMENT_DELETED: 'assignment_deleted',
  ASSIGNMENT_VIEWED: 'assignment_viewed',

  // AI Features
  AI_PLAN_GENERATED: 'ai_plan_generated',
  AI_PLAN_REFINED: 'ai_plan_refined',
  AI_SUBTASKS_GENERATED: 'ai_subtasks_generated',

  // File Operations
  SYLLABUS_UPLOADED: 'syllabus_uploaded',
  SYLLABUS_PARSED: 'syllabus_parsed',

  // Class Management  
  CLASS_CREATED: 'class_created',
  CLASS_UPDATED: 'class_updated',
  CLASS_DELETED: 'class_deleted',

  // Performance
  PAGE_LOAD_TIME: 'page_load_time',
  API_RESPONSE_TIME: 'api_response_time',
  
  // Errors
  API_ERROR: 'api_error',
  CLIENT_ERROR: 'client_error',
} as const;