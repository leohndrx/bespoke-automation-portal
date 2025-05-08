'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { createClient } from '@/lib/supabase/client';
import { Project, Client } from '@/lib/supabase/types';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

interface TaskFormData {
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'done';
  project_id: string | null;
  client_id: string | null;
  due_date: string | null;
  hours: number | null;
  price_per_hour: number | null;
  approved: boolean | null;
}

interface NewTaskFormProps {
  projects: Project[];
  clients: Client[];
  defaultProjectId?: string;
  defaultClientId?: string;
}

export default function NewTaskForm({ 
  projects, 
  clients,
  defaultProjectId,
  defaultClientId
}: NewTaskFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors },
    setValue,
    watch
  } = useForm<TaskFormData>({
    defaultValues: {
      title: '',
      description: '',
      status: 'todo',
      project_id: defaultProjectId || null,
      client_id: defaultClientId || null,
      due_date: null,
      hours: null,
      price_per_hour: null,
      approved: false,
    }
  });
  
  // Watch for project_id changes
  const selectedProjectId = watch('project_id');
  
  // Set the project ID when it changes in props
  useEffect(() => {
    if (defaultProjectId) {
      setValue('project_id', defaultProjectId);
    }
    if (defaultClientId) {
      setValue('client_id', defaultClientId);
    }
  }, [defaultProjectId, defaultClientId, setValue]);
  
  // Update client_id when project changes
  useEffect(() => {
    if (selectedProjectId) {
      const selectedProject = projects.find(p => p.id === selectedProjectId);
      if (selectedProject?.client_id) {
        setValue('client_id', selectedProject.client_id);
      } else {
        setValue('client_id', null);
      }
    }
  }, [selectedProjectId, projects, setValue]);
  
  // Check if user is admin
  useEffect(() => {
    async function checkAdmin() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: userRole } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();
        
        setIsAdmin(userRole?.role === 'admin');
      }
    }
    
    checkAdmin();
  }, [supabase]);
  
  const statusOptions = [
    { value: 'todo', label: 'To Do' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'done', label: 'Done' },
  ];

  const projectOptions = [
    { value: '', label: 'No Project' },
    ...projects.map((project) => ({
      value: project.id,
      label: project.name,
    })),
  ];

  const clientOptions = [
    { value: '', label: 'No Client' },
    ...clients.map((client) => ({
      value: client.id,
      label: client.company,
    })),
  ];

  // Calculate total price
  const hours = watch('hours') || 0;
  const pricePerHour = watch('price_per_hour') || 0;
  const totalPrice = hours * pricePerHour;
  
  const onSubmit = async (data: TaskFormData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // If a project is selected, use its client_id (overriding any direct client selection)
      let clientId = data.client_id;
      if (data.project_id) {
        const selectedProject = projects.find(p => p.id === data.project_id);
        clientId = selectedProject?.client_id || null;
      }
      
      // Create the task
      const { error } = await supabase.from('tasks').insert({
        title: data.title,
        description: data.description,
        status: data.status,
        project_id: data.project_id || null,
        client_id: clientId,
        due_date: data.due_date,
        owner_id: user.id,
        hours: isAdmin ? data.hours : null,
        price_per_hour: isAdmin ? data.price_per_hour : null,
        approved: isAdmin ? data.approved : false,
      });
      
      if (error) {
        throw error;
      }
      
      // If task is part of a project, update the project's total price
      if (data.project_id && isAdmin && data.price_per_hour && data.hours) {
        const taskPrice = data.price_per_hour * data.hours;
        
        // Get current project total
        const { data: projectData } = await supabase
          .from('projects')
          .select('total_price')
          .eq('id', data.project_id)
          .single();
        
        const currentTotal = projectData?.total_price || 0;
        
        // Update project total
        await supabase
          .from('projects')
          .update({ 
            total_price: currentTotal + taskPrice,
            // If the project is pending and this task is approved, mark project as approved
            status: data.approved ? 'approved' : undefined
          })
          .eq('id', data.project_id);
      }
      
      // Navigate based on where the task belongs
      if (data.project_id) {
        router.push(`/projects/${data.project_id}`);
      } else {
        router.push('/tasks');
      }
      router.refresh();
    } catch (error: any) {
      console.error('Error creating task:', error);
      setError(error.message || 'Failed to create task. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 mb-4 rounded">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          id="task-title"
          label="Task Title"
          fullWidth
          error={errors.title?.message}
          {...register('title', { required: 'Task title is required' })}
        />

        <Textarea
          id="task-description"
          label="Description"
          fullWidth
          rows={3}
          {...register('description')}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            id="task-status"
            label="Status"
            options={statusOptions}
            error={errors.status?.message}
            fullWidth
            {...register('status', { required: 'Status is required' })}
          />

          <Select
            id="task-project"
            label="Project"
            options={projectOptions}
            fullWidth
            {...register('project_id')}
          />
        </div>

        {!selectedProjectId && (
          <Select
            id="task-client"
            label="Client"
            options={clientOptions}
            fullWidth
            {...register('client_id')}
          />
        )}

        <Input
          id="task-due-date"
          label="Due Date"
          type="date"
          fullWidth
          {...register('due_date')}
        />

        <Input
          id="task-hours"
          label="Hours"
          type="number"
          fullWidth
          step="0.5"
          {...register('hours', { 
            valueAsNumber: true,
            min: { value: 0, message: 'Hours cannot be negative' }
          })}
        />

        {isAdmin && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                id="task-price-per-hour"
                label="Price per Hour"
                type="number"
                fullWidth
                placeholder="Enter hourly rate"
                step="0.01"
                {...register('price_per_hour', { 
                  valueAsNumber: true,
                  min: { value: 0, message: 'Price cannot be negative' }
                })}
              />
              
              <div className="flex flex-col justify-end">
                <div className="text-sm font-medium text-gray-700 mb-1">Total Price</div>
                <div className="h-10 px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                  ${totalPrice.toFixed(2)}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="task-approved"
                checked={watch('approved') || false}
                onCheckedChange={(checked) => 
                  setValue('approved', checked === true)
                }
              />
              <label htmlFor="task-approved" className="text-sm font-medium text-gray-700 cursor-pointer">
                Approve Task
              </label>
            </div>
          </>
        )}

        <div className="flex justify-end pt-4">
          <Button type="submit" isLoading={isLoading}>
            Create Task
          </Button>
        </div>
      </form>
    </div>
  );
} 