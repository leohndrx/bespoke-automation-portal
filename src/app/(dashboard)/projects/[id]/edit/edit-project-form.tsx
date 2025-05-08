'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProjectForm } from '@/components/project/project-form';
import { createClient } from '@/lib/supabase/client';
import { Project, Client } from '@/lib/supabase/types';

interface EditProjectFormProps {
  project: Project;
  clients: Client[];
  showAdminFields?: boolean;
  showClientSelect?: boolean;
}

interface ProjectFormData {
  name: string;
  description: string;
  client_id: string | null;
  is_archived: boolean;
  status?: 'pending' | 'approved' | 'rejected' | 'completed' | null;
  total_price?: number | null;
}

export default function EditProjectForm({ 
  project, 
  clients,
  showAdminFields = false,
  showClientSelect = true
}: EditProjectFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleSubmit = async (data: ProjectFormData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Prepare update data
      const updateData: any = {
        name: data.name,
        description: data.description,
        client_id: data.client_id,
        is_archived: data.is_archived
      };
      
      // Add admin fields if showing admin fields
      if (showAdminFields) {
        updateData.status = data.status;
        updateData.total_price = data.total_price;
      }
      
      // Update the project
      const { error } = await supabase
        .from('projects')
        .update(updateData)
        .eq('id', project.id);
      
      if (error) {
        throw error;
      }
      
      // Navigate back to project detail
      router.push(`/projects/${project.id}`);
      router.refresh();
    } catch (error: any) {
      console.error('Error updating project:', error);
      setError(error.message || 'Failed to update project. Please try again.');
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
      
      <ProjectForm 
        onSubmit={handleSubmit}
        initialData={project}
        clients={clients}
        isLoading={isLoading}
        showAdminFields={showAdminFields}
        showClientSelect={showClientSelect}
      />
    </div>
  );
} 