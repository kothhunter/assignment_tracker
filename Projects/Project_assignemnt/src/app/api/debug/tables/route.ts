import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  try {
    // Check if environment variables are set
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json({
        error: 'Missing Supabase environment variables',
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

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
              // Ignore cookie setting errors
            }
          },
        },
      }
    );

    const tableTests = {
      timestamp: new Date().toISOString(),
      tables: {} as Record<string, any>
    };

    // Test each table individually
    const tablesToTest = [
      'user_profiles',
      'classes', 
      'assignments',
      'assignment_plans',
      'plan_refinement_messages',
      'files'
    ];

    for (const tableName of tablesToTest) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(0); // Just check if table exists, don't fetch data

        tableTests.tables[tableName] = {
          exists: !error,
          error: error?.message || null,
          status: error ? 'missing' : 'exists'
        };
      } catch (err) {
        tableTests.tables[tableName] = {
          exists: false,
          error: err instanceof Error ? err.message : 'Unknown error',
          status: 'error'
        };
      }
    }

    return NextResponse.json(tableTests);

  } catch (error) {
    return NextResponse.json({
      error: 'Table check failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}