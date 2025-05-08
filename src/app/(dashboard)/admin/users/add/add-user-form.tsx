'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface AddUserFormData {
  email: string;
  name: string;
  company: string;
  clientId?: string;
}

interface Client {
  id: string;
  company: string;
}

export default function AddUserForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedClientId = searchParams.get('client');
  
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | undefined>(
    preselectedClientId || undefined
  );
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors },
    reset,
    setValue
  } = useForm<AddUserFormData>({
    defaultValues: {
      clientId: preselectedClientId || undefined
    }
  });
  
  // Load clients for dropdown
  useEffect(() => {
    const fetchClients = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('clients')
        .select('id, company')
        .order('company');
      
      if (data) {
        setClients(data);
      }
    };
    
    fetchClients();
  }, []);
  
  // Create client options for the select component
  const clientOptions = clients.map(client => ({
    value: client.id,
    label: client.company
  }));
  
  // Add an option for creating a new company
  const selectOptions = [
    { value: "", label: "-- Create New Company --" },
    ...clientOptions
  ];
  
  // Handle client selection
  const handleClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedClientId(value);
    setValue('clientId', value);
  };
  
  const handleAddUser = async (data: AddUserFormData) => {
    setIsLoading(true);
    setMessage(null);
    
    try {
      const response = await fetch('/api/admin/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          name: data.name,
          company: data.company,
          clientId: selectedClientId
        }),
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        setMessage({
          type: 'success',
          text: `Success! Invitation sent to ${data.email}`
        });
        reset();
        
        // Go back to client page if we came from there
        if (preselectedClientId) {
          setTimeout(() => {
            router.push(`/admin/clients/${preselectedClientId}`);
          }, 2000);
        } else {
          // Otherwise just refresh
          setTimeout(() => {
            router.push('/admin/clients');
          }, 2000);
        }
      } else {
        setMessage({
          type: 'error',
          text: result.error || 'Failed to invite user'
        });
      }
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'An error occurred'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit(handleAddUser)} className="space-y-4">
      {message && (
        <div className={`p-3 rounded-md mb-3 ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800' 
            : 'bg-red-50 text-red-800'
        }`}>
          {message.text}
        </div>
      )}
      
      <Input
        id="user-email"
        type="email"
        label="Email Address"
        fullWidth
        error={errors.email?.message}
        {...register('email', { 
          required: 'Email is required',
          pattern: {
            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
            message: 'Invalid email address',
          }
        })}
      />
      
      <Input
        id="user-name"
        label="Full Name"
        fullWidth
        error={errors.name?.message}
        {...register('name', { required: 'Name is required' })}
      />
      
      <div>
        <Label htmlFor="client-select">Client Company</Label>
        <Select 
          id="client-select"
          options={selectOptions}
          value={selectedClientId}
          onChange={handleClientChange}
          fullWidth
        />
      </div>
      
      {!selectedClientId && (
        <Input
          id="user-company"
          label="New Company Name"
          fullWidth
          {...register('company')}
        />
      )}
      
      <div className="flex justify-end pt-4">
        <Button 
          type="submit" 
          disabled={isLoading}
          isLoading={isLoading}
        >
          Send Invitation
        </Button>
      </div>
    </form>
  );
} 