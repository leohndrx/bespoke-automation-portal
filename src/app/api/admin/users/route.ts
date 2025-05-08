import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAdmin } from '@/lib/auth/roles';

export async function GET(request: NextRequest) {
  try {
    // Check if current user is admin
    const isAdminUser = await isAdmin();
    if (!isAdminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    // Use regular client for database operations
    const supabase = await createClient();
    // Use admin client for auth admin operations
    const supabaseAdmin = createAdminClient();
    
    // Fetch all users using the admin client
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authError) {
      console.error('Error loading users:', authError);
      return NextResponse.json({ error: `Failed to load users: ${authError.message}` }, { status: 500 });
    }
    
    // Fetch user roles
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('*');
    
    if (rolesError) {
      console.error('Error loading user roles:', rolesError);
    }
    
    // Fetch client users to get company associations
    const { data: clientUsers, error: clientUsersError } = await supabase
      .from('client_users')
      .select('*');
    
    if (clientUsersError) {
      console.error('Error loading client users:', clientUsersError);
    }
    
    // Fetch clients separately
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('id, company');
      
    if (clientsError) {
      console.error('Error loading clients:', clientsError);
    }
    
    // Combine data
    const users = authUsers?.users.map(user => {
      // Find user role
      const roleRecord = userRoles?.find(r => r.user_id === user.id);
      const role = roleRecord?.role || 'user';
      
      // Find associated companies
      const userCompanies = clientUsers
        ?.filter(cu => cu.user_id === user.id)
        .map(cu => {
          const clientData = clients?.find(c => c.id === cu.client_id);
          return {
            id: cu.client_id,
            name: clientData?.company || 'Unknown Company',
            role: cu.role
          };
        }) || [];
      
      return {
        ...user,
        role,
        companies: userCompanies
      };
    }) || [];
    
    return NextResponse.json({ 
      users
    });
  } catch (error: any) {
    console.error('Error in users API:', error);
    return NextResponse.json(
      { error: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
} 