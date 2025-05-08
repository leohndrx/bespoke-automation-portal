'use server';

import { createClient as createAdminClient } from '@supabase/supabase-js';
import { Database } from '@/lib/supabase/types';
import { createClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/auth/roles';
import { randomUUID } from 'crypto';

interface InviteUserData {
  email: string;
  name: string;
  company: string;
}

// Debug function to test admin functionality
export async function testAdminFunctionality() {
  try {
    // Check if current user is admin
    const isAdminUser = await isAdmin();
    if (!isAdminUser) {
      return { success: false, error: 'Not authorized' };
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    // Test for missing environment variables
    if (!supabaseUrl || !supabaseServiceKey) {
      return {
        success: false,
        error: 'Missing environment variables',
        details: {
          hasUrl: !!supabaseUrl,
          hasServiceKey: !!supabaseServiceKey
        }
      };
    }

    // Create a Supabase client with the service role key
    const supabaseAdmin = createAdminClient<Database>(
      supabaseUrl,
      supabaseServiceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get current authenticated user (the admin)
    const supabase = await createClient();
    const { data: { user: adminUser } } = await supabase.auth.getUser();
    
    if (!adminUser) {
      return { success: false, error: 'Admin not authenticated' };
    }

    // Test if we can access admin functionality
    const { data: users, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (usersError) {
      return { 
        success: false, 
        error: `Admin API error: ${usersError.message}`,
        details: {
          hasServiceKey: !!supabaseServiceKey,
          keyLength: supabaseServiceKey.length || 0
        }
      };
    }
    
    return { 
      success: true, 
      message: `Successfully accessed admin API`,
      userCount: users?.users?.length || 0
    };
  } catch (error: any) {
    console.error('Error in testAdminFunctionality:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to test admin functionality',
      stack: error.stack
    };
  }
}

export async function inviteUser(data: InviteUserData) {
  try {
    // Check if current user is admin
    const isAdminUser = await isAdmin();
    if (!isAdminUser) {
      return { success: false, error: 'Not authorized to invite users' };
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    // Test for missing environment variables
    if (!supabaseUrl || !supabaseServiceKey) {
      return {
        success: false,
        error: 'Missing environment variables',
        details: {
          hasUrl: !!supabaseUrl,
          hasServiceKey: !!supabaseServiceKey
        }
      };
    }

    // Get current authenticated user (the admin)
    const supabase = await createClient();
    const { data: { user: adminUser } } = await supabase.auth.getUser();
    
    if (!adminUser) {
      return { success: false, error: 'Admin not authenticated' };
    }

    // Create client entry first
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .insert({
        name: data.name,
        email: data.email,
        company: data.company,
        owner_id: adminUser.id,  // Admin is temporary owner
      })
      .select()
      .single();
    
    if (clientError) {
      return { 
        success: false, 
        error: `Failed to create client record: ${clientError.message}` 
      };
    }

    // Create a Supabase admin client
    const supabaseAdmin = createAdminClient<Database>(
      supabaseUrl,
      supabaseServiceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
    
    // Try to use a simpler admin invite method
    const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(data.email);
    
    if (inviteError) {
      return { 
        success: false, 
        error: `Failed to invite user: ${inviteError.message}`,
        details: {
          serviceKeyLength: supabaseServiceKey.length
        }
      };
    }
    
    return { 
      success: true, 
      message: `Invitation sent to ${data.email}`,
      clientId: clientData.id
    };
  } catch (error: any) {
    console.error('Error in inviteUser server action:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to send invitation',
      stack: error.stack
    };
  }
} 