'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { DeleteButton } from '@/components/delete-button';
import { deleteTask } from '@/app/actions/delete-actions';

interface DeleteTaskButtonProps {
  taskId: string;
  redirectTo?: string;
}

export function DeleteTaskButton({ taskId, redirectTo }: DeleteTaskButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleDelete = async () => {
    startTransition(async () => {
      await deleteTask(taskId, redirectTo);
      if (redirectTo) {
        router.push(redirectTo);
      }
    });
  };

  return (
    <DeleteButton
      entityName="task"
      onDelete={handleDelete}
    />
  );
} 