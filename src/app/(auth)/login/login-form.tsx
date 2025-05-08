'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { createClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import HashAuthHandler from './hash-auth-handler';

interface LoginFormData {
  email: string;
  password: string;
}

export default function LoginForm() {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>();
  
  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setErrorMessage(null);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      
      if (error) {
        throw error;
      }
      
      router.push('/dashboard');
      router.refresh();
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to sign in');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <>
      <HashAuthHandler />
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {errorMessage && (
          <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md">
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
          autoComplete="current-password"
          fullWidth
          error={errors.password?.message}
          {...register('password', {
            required: 'Password is required',
          })}
        />
        
        <div className="flex justify-end pt-4">
          <Button
            type="submit"
            isLoading={isLoading}
          >
            Sign in
          </Button>
        </div>
      </form>
    </>
  );
} 