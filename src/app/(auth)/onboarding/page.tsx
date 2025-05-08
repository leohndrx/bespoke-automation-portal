import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import OnboardingForm from './onboarding-form';

export default async function OnboardingPage() {
  const supabase = createClient();
  
  // Check if user is authenticated
  const { data: { session } } = await supabase.auth.getSession();
  
  // If user already has a session, they shouldn't be on the onboarding page
  if (session?.user.app_metadata?.provider !== 'email') {
    redirect('/dashboard');
  }
  
  const clientId = session?.user.user_metadata?.client_id;
  
  // If no client_id in metadata, redirect to dashboard
  if (!clientId) {
    redirect('/dashboard');
  }
  
  return (
    <div className="max-w-md mx-auto my-12 px-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">Complete Your Account</h1>
        <p className="text-gray-600 mt-2">
          Please set your password to continue
        </p>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <OnboardingForm clientId={clientId} />
      </div>
    </div>
  );
} 