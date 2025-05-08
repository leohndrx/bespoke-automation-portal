import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAdmin } from '@/lib/auth/roles';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if current user is admin
    const isAdminUser = await isAdmin();
    if (!isAdminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const userId = params.id;
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const supabaseAdmin = createAdminClient();

    // First, delete any client user associations
    const { error: clientUserDeleteError } = await supabase
      .from('client_users')
      .delete()
      .eq('user_id', userId);

    if (clientUserDeleteError) {
      console.error('Error deleting user client associations:', clientUserDeleteError);
      return NextResponse.json(
        { error: `Failed to delete user associations: ${clientUserDeleteError.message}` },
        { status: 500 }
      );
    }

    // Delete user role
    const { error: roleDeleteError } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId);

    if (roleDeleteError && !roleDeleteError.message.includes('no rows')) {
      console.error('Error deleting user role:', roleDeleteError);
    }

    // Delete the user from Auth
    const { error: userDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (userDeleteError) {
      console.error('Error deleting user:', userDeleteError);
      return NextResponse.json(
        { error: `Failed to delete user: ${userDeleteError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in user delete API:', error);
    return NextResponse.json(
      { error: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
} 