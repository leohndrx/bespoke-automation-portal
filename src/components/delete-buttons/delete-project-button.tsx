'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { DeleteButton } from '@/components/delete-button';
import { deleteProject } from '@/app/actions/delete-actions';

interface DeleteProjectButtonProps {
  projectId: string;
}

export function DeleteProjectButton({ projectId }: DeleteProjectButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleDelete = async () => {
    startTransition(async () => {
      await deleteProject(projectId);
      router.push('/projects');
    });
  };

  return (
    <DeleteButton
      entityName="project"
      onDelete={handleDelete}
      confirmText="This will permanently delete this project and all of its associated tasks. This action cannot be undone."
      variant="danger"
      size="sm"
    />
  );
} 