'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function SetupPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);
  
  // Get parameters from query string
  const clientId = searchParams.get('client_id');
  const fromInvite = searchParams.get('from') === 'invite';
  const token = searchParams.get('token');
  const tokenType = searchParams.get('type');
  const emailFromUrl = searchParams.get('email');
  
  // Check for hash fragment on page load (in case redirected with hash)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      console.log('Hash fragment detected on setup page. User likely redirected from invite link.');
    }
  }, []);
  
  // Fetch user data or verify token on component mount
  useEffect(() => {
    async function checkAuthOrVerifyToken() {
      try {
        // First check if we already have a session
        const { data: sessionData } = await supabase.auth.getSession();
        
        if (sessionData?.session) {
          console.log('User already has a session');
          const { data } = await supabase.auth.getUser();
          
          if (data.user) {
            console.log('User authenticated:', data.user.email);
            setUserData(data.user);
            setAuthChecked(true);
            return;
          }
        }
        
        // If we have a token, verify it
        if (token) {
          console.log('Verifying token');
          
          // Different verification based on token type
          if (tokenType === 'invite' || !tokenType) {
            // For invite links, we need to verify the token
            const { data, error } = await supabase.auth.verifyOtp({
              token_hash: token,
              type: 'email',
            });
            
            if (error) {
              console.error('Token verification error:', error);
              setError(`Authentication error: ${error.message}. Please try the link again.`);
              setAuthChecked(true);
              return;
            }
            
            if (data?.user) {
              console.log('Token verified, user authenticated');
              setUserData(data.user);
              setAuthChecked(true);
              return;
            }
          }
        }
        
        // If we have an email but no session or valid token, we'll show manual auth options
        if (emailFromUrl) {
          console.log('No session or valid token, but have email:', emailFromUrl);
          setAuthChecked(true);
          return;
        }
        
        // Last attempt - check for authenticated user
        const { data, error } = await supabase.auth.getUser();
        
        if (error) {
          console.error('Auth error:', error);
          setError('Authentication error. Please try the link again or contact support.');
          setAuthChecked(true);
          return;
        }
        
        if (!data.user) {
          console.log('No authenticated user found. Will show manual options.');
          setAuthChecked(true);
          return;
        }
        
        console.log('User authenticated:', data.user.email);
        setUserData(data.user);
        setAuthChecked(true);
      } catch (err) {
        console.error('Error checking auth:', err);
        setError('Failed to verify your authentication. Please try again.');
        setAuthChecked(true);
      }
    }
    
    checkAuthOrVerifyToken();
  }, [supabase, token, tokenType, emailFromUrl]);
  
  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Setting password');
      
      // If we have a user, update their password
      if (userData) {
        console.log('Updating password for existing user:', userData.email);
        const { error } = await supabase.auth.updateUser({ password });
        
        if (error) {
          throw error;
        }
      } 
      // If we only have an email and token, we need to sign in first
      else if (emailFromUrl && token) {
        console.log('Signing in with token and setting password');
        // Verify the token to sign in
        const { error: signInError } = await supabase.auth.verifyOtp({
          email: emailFromUrl,
          token: token,
          type: 'email',
        });
        
        if (signInError) {
          throw signInError;
        }
        
        // Update password after sign in
        const { error: updateError } = await supabase.auth.updateUser({ password });
        
        if (updateError) {
          throw updateError;
        }
        
        // Get the user data
        const { data } = await supabase.auth.getUser();
        if (data?.user) {
          setUserData(data.user);
        }
      } else {
        throw new Error('No authenticated user or valid token found');
      }
      
      // Process company association if we have client ID and user data
      if (clientId && userData?.id) {
        console.log('Processing client association for client:', clientId);
        
        try {
          // Ensure the user is added to the client with correct 'member' role
          const { error: clientUserError } = await supabase
            .from('client_users')
            .upsert({ 
              client_id: clientId,
              user_id: userData.id,
              role: 'member'  // Use 'member' role for client_users table
            }, { 
              onConflict: 'client_id,user_id' 
            });
            
          if (clientUserError) {
            console.error('Error creating client_users record:', clientUserError);
          }
          
          // Ensure the user has a role (with 'user' role)
          const { error: userRoleError } = await supabase
            .from('user_roles')
            .upsert({ 
              user_id: userData.id,
              role: 'user'  // Use 'user' role for user_roles table
            }, { 
              onConflict: 'user_id' 
            });
            
          if (userRoleError) {
            console.error('Error creating user_roles record:', userRoleError);
          }
          
          // Update any pending invitation to mark it as claimed
          const { error: inviteError } = await supabase
            .from('pending_invitations')
            .update({
              claimed_at: new Date().toISOString(),
              claimed_by: userData.id
            })
            .eq('client_id', clientId)
            .eq('email', userData.email);
            
          if (inviteError) {
            console.error('Error updating pending_invitation:', inviteError);
          }
        } catch (err) {
          console.error('Error in client association process:', err);
          // Continue anyway to allow user to complete setup
        }
          
        console.log('Client association process completed');
      }
      
      setSuccess(true);
      
      // Redirect to dashboard after a delay
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (error: any) {
      console.error('Error setting password:', error);
      setError(error.message || 'Failed to set password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const sendMagicLink = async () => {
    if (!emailFromUrl) {
      setError('No email address provided');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Sending magic link to:', emailFromUrl);
      const { error } = await supabase.auth.signInWithOtp({
        email: emailFromUrl,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?client_id=${clientId || ''}`
        }
      });
      
      if (error) {
        throw error;
      }
      
      setSuccess(true);
      setError(null);
      alert(`A magic link has been sent to ${emailFromUrl}. Please check your email.`);
    } catch (error: any) {
      console.error('Error sending magic link:', error);
      setError(error.message || 'Failed to send magic link. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Show loading state while checking auth
  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-md p-8 space-y-8 bg-white shadow-lg rounded-lg">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Checking Authentication...</h1>
            <div className="mt-4 flex justify-center">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-8 bg-white shadow-lg rounded-lg">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Set Your Password</h1>
          <p className="mt-2 text-gray-600">
            {fromInvite 
              ? "Welcome! Please set a password to complete your account setup."
              : "Create a new password for your account."}
          </p>
        </div>
        
        {success ? (
          <div className="bg-green-50 text-green-800 p-4 rounded-md">
            Password set successfully! Redirecting to dashboard...
          </div>
        ) : (
          <>
            {error && (
              <div className="bg-red-50 text-red-800 p-3 rounded-md">
                {error}
              </div>
            )}
            
            {userData ? (
              <form onSubmit={handleSetPassword} className="mt-8 space-y-6">
                <div className="bg-blue-50 text-blue-800 p-3 rounded-md mb-3">
                  Setting password for: <strong>{userData.email}</strong>
                </div>
                
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    New Password
                  </label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="mt-1"
                    placeholder="Enter a secure password"
                  />
                </div>
                
                <div>
                  <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                    Confirm Password
                  </label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="mt-1"
                    placeholder="Confirm your password"
                  />
                </div>
                
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? 'Setting Password...' : 'Set Password & Continue'}
                </Button>
              </form>
            ) : emailFromUrl ? (
              <div className="mt-8 space-y-6">
                <div className="p-4 bg-yellow-50 text-yellow-800 rounded-md mb-4">
                  Authentication failed. Click below to send a new magic link to <strong>{emailFromUrl}</strong>.
                </div>
                
                <Button
                  onClick={sendMagicLink}
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? 'Sending...' : 'Send Magic Link'}
                </Button>
              </div>
            ) : (
              <div className="p-4 bg-yellow-50 text-yellow-800 rounded-md">
                Authentication required. Please check your email and click the login link again.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
} 