import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
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

    const { id } = await Promise.resolve(params);
    const clientId = id;
    if (!clientId) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // First, delete client user associations
    const { error: clientUserDeleteError } = await supabase
      .from('client_users')
      .delete()
      .eq('client_id', clientId);

    if (clientUserDeleteError) {
      console.error('Error deleting client user associations:', clientUserDeleteError);
      return NextResponse.json(
        { error: `Failed to delete client associations: ${clientUserDeleteError.message}` },
        { status: 500 }
      );
    }

    // Delete pending invitations
    const { error: invitationDeleteError } = await supabase
      .from('pending_invitations')
      .delete()
      .eq('client_id', clientId);

    if (invitationDeleteError) {
      console.error('Error deleting pending invitations:', invitationDeleteError);
    }

    // Check for projects related to this client
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id')
      .eq('client_id', clientId);

    if (projectsError) {
      console.error('Error checking for projects:', projectsError);
      return NextResponse.json(
        { error: `Failed to check for related projects: ${projectsError.message}` },
        { status: 500 }
      );
    }

    // If there are projects, don't allow deletion
    if (projects && projects.length > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete this company as it has associated projects. Delete the projects first.',
          projectCount: projects.length
        },
        { status: 400 }
      );
    }

    // Finally, delete the client record
    const { error: clientDeleteError } = await supabase
      .from('clients')
      .delete()
      .eq('id', clientId);

    if (clientDeleteError) {
      console.error('Error deleting client:', clientDeleteError);
      return NextResponse.json(
        { error: `Failed to delete client: ${clientDeleteError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in client delete API:', error);
    return NextResponse.json(
      { error: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
} 