import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Find the client associated with this user
    const { data: clientUser, error: clientUserError } = await supabase
      .from('client_users')
      .select('client_id')
      .eq('user_id', user.id)
      .single();
    
    if (clientUserError && clientUserError.code !== 'PGRST116') {
      // PGRST116 is "no rows returned" - that's fine, user might not be associated with a client
      console.error('Error loading client user:', clientUserError);
      return NextResponse.json({ error: `Failed to load client user: ${clientUserError.message}` }, { status: 500 });
    }
    
    // If user is associated with a client, fetch the client details
    if (clientUser?.client_id) {
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientUser.client_id)
        .single();
      
      if (clientError) {
        console.error('Error loading client:', clientError);
        return NextResponse.json({ error: `Failed to load client: ${clientError.message}` }, { status: 500 });
      }
      
      return NextResponse.json({ 
        clients: client ? [client] : []
      });
    }
    
    // User is not associated with any client
    return NextResponse.json({ 
      clients: []
    });
  } catch (error: any) {
    console.error('Error in client API:', error);
    return NextResponse.json(
      { error: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
} 