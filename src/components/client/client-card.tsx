'use client';

import React from 'react';
import Link from 'next/link';
import { Client } from '@/lib/supabase/types';
import { Button } from '@/components/ui/button';

interface ClientCardProps {
  client: Client;
  adminView?: boolean;
  inviteLink?: string;
  onEdit?: (client: Client) => void;
}

export function ClientCard({ 
  client, 
  adminView = false,
  inviteLink,
  onEdit
}: ClientCardProps) {
  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    onEdit?.(client);
  };
  
  const formattedDate = new Date(client.created_at).toLocaleDateString();
  
  // Determine the link target based on view mode
  const detailLink = adminView 
    ? `/admin/clients/${client.id}`
    : `/clients/${client.id}`;
  
  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200 overflow-hidden">
      <Link
        href={detailLink}
        className="block p-5"
      >
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{client.company}</h3>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Created: {formattedDate}</span>
          <div className="flex space-x-2">
            {onEdit && (
              <Button variant="outline" size="sm" onClick={handleEdit}>
                Edit
              </Button>
            )}
          </div>
        </div>
      </Link>
      
      {/* Admin buttons */}
      {adminView && (
        <div className="bg-gray-50 p-3 border-t border-gray-200">
          <div className="flex justify-end gap-2">
            <Link href={`/admin/clients/${client.id}/edit`}>
              <Button variant="outline" size="sm">
                Edit Company
              </Button>
            </Link>
            {inviteLink && (
              <Link href={inviteLink}>
                <Button size="sm">
                  Invite User
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 