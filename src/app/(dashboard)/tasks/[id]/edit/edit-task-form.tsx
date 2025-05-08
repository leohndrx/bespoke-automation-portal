'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TaskForm } from '@/components/task/task-form';
import { createClient } from '@/lib/supabase/client';
import { Task, Project, Client } from '@/lib/supabase/types';

interface EditTaskFormProps {
  task: Task;
  projects: Project[];
  clients: Client[];
  showAdminFields?: boolean;
}

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

export default function EditTaskForm({ 
  task, 
  projects,
  clients,
  showAdminFields = false
}: EditTaskFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleSubmit = async (data: TaskFormData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get original task data for comparison
      const oldHours = task.hours || 0;
      const oldPrice = task.price_per_hour || 0;
      const oldTotal = oldHours * oldPrice;
      
      // Calculate new total
      const newHours = data.hours || 0;
      const newPrice = data.price_per_hour || 0;
      const newTotal = newHours * newPrice;
      
      // If a project is selected, use its client_id (overriding any direct client selection)
      let clientId = data.client_id;
      if (data.project_id) {
        const selectedProject = projects.find(p => p.id === data.project_id);
        clientId = selectedProject?.client_id || null;
      }
      
      // Prepare update data
      const updateData = {
        title: data.title,
        description: data.description,
        status: data.status,
        project_id: data.project_id,
        client_id: clientId,
        due_date: data.due_date,
        hours: data.hours,
        price_per_hour: showAdminFields ? data.price_per_hour : task.price_per_hour,
        approved: showAdminFields ? data.approved : task.approved
      };
      
      // Update the task
      const { error: updateError } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', task.id);
      
      if (updateError) {
        throw updateError;
      }
      
      // If task is part of a project and admin is updating price/hours, update project total_price
      if (data.project_id && showAdminFields && (oldTotal !== newTotal)) {
        // Get current project total
        const { data: projectData } = await supabase
          .from('projects')
          .select('total_price')
          .eq('id', data.project_id)
          .single();
        
        const currentTotal = (projectData?.total_price || 0);
        // Calculate the difference and update total
        const priceDifference = newTotal - oldTotal;
        const newProjectTotal = currentTotal + priceDifference;
        
        // Update project with new total
        await supabase
          .from('projects')
          .update({ 
            total_price: newProjectTotal >= 0 ? newProjectTotal : 0,
            // If the task is approved, mark project as approved
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
      console.error('Error updating task:', error);
      setError(error.message || 'Failed to update task. Please try again.');
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
      
      <TaskForm 
        onSubmit={handleSubmit}
        initialData={task}
        projects={projects}
        clients={clients}
        isLoading={isLoading}
        showAdminFields={showAdminFields}
      />
    </div>
  );
} 