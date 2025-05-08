import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isAdmin } from '@/lib/auth/roles';
import { createClient as createServerClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    // Simple check if user is admin
    const isAdminUser = await isAdmin();
    if (!isAdminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { email, name, company, clientId } = body;
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    
    if (!supabaseUrl || !supabaseServiceKey || !siteUrl) {
      console.error('Missing environment variables:', { 
        hasUrl: !!supabaseUrl, 
        hasServiceKey: !!supabaseServiceKey,
        hasSiteUrl: !!siteUrl 
      });
      return NextResponse.json({ 
        error: 'Server configuration error. Contact administrator.'
      }, { status: 500 });
    }

    // Create a Supabase admin client with service role KEY - this is critical for proper invites
    const supabaseAdmin = createClient(
      supabaseUrl,
      supabaseServiceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        }
      }
    );

    // Get the regular client for database operations
    const supabase = await createServerClient();
    
    // Get client ID - either from request body or create a new client
    let targetClientId = clientId;
    
    if (!targetClientId) {
      // Create client entry if no client ID provided
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .insert({
          company: company || 'New Company',
          owner_id: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();
      
      if (clientError) {
        return NextResponse.json({ error: `Failed to create client: ${clientError.message}` }, { status: 500 });
      }
      
      targetClientId = clientData.id;
    }

    // Ensure site URL has no trailing slash
    const cleanSiteUrl = siteUrl.replace(/\/$/, '');
    
    // Make sure this is an absolute URL with the correct structure
    const redirectUrl = `${cleanSiteUrl}/auth/callback?client_id=${targetClientId}`;

    console.log('Sending invitation with redirect URL:', redirectUrl);
    
    // First check if the user already exists
    const { data: users } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = users?.users?.find(user => user.email === email);
    
    let userId: string | null = null;
    let inviteError: any = null;
    
    if (existingUser) {
      console.log('User already exists, sending magic link instead');
      userId = existingUser.id;
      
      // For existing users, use standard magic link
      const { error } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: email,
        options: {
          redirectTo: redirectUrl
        }
      });
      
      inviteError = error;
    } else {
      // For new users, use inviteUserByEmail
      try {
        const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
          redirectTo: redirectUrl,
          data: {
            name: name || '',
            client_id: targetClientId,
          }
        });
        
        if (data?.user) {
          userId = data.user.id;
        }
        
        inviteError = error;
      } catch (err) {
        console.error('Error inviting user:', err);
        // Fallback to magic link if invitation fails
        console.log('Falling back to magic link');
        const { error } = await supabaseAdmin.auth.admin.generateLink({
          type: 'magiclink',
          email: email,
          options: {
            redirectTo: redirectUrl
          }
        });
        
        inviteError = error;
      }
    }

    if (inviteError) {
      console.error('Failed to send invitation:', inviteError);
      return NextResponse.json({ 
        error: `Failed to invite user: ${inviteError.message}` 
      }, { status: 500 });
    }
    
    // Manually insert into pending_invitations table
    const { error: userRoleError } = await supabase
      .from('pending_invitations')
      .insert({
        email: email,
        client_id: targetClientId,
        role: 'user', // Default role
        name: name || ''
      });
    
    if (userRoleError) {
      console.error('Failed to create pending invitation record:', userRoleError);
      // Continue anyway, the invite was sent
    }

    return NextResponse.json({
      success: true,
      message: `Invitation email sent to: ${email}`,
      clientId: targetClientId,
      redirectUrl: redirectUrl
    });
  } catch (error: any) {
    console.error('Error in invite API route:', error);
    return NextResponse.json({ 
      error: error.message || 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
} 