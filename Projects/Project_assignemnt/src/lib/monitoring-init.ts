import { initializeMonitoring } from './monitoring';
import { analytics } from './analytics';

// Initialize monitoring systems
export function initializeAppMonitoring() {
  try {
    // Initialize general monitoring
    initializeMonitoring();

    // Set up analytics context
    if (typeof window !== 'undefined') {
      // Track initial page load
      analytics.page(window.location.pathname, {
        referrer: document.referrer,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      });

      // Set up performance observer for Core Web Vitals
      if ('PerformanceObserver' in window) {
        try {
          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (entry.entryType === 'measure') {
                analytics.performance(entry.name, entry.duration, {
                  type: 'core-web-vital'
                });
              }
            }
          });
          
          observer.observe({ entryTypes: ['measure'] });
        } catch (e) {
          console.log('Performance Observer not fully supported');
        }
      }
    }

    console.log('✓ Application monitoring initialized');
  } catch (error) {
    console.error('Failed to initialize monitoring:', error);
  }
}

// Health check scheduler for production environments  
export function scheduleHealthChecks() {
  if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
    // Check system health every 5 minutes
    setInterval(async () => {
      try {
        const response = await fetch('/api/health');
        const health = await response.json();
        
        if (health.status !== 'healthy') {
          console.warn('System health check failed:', health);
        }
      } catch (error) {
        console.error('Health check request failed:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes
  }
}