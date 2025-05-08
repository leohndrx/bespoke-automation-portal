'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function HashAuthHandler() {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const processHashParams = async () => {
      // Only run this if we have a hash fragment
      if (!window.location.hash) return;
      
      try {
        setIsProcessing(true);
        console.log('Processing hash params:', window.location.hash);
        
        // Parse the hash fragment
        const hashParams = new URLSearchParams(
          window.location.hash.substring(1) // Remove the # character
        );
        
        // Check if this is an invite link
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');
        
        if (accessToken && type === 'invite') {
          console.log('Detected invite link with token');
          
          // Extract client_id from user_metadata if present
          // Often the invite token includes user metadata with client_id
          let clientId = '';
          try {
            // Try to parse client_id from the JWT token
            const tokenParts = accessToken.split('.');
            if (tokenParts.length === 3) {
              const payload = JSON.parse(atob(tokenParts[1]));
              clientId = payload.user_metadata?.client_id || '';
              console.log('Extracted client_id from token:', clientId);
            }
          } catch (err) {
            console.error('Error parsing token:', err);
          }
          
          const supabase = createClient();
          
          // Set the session from the hash parameters
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });
          
          if (sessionError) {
            throw sessionError;
          }
          
          // Get the user to verify the session
          const { data: userData, error: userError } = await supabase.auth.getUser();
          
          if (userError) {
            throw userError;
          }
          
          if (!userData.user) {
            throw new Error('Failed to authenticate user');
          }
          
          console.log('Successfully authenticated user:', userData.user.email);
          
          // Redirect to password setup page with client_id if available
          const setupUrl = new URL('/auth/setup-password', window.location.origin);
          setupUrl.searchParams.set('from', 'invite');
          
          if (clientId) {
            setupUrl.searchParams.set('client_id', clientId);
          }
          
          console.log('Redirecting to:', setupUrl.toString());
          window.location.href = setupUrl.toString();
        }
      } catch (err: any) {
        console.error('Error processing hash auth:', err);
        setError(err.message || 'Authentication failed');
        setIsProcessing(false);
      }
    };
    
    processHashParams();
  }, [router]);
  
  // Don't render anything if no hash or still processing
  if (!window.location.hash || !isProcessing) {
    return null;
  }
  
  // Only show something if there's an error
  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md mb-4">
        <p className="text-red-800">
          Error processing invitation: {error}
        </p>
        <p className="text-red-600 text-sm mt-1">
          Please contact your administrator or try again.
        </p>
      </div>
    );
  }
  
  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-md mb-4">
      <p className="text-blue-800 flex items-center">
        <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Processing your invitation...
      </p>
    </div>
  );
} 