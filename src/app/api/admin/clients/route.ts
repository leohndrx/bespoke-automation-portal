import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/auth/roles';

export async function GET(request: NextRequest) {
  try {
    // Check if current user is admin
    const isAdminUser = await isAdmin();
    if (!isAdminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    const supabase = await createClient();
    
    // Fetch all clients
    const { data: clients, error } = await supabase
      .from('clients')
      .select('*')
      .order('company');
    
    if (error) {
      console.error('Error loading clients:', error);
      return NextResponse.json({ error: `Failed to load clients: ${error.message}` }, { status: 500 });
    }
    
    return NextResponse.json({ 
      clients: clients || []
    });
  } catch (error: any) {
    console.error('Error in clients API:', error);
    return NextResponse.json(
      { error: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
} 