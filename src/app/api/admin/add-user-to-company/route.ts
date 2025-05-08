import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isAdmin } from '@/lib/auth/roles';
import { createClient as createServerClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    // Check if user is admin
    const isAdminUser = await isAdmin();
    if (!isAdminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, clientId, role } = body;
    
    if (!userId || !clientId) {
      return NextResponse.json({ 
        error: 'User ID and client ID are required' 
      }, { status: 400 });
    }

    // Validate role
    const validRoles = ['admin', 'member', 'viewer'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ 
        error: 'Invalid role. Must be admin, member, or viewer' 
      }, { status: 400 });
    }

    // Get supabase client
    const supabase = await createServerClient();
    
    // Check if user already exists in this company
    const { data: existingAssociation, error: checkError } = await supabase
      .from('client_users')
      .select('id')
      .eq('user_id', userId)
      .eq('client_id', clientId)
      .single();
      
    if (checkError && checkError.code !== 'PGRST116') { // Not found error is expected
      return NextResponse.json({ 
        error: `Failed to check existing client user: ${checkError.message}` 
      }, { status: 500 });
    }
    
    if (existingAssociation) {
      // Update existing association
      const { error: updateError } = await supabase
        .from('client_users')
        .update({ role })
        .eq('id', existingAssociation.id);
        
      if (updateError) {
        return NextResponse.json({ 
          error: `Failed to update client user role: ${updateError.message}` 
        }, { status: 500 });
      }
      
      return NextResponse.json({
        success: true,
        message: 'User role updated successfully'
      });
    }
    
    // Create new client_user association
    const { error: insertError } = await supabase
      .from('client_users')
      .insert({
        client_id: clientId,
        user_id: userId,
        role
      });
      
    if (insertError) {
      return NextResponse.json({ 
        error: `Failed to add user to company: ${insertError.message}` 
      }, { status: 500 });
    }
    
    // The database trigger will handle adding appropriate user roles if needed

    return NextResponse.json({
      success: true,
      message: 'User added to company successfully'
    });
  } catch (error: any) {
    console.error('Error in add user to company API route:', error);
    return NextResponse.json({ 
      error: error.message || 'Unknown error' 
    }, { status: 500 });
  }
} 