import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isAdmin } from '@/lib/auth/roles';

export async function POST(request: NextRequest) {
  try {
    // Simple check if user is admin
    const isAdminUser = await isAdmin();
    if (!isAdminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { email } = body;
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing environment variables');
      return NextResponse.json({ 
        error: 'Server configuration error. Contact administrator.'
      }, { status: 500 });
    }

    // Create a Supabase admin client with service role
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

    // Get all Supabase auth settings for diagnosis
    const authSettings = {
      url: supabaseUrl,
      serviceKeyLength: supabaseServiceKey.length,
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
    };

    // Try sending a magic link with manual OTP flag
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`
      }
    });
    
    if (error) {
      return NextResponse.json({ 
        error: `Failed to send magic link: ${error.message}`,
        authSettings
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: `Magic link sent to: ${email}`,
      authSettings,
      data: {
        properties: data.properties,
        hasEmailOTP: !!data.properties?.email_otp
      }
    });
  } catch (error: any) {
    console.error('Error in test-email API route:', error);
    return NextResponse.json({ 
      error: error.message || 'Unknown error'
    }, { status: 500 });
  }
} 