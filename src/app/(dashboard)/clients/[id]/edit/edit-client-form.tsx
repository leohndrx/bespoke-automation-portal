'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { createClient } from '@/lib/supabase/client';
import { Client } from '@/lib/supabase/types';

interface ClientFormData {
  name: string;
  phone: string;
  company: string;
  description: string;
  email: string;
}

interface EditClientFormProps {
  client: Client;
}

export default function EditClientForm({ client }: EditClientFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors } 
  } = useForm<ClientFormData>({
    defaultValues: {
      name: client.name || '',
      phone: client.phone || '',
      company: client.company || '',
      description: client.description || '',
      email: client.email || ''
    }
  });
  
  const onSubmit = async (data: ClientFormData) => {
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
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        company: data.company || null,
        description: data.description || null,
      }).eq('id', client.id);
      
      if (clientError) {
        throw clientError;
      }
      
      // Navigate back to client detail
      router.push(`/clients/${client.id}`);
      router.refresh();
    } catch (error: any) {
      console.error('Error updating client:', error);
      setError(error.message || 'Failed to update client. Please try again.');
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
          id="client-name"
          label="Client Name"
          fullWidth
          error={errors.name?.message}
          placeholder="Enter client name"
          {...register('name', { required: 'Client name is required' })}
        />
        
        <Input
          id="client-email"
          label="Email"
          type="email"
          fullWidth
          error={errors.email?.message}
          placeholder="Enter client email"
          {...register('email')}
        />
        
        <Input
          id="client-phone"
          label="Phone Number"
          fullWidth
          error={errors.phone?.message}
          placeholder="Enter phone number"
          {...register('phone')}
        />
        
        <Input
          id="client-company"
          label="Company"
          fullWidth
          error={errors.company?.message}
          placeholder="Enter company name"
          {...register('company')}
        />
        
        <Textarea
          id="client-description"
          label="Description"
          fullWidth
          rows={4}
          placeholder="Enter a description"
          {...register('description')}
        />
        
        <div className="flex justify-end pt-4">
          <Button 
            type="submit" 
            isLoading={isLoading}
          >
            Update Client
          </Button>
        </div>
      </form>
    </div>
  );
} 