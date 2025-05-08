'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { createClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface OnboardingFormData {
  password: string;
  confirmPassword: string;
}

interface OnboardingFormProps {
  clientId: string;
}

export default function OnboardingForm({ clientId }: OnboardingFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors },
    watch
  } = useForm<OnboardingFormData>();
  
  const password = watch('password');
  
  // Get user information
  useEffect(() => {
    async function getUserInfo() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || null);
      } else {
        // If no user, redirect to login
        router.push('/login');
      }
    }
    
    getUserInfo();
  }, [supabase, router]);
  
  const onSubmit = async (data: OnboardingFormData) => {
    setIsLoading(true);
    
    try {
      // Update the user's password
      const { error: updateError } = await supabase.auth.updateUser({
        password: data.password
      });
      
      if (updateError) {
        throw updateError;
      }
      
      // Update the client record to link with the user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // Update the client's owner_id to the user's ID
      const { error: clientUpdateError } = await supabase
        .from('clients')
        .update({ owner_id: user.id })
        .eq('id', clientId);
        
      if (clientUpdateError) {
        throw clientUpdateError;
      }
      
      // Set user role to 'user' (not admin)
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ user_id: user.id, role: 'user' });
        
      if (roleError && !roleError.message.includes('duplicate key')) {
        throw roleError;
      }
      
      // Redirect to dashboard
      router.push('/dashboard');
      router.refresh();
    } catch (error) {
      console.error('Error completing onboarding:', error);
      alert('There was an error setting up your account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {userEmail && (
        <div className="mb-4">
          <p className="font-medium">Email:</p>
          <p className="text-gray-600">{userEmail}</p>
        </div>
      )}
      
      <Input
        id="password"
        type="password"
        label="Password"
        fullWidth
        error={errors.password?.message}
        {...register('password', { 
          required: 'Password is required',
          minLength: {
            value: 8,
            message: 'Password must be at least 8 characters'
          }
        })}
      />
      
      <Input
        id="confirmPassword"
        type="password"
        label="Confirm Password"
        fullWidth
        error={errors.confirmPassword?.message}
        {...register('confirmPassword', { 
          required: 'Please confirm your password',
          validate: value => value === password || 'Passwords do not match'
        })}
      />
      
      <div className="flex justify-end pt-4">
        <Button type="submit" isLoading={isLoading}>
          Complete Setup
        </Button>
      </div>
    </form>
  );
} 