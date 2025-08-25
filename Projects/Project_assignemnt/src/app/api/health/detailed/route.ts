import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const start = Date.now();
  
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024),
      },
      checks: {} as any,
      responseTime: '',
    };

    // Database health check with detailed info
    try {
      const supabase = createClient();
      const dbStart = Date.now();
      
      // Test basic connectivity
      const { data: profiles, error } = await supabase
        .from('user_profiles')
        .select('count')
        .limit(1);
      
      if (error && !error.message.includes('RLS')) {
        throw error;
      }

      // Test classes table
      const { error: classesError } = await supabase
        .from('classes')
        .select('count')
        .limit(1);

      health.checks.database = {
        status: 'healthy',
        responseTime: `${Date.now() - dbStart}ms`,
        tables: {
          user_profiles: !error ? 'accessible' : 'rls-protected',
          classes: !classesError ? 'accessible' : 'rls-protected',
        }
      };
    } catch (dbError) {
      console.error('Detailed database check failed:', dbError);
      health.checks.database = {
        status: 'unhealthy',
        error: dbError instanceof Error ? dbError.message : 'Unknown database error'
      };
      health.status = 'degraded';
    }

    // OpenAI API health check
    try {
      const aiStart = Date.now();
      
      if (!process.env.OPENAI_API_KEY) {
        health.checks.openai = {
          status: 'not-configured',
          message: 'OPENAI_API_KEY environment variable not set'
        };
        health.status = 'degraded';
      } else if (!process.env.OPENAI_API_KEY.startsWith('sk-')) {
        health.checks.openai = {
          status: 'misconfigured',
          message: 'OPENAI_API_KEY does not appear to be valid'
        };
        health.status = 'degraded';
      } else {
        health.checks.openai = {
          status: 'configured',
          responseTime: `${Date.now() - aiStart}ms`,
          keyLength: process.env.OPENAI_API_KEY.length,
        };
      }
    } catch (aiError) {
      console.error('OpenAI detailed check failed:', aiError);
      health.checks.openai = {
        status: 'error',
        error: aiError instanceof Error ? aiError.message : 'Unknown AI error'
      };
      health.status = 'degraded';
    }

    // Environment variables check
    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'OPENAI_API_KEY'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    health.checks.environment = {
      status: missingVars.length === 0 ? 'healthy' : 'degraded',
      required: requiredEnvVars.length,
      configured: requiredEnvVars.length - missingVars.length,
      missing: missingVars
    };

    if (missingVars.length > 0) {
      health.status = 'degraded';
    }

    // System resources
    health.checks.system = {
      status: 'healthy',
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      pid: process.pid,
    };

    // Response time
    health.responseTime = `${Date.now() - start}ms`;

    return NextResponse.json(health, { 
      status: health.status === 'healthy' ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('Detailed health check failed:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime: `${Date.now() - start}ms`,
      stack: process.env.NODE_ENV === 'development' ? (error as Error)?.stack : undefined
    }, { 
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  }
}