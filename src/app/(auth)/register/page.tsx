import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import RegisterForm from './register-form';

// Force dynamic to avoid caching issues
export const dynamic = 'force-dynamic';

export default async function RegisterPage() {
  const supabase = await createClient();
  
  // Using getUser instead of getSession for better security
  const { data: { user } } = await supabase.auth.getUser();
  
  if (user) {
    redirect('/dashboard');
  }
  
  return (
    <div>
      <RegisterForm />
      <div className="mt-6">
        <p className="mt-2 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
} 