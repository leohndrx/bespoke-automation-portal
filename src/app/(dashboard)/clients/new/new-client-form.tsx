'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { createClient } from '@/lib/supabase/client';

interface ClientFormData {
  name: string;
  phone: string;
  company: string;
  description: string;
  email: string;
  sendInvite: boolean;
}

export default function NewClientForm() {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors },
    watch,
    setValue
  } = useForm<ClientFormData>({
    defaultValues: {
      name: '',
      phone: '',
      company: '',
      description: '',
      email: '',
      sendInvite: false
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
      
      // Create the client
      const { data: clientData, error: clientError } = await supabase.from('clients').insert({
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        company: data.company || null,
        description: data.description || null,
        owner_id: user.id,
      }).select().single();
      
      if (clientError) {
        throw clientError;
      }
      
      // If sendInvite is checked and email is provided, send invite via API
      if (data.sendInvite && data.email) {
        const response = await fetch('/api/admin/invite', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: data.email,
            name: data.name,
            company: data.company || '',
          }),
        });
        
        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.error || 'Failed to send invitation');
        }
      }
      
      // Navigate back to clients list
      router.push('/clients');
      router.refresh();
    } catch (error: any) {
      console.error('Error creating client:', error);
      setError(error.message || 'Failed to create client. Please try again.');
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
        
        <div className="flex items-center space-x-2 pt-2">
          <Checkbox 
            id="send-invite" 
            checked={watch('sendInvite')}
            onCheckedChange={(checked) => setValue('sendInvite', checked === true)}
          />
          <label htmlFor="send-invite" className="text-sm font-medium text-gray-700 cursor-pointer">
            Send invitation email to client (creates user account)
          </label>
        </div>
        
        <div className="flex justify-end pt-4">
          <Button 
            type="submit" 
            isLoading={isLoading} 
            rightIcon={
              <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            }
          >
            Create Client
          </Button>
        </div>
      </form>
    </div>
  );
} 