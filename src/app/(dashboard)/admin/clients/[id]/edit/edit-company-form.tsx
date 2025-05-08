'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { Client } from '@/lib/supabase/types';

interface CompanyFormData {
  company: string;
}

interface EditCompanyFormProps {
  client: Client;
}

export default function EditCompanyForm({ client }: EditCompanyFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors } 
  } = useForm<CompanyFormData>({
    defaultValues: {
      company: client.company || ''
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
      
      // Update the client
      const { error: clientError } = await supabase.from('clients').update({
        company: data.company
      }).eq('id', client.id);
      
      if (clientError) {
        throw clientError;
      }
      
      // Navigate back to admin client page
      router.push(`/admin/clients/${client.id}`);
      router.refresh();
    } catch (error: any) {
      console.error('Error updating company:', error);
      setError(error.message || 'Failed to update company. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this company? This will remove all user associations but not the users themselves.')) {
      return;
    }
    
    setIsDeleting(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/admin/clients/${client.id}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete company');
      }
      
      // Navigate back to the clients list
      router.push('/admin/clients');
      router.refresh();
    } catch (error: any) {
      console.error('Error deleting company:', error);
      setError(error.message || 'Failed to delete company. Please try again.');
      setIsDeleting(false);
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
        
        <div className="flex justify-between pt-4">
          <Button 
            type="button" 
            variant="destructive"
            onClick={handleDelete}
            isLoading={isDeleting}
          >
            Delete Company
          </Button>
          
          <Button 
            type="submit" 
            isLoading={isLoading}
          >
            Update Company
          </Button>
        </div>
      </form>
    </div>
  );
} 