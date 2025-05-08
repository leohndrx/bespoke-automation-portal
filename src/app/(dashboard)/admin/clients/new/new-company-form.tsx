'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

interface CompanyFormData {
  company: string;
}

export default function NewCompanyForm() {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors } 
  } = useForm<CompanyFormData>({
    defaultValues: {
      company: '',
    }
  });
  
  const onSubmit = async (data: CompanyFormData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // Create the client
      const { error: clientError } = await supabase.from('clients').insert({
        company: data.company,
        owner_id: user.id,
      });
      
      if (clientError) {
        throw clientError;
      }
      
      // Navigate to admin clients list
      router.push('/admin/clients');
      router.refresh();
    } catch (error: any) {
      console.error('Error creating company:', error);
      setError(error.message || 'Failed to create company. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div>
      {error && (
        <div className="bg-red-50 text-red-800 p-3 rounded-md mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          id="company-name"
          label="Company Name"
          fullWidth
          error={errors.company?.message}
          placeholder="Enter company name"
          {...register('company', { required: 'Company name is required' })}
        />
        
        <div className="flex justify-end pt-4">
          <Button 
            type="submit" 
            isLoading={isLoading}
          >
            Create Company
          </Button>
        </div>
      </form>
    </div>
  );
} 