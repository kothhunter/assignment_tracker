import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const start = Date.now();
  
  try {
    // Basic health check
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0',
      database: '',
      openai: '',
      responseTime: '',
    };

    // Check database connectivity
    try {
      const supabase = createClient();
      const { error } = await supabase.from('user_profiles').select('count').limit(1);
      
      if (error && !error.message.includes('RLS')) {
        // Only fail if it's not an RLS policy error (which indicates DB is working)
        throw error;
      }
      
      health.database = 'connected';
    } catch (dbError) {
      console.error('Database health check failed:', dbError);
      health.database = 'disconnected';
      health.status = 'degraded';
    }

    // Check OpenAI API availability
    try {
      if (process.env.OPENAI_API_KEY) {
        // Simple API key validation (don't make actual API call in health check)
        health.openai = process.env.OPENAI_API_KEY.startsWith('sk-') ? 'configured' : 'misconfigured';
      } else {
        health.openai = 'not-configured';
        health.status = 'degraded';
      }
    } catch (aiError) {
      console.error('OpenAI health check failed:', aiError);
      health.openai = 'error';
      health.status = 'degraded';
    }

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
    console.error('Health check failed:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime: `${Date.now() - start}ms`
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