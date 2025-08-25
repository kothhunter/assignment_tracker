import { createClient } from '@/lib/supabase';

export async function testSupabaseConnection() {
  try {
    const supabase = createClient();
    
    // Test basic connection
    console.log('🔍 Testing Supabase connection...');
    
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    console.log('Session:', session ? `User: ${session.user.id}` : 'No session');
    
    if (sessionError) {
      console.error('Session error:', sessionError);
      return { success: false, error: `Session error: ${sessionError.message}` };
    }

    if (!session) {
      return { success: false, error: 'No active session' };
    }

    // Test database query
    const { data, error } = await supabase
      .from('classes')
      .select('count(*)')
      .eq('user_id', session.user.id);

    if (error) {
      console.error('Database query error:', error);
      return { success: false, error: `Database error: ${error.message}` };
    }

    console.log('✅ Database connection successful');
    return { success: true, data };
    
  } catch (error) {
    console.error('❌ Connection test failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}