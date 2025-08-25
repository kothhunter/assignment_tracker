import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  try {
    const diagnostics = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      supabaseConfig: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
        anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing',
        serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing',
        urlValue: process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 30) + '...' || 'Not set'
      },
      connection: {
        status: 'unknown' as 'unknown' | 'success' | 'failed',
        error: null as string | null
      },
      auth: {
        hasSession: false,
        user: null as any,
        error: null as string | null
      }
    };

    // Check if environment variables are set
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      diagnostics.connection.status = 'failed';
      diagnostics.connection.error = 'Missing required environment variables';
      return NextResponse.json(diagnostics, { status: 500 });
    }

    // Check for placeholder values
    if (process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder') || 
        process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project')) {
      diagnostics.connection.status = 'failed';
      diagnostics.connection.error = 'Environment variables contain placeholder values';
      return NextResponse.json(diagnostics, { status: 500 });
    }

    // Try to create Supabase client
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options);
              });
            } catch {
              // Ignore cookie setting errors in Server Components
            }
          },
        },
      }
    );

    diagnostics.connection.status = 'success';

    // Try to get session
    try {
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      
      if (authError) {
        diagnostics.auth.error = authError.message;
      } else {
        diagnostics.auth.hasSession = !!session;
        if (session) {
          diagnostics.auth.user = {
            id: session.user.id,
            email: session.user.email,
            metadata: session.user.user_metadata
          };
        }
      }
    } catch (error) {
      diagnostics.auth.error = error instanceof Error ? error.message : 'Unknown auth error';
    }

    // Try a simple database query to test connection
    try {
      const { data, error: queryError } = await supabase
        .from('user_profiles')
        .select('count')
        .limit(1);
      
      if (queryError) {
        diagnostics.connection.error = `Database query failed: ${queryError.message}`;
        diagnostics.connection.status = 'failed';
      }
    } catch (error) {
      diagnostics.connection.error = `Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      diagnostics.connection.status = 'failed';
    }

    return NextResponse.json(diagnostics, { 
      status: diagnostics.connection.status === 'failed' ? 500 : 200 
    });

  } catch (error) {
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      error: 'Diagnostic failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}