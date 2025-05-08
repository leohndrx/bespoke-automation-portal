import React from 'react';
import { useForm } from 'react-hook-form';
import { Project, Client } from '@/lib/supabase/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

interface ProjectFormData {
  name: string;
  description: string;
  client_id: string | null;
  is_archived: boolean;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | null;
  total_price: number | null;
}

interface ProjectFormProps {
  onSubmit: (data: ProjectFormData) => Promise<void>;
  initialData?: Partial<Project>;
  clients: Client[];
  isLoading?: boolean;
  showAdminFields?: boolean;
  showClientSelect?: boolean;
}

export function ProjectForm({ 
  onSubmit, 
  initialData = {}, 
  clients = [],
  isLoading = false,
  showAdminFields = false,
  showClientSelect = true
}: ProjectFormProps) {
  const { 
    register, 
    handleSubmit, 
    formState: { errors },
    watch,
    setValue
  } = useForm<ProjectFormData>({
    defaultValues: {
      name: initialData.name || '',
      description: initialData.description || '',
      client_id: initialData.client_id || null,
      is_archived: initialData.is_archived || false,
      status: initialData.status || 'pending',
      total_price: initialData.total_price || null,
    }
  });

  const clientOptions = [
    { value: '', label: 'No Client' },
    ...clients.map(client => ({
      value: client.id,
      label: client.company
    })),
  ];

  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'completed', label: 'Completed' },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        id="project-name"
        label="Project Name"
        fullWidth
        error={errors.name?.message}
        {...register('name', { required: 'Project name is required' })}
      />
      
      {showClientSelect && (
        <Select
          id="project-client"
          label="Client"
          options={clientOptions}
          fullWidth
          {...register('client_id')}
        />
      )}
      
      <Textarea
        id="project-description"
        label="Description"
        fullWidth
        rows={4}
        {...register('description')}
      />

      {showAdminFields && (
        <>
          <Select
            id="project-status"
            label="Status"
            options={statusOptions}
            fullWidth
            {...register('status')}
          />
          
          <Input
            id="project-total-price"
            label="Total Price"
            type="number"
            fullWidth
            step="0.01"
            {...register('total_price', {
              valueAsNumber: true,
              min: { value: 0, message: 'Price cannot be negative' }
            })}
          />
        </>
      )}
      
      {showAdminFields && (
        <div className="flex items-center">
          <Checkbox
            id="project-archived"
            checked={watch('is_archived') || false}
            onCheckedChange={(checked) => 
              setValue('is_archived', checked === true)
            }
          />
          <label htmlFor="project-archived" className="ml-2 block text-sm text-gray-900 cursor-pointer">
            Archive this project
          </label>
        </div>
      )}
      
      <div className="flex justify-end pt-4">
        <Button type="submit" isLoading={isLoading}>
          {initialData.id ? 'Update Project' : 'Create Project'}
        </Button>
      </div>
    </form>
  );
} 