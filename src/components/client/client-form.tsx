import React from 'react';
import { useForm } from 'react-hook-form';
import { Client } from '@/lib/supabase/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface ClientFormData {
  name: string;
  phone: string;
  company: string;
  description: string;
}

interface ClientFormProps {
  onSubmit: (data: ClientFormData) => Promise<void>;
  initialData?: Partial<Client>;
  isLoading?: boolean;
}

export function ClientForm({ 
  onSubmit, 
  initialData = {}, 
  isLoading = false 
}: ClientFormProps) {
  const { 
    register, 
    handleSubmit, 
    formState: { errors } 
  } = useForm<ClientFormData>({
    defaultValues: {
      name: initialData.name || '',
      phone: initialData.phone || '',
      company: initialData.company || '',
      description: initialData.description || '',
    }
  });

  return (
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
          rightIcon={
            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          }
        >
          {initialData.id ? 'Update Client' : 'Create Client'}
        </Button>
      </div>
    </form>
  );
} 