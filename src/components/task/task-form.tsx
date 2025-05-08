import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Project, Task, Client } from '@/lib/supabase/types';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { isAdmin } from '@/lib/auth/roles';

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

interface TaskFormProps {
  onSubmit: (data: TaskFormData) => Promise<void>;
  initialData?: Partial<Task>;
  projects: Project[];
  clients: Client[];
  isLoading?: boolean;
  defaultProjectId?: string | null;
  defaultClientId?: string | null;
  showAdminFields?: boolean;
}

export function TaskForm({
  onSubmit,
  initialData = {},
  projects,
  clients,
  isLoading = false,
  defaultProjectId = null,
  defaultClientId = null,
  showAdminFields = false,
}: TaskFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<TaskFormData>({
    defaultValues: {
      title: initialData.title || '',
      description: initialData.description || '',
      status: initialData.status || 'todo',
      project_id: initialData.project_id || defaultProjectId || null,
      client_id: initialData.client_id || defaultClientId || null,
      due_date: initialData.due_date || null,
      hours: initialData.hours || null,
      price_per_hour: initialData.price_per_hour || null,
      approved: initialData.approved || false,
    },
  });

  // Watch for project_id changes to handle client_id updates
  const selectedProjectId = watch('project_id');

  // Get the associated client from the selected project
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

  return (
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

      {showAdminFields && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              id="task-price-per-hour"
              label="Price per Hour"
              type="number"
              fullWidth
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
          {initialData.id ? 'Update Task' : 'Create Task'}
        </Button>
      </div>
    </form>
  );
} 