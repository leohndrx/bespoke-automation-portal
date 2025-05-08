'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProjectForm } from '@/components/project/project-form';
import { createClient } from '@/lib/supabase/client';
import { Client } from '@/lib/supabase/types';

interface ProjectFormData {
  name: string;
  description: string;
  client_id: string | null;
  is_archived: boolean;
}

interface NewProjectFormProps {
  clients: Client[];
  defaultClientId?: string;
  showClientSelect?: boolean;
}

export default function NewProjectForm({ 
  clients, 
  defaultClientId,
  showClientSelect = true
}: NewProjectFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSubmit = async (data: ProjectFormData) => {
    setIsLoading(true);
    
    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // Create the project
      const { error } = await supabase.from('projects').insert({
        name: data.name,
        description: data.description,
        client_id: data.client_id || defaultClientId || null,
        is_archived: data.is_archived || false,
        owner_id: user.id,
      });
      
      if (error) {
        throw error;
      }
      
      // Navigate back to projects list
      router.push('/projects');
      router.refresh();
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Failed to create project. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <ProjectForm 
      onSubmit={handleSubmit}
      isLoading={isLoading}
      clients={clients}
      initialData={{ client_id: defaultClientId }}
      showClientSelect={showClientSelect}
    />
  );
} 