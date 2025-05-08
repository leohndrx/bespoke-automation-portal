'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface DeleteButtonProps {
  entityName: string;
  onDelete: () => Promise<void>;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  confirmText?: string;
}

export function DeleteButton({
  entityName,
  onDelete,
  variant = 'danger',
  size = 'md',
  className,
  confirmText,
}: DeleteButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      setError(null);
      await onDelete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={() => setIsDialogOpen(true)}
      >
        Delete
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm deletion</DialogTitle>
            <DialogDescription>
              {confirmText || `Are you sure you want to delete this ${entityName}? This action cannot be undone.`}
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="bg-red-50 text-red-800 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 