'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { createClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
}

export default function RegisterForm() {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterFormData>();
  
  const password = watch('password');
  
  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setErrorMessage(null);
    
    try {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      
      if (error) {
        throw error;
      }
      
      // Show success message instead of redirecting as email confirmation might be needed
      setErrorMessage('Check your email for the confirmation link.');
      // router.push('/login');
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to sign up');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {errorMessage && (
        <div className={`p-3 text-sm rounded-md ${errorMessage.includes('Check your email') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {errorMessage}
        </div>
      )}
      
      <Input
        id="email"
        label="Email address"
        type="email"
        autoComplete="email"
        fullWidth
        error={errors.email?.message}
        {...register('email', {
          required: 'Email is required',
          pattern: {
            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
            message: 'Invalid email address',
          },
        })}
      />
      
      <Input
        id="password"
        label="Password"
        type="password"
        autoComplete="new-password"
        fullWidth
        error={errors.password?.message}
        {...register('password', {
          required: 'Password is required',
          minLength: {
            value: 8,
            message: 'Password must be at least 8 characters',
          },
        })}
      />
      
      <Input
        id="confirmPassword"
        label="Confirm Password"
        type="password"
        autoComplete="new-password"
        fullWidth
        error={errors.confirmPassword?.message}
        {...register('confirmPassword', {
          required: 'Please confirm your password',
          validate: value => value === password || 'Passwords do not match',
        })}
      />
      
      <div className="flex justify-end pt-4">
        <Button
          type="submit"
          isLoading={isLoading}
        >
          Sign up
        </Button>
      </div>
    </form>
  );
} 