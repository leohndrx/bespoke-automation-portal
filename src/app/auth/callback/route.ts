import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  
  // Log all query parameters for debugging
  console.log('Auth callback called with params:', Object.fromEntries(requestUrl.searchParams));
  
  // Check for different types of codes/tokens that might be in the URL
  const code = requestUrl.searchParams.get('code');
  const token = requestUrl.searchParams.get('token');
  const type = requestUrl.searchParams.get('type');
  const clientId = requestUrl.searchParams.get('client_id');
  // This will be present in invitation links
  const inviteToken = requestUrl.searchParams.get('invite_token');
  const email = requestUrl.searchParams.get('email');
  
  // Create an absolute URL to the password setup page
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;
  const setupUrl = new URL('/auth/setup-password', baseUrl);
  
  // Add common parameters to the setup URL
  setupUrl.searchParams.set('from', 'invite');
  if (clientId) {
    setupUrl.searchParams.set('client_id', clientId);
  }
  if (email) {
    setupUrl.searchParams.set('email', email);
  }
  
  // If we have an invite token, handle it directly
  if (inviteToken) {
    console.log('Processing invitation token');
    setupUrl.searchParams.set('token', inviteToken);
    setupUrl.searchParams.set('type', 'invite');
    
    console.log('Redirecting to setup with invite token:', setupUrl.toString());
    return NextResponse.redirect(setupUrl, { status: 303 });
  }
  
  // Process any authentication code/token
  if (code || token) {
    const supabase = await createClient();
    
    try {
      let authError = null;
      
      // Handle different authentication flows
      if (code) {
        console.log('Processing auth code');
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        authError = error;
      } else if (token && type === 'recovery') {
        console.log('Processing recovery token');
        // Handle password recovery token if present
        const { error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'email',
        });
        authError = error;
      } else if (token) {
        // Generic token - could be an invite
        console.log('Processing generic token');
        setupUrl.searchParams.set('token', token);
        if (type) {
          setupUrl.searchParams.set('type', type);
        }
        
        console.log('Redirecting to setup with token:', setupUrl.toString());
        return NextResponse.redirect(setupUrl, { status: 303 });
      }
      
      if (authError) {
        console.error("Auth callback error:", authError);
        // Instead of redirecting to login, still try the setup page with token
        if (token) {
          setupUrl.searchParams.set('token', token);
          if (type) {
            setupUrl.searchParams.set('type', type);
          }
          console.log('Auth error but redirecting to setup with token:', setupUrl.toString());
          return NextResponse.redirect(setupUrl, { status: 303 });
        }
        // If no token, redirect to login
        return NextResponse.redirect(new URL('/', request.url));
      }

      console.log('Redirecting to setup after successful auth:', setupUrl.toString());
      // Force redirect to the password setup page
      return NextResponse.redirect(setupUrl, { status: 303 });
    } catch (err) {
      console.error("Auth callback exception:", err);
      // Even on error, try the setup page with the token if available
      if (token) {
        setupUrl.searchParams.set('token', token);
        if (type) {
          setupUrl.searchParams.set('type', type);
        }
        console.log('Exception but redirecting to setup with token:', setupUrl.toString());
        return NextResponse.redirect(setupUrl, { status: 303 });
      }
      return NextResponse.redirect(new URL('/', request.url));
    }
  }
  
  // If we have email but no code/token, still try redirecting to the setup page
  if (email) {
    console.log('No auth code/token found, but have email. Redirecting to setup:', setupUrl.toString());
    return NextResponse.redirect(setupUrl, { status: 303 });
  }
  
  // Redirect to login if no other option worked
  console.log('No auth code/token/email found, redirecting to login');
  return NextResponse.redirect(new URL('/', request.url));
} 