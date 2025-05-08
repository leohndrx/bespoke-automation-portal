import React from 'react';
import { Task, Project } from '@/lib/supabase/types';
import { Button } from '@/components/ui/button';
import clsx from 'clsx';

interface TaskCardProps {
  task: Task;
  project?: Project | null;
  showProject?: boolean;
  showPricing?: boolean;
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  onStatusChange?: (task: Task, newStatus: 'todo' | 'in_progress' | 'done') => void;
}

export function TaskCard({
  task,
  project,
  showProject = false,
  showPricing = false,
  onEdit,
  onDelete,
  onStatusChange,
}: TaskCardProps) {
  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    onEdit?.(task);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    if (window.confirm('Are you sure you want to delete this task?')) {
      onDelete?.(task);
    }
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.preventDefault();
    const newStatus = e.target.value as 'todo' | 'in_progress' | 'done';
    onStatusChange?.(task, newStatus);
  };

  const formattedCreatedDate = new Date(task.created_at).toLocaleDateString();
  const formattedDueDate = task.due_date
    ? new Date(task.due_date).toLocaleDateString()
    : null;

  // Calculate total
  const totalAmount = task.hours && task.price_per_hour 
    ? task.hours * task.price_per_hour 
    : null;

  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200 overflow-hidden p-5">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{task.title}</h3>
          {showProject && project && (
            <div className="text-sm text-blue-600 mb-1">
              Project: {project.name}
            </div>
          )}
          {task.description && (
            <p className="text-gray-600 text-sm mb-3">{task.description}</p>
          )}
        </div>
        <div
          className={clsx(
            'px-2 py-1 text-xs font-medium rounded',
            {
              'bg-gray-100 text-gray-800': task.status === 'todo',
              'bg-blue-100 text-blue-800': task.status === 'in_progress',
              'bg-green-100 text-green-800': task.status === 'done',
            }
          )}
        >
          {task.status === 'todo' && 'To Do'}
          {task.status === 'in_progress' && 'In Progress'}
          {task.status === 'done' && 'Done'}
        </div>
      </div>

      {showPricing && (
        <div className="mt-2 space-y-1">
          {task.hours !== null && (
            <div className="text-sm">
              <span className="font-medium">Hours:</span> {task.hours}
            </div>
          )}
          {task.price_per_hour !== null && (
            <div className="text-sm">
              <span className="font-medium">Rate:</span> ${task.price_per_hour}/hour
            </div>
          )}
          {totalAmount !== null && (
            <div className="text-sm font-medium">
              <span className="font-medium">Total:</span> ${totalAmount.toFixed(2)}
            </div>
          )}
          {task.approved !== null && (
            <div className={`text-sm ${task.approved ? 'text-green-600' : 'text-amber-600'}`}>
              {task.approved ? 'Approved' : 'Pending Approval'}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between text-sm mt-4">
        <div className="text-gray-500">
          <div>Created: {formattedCreatedDate}</div>
          {formattedDueDate && <div>Due: {formattedDueDate}</div>}
        </div>
        <div className="flex space-x-2">
          {onStatusChange && (
            <select
              value={task.status}
              onChange={handleStatusChange}
              className="text-sm border border-gray-300 rounded py-1 px-2"
            >
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          )}
          {onEdit && (
            <Button variant="outline" size="sm" onClick={handleEdit}>
              Edit
            </Button>
          )}
          {onDelete && (
            <Button variant="danger" size="sm" onClick={handleDelete}>
              Delete
            </Button>
          )}
        </div>
      </div>
    </div>
  );
} 