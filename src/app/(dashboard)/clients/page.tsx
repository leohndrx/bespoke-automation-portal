import React from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ClientCard } from '@/components/client/client-card';
import { Button } from '@/components/ui/button';
import { Client } from '@/lib/supabase/types';

export default async function ClientsPage() {
  const supabase = await createClient();
  
  const { data: clients, error } = await supabase
    .from('clients')
    .select('*')
    .order('name');
  
  if (error) {
    console.error('Error loading clients:', error);
  }
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Clients</h1>
          <p className="text-gray-600">Manage your clients</p>
        </div>
        <Link href="/clients/new">
          <Button>New Client</Button>
        </Link>
      </div>
      
      {clients && clients.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.map((client: Client) => (
            <ClientCard key={client.id} client={client} />
          ))}
        </div>
      ) : (
        <div className="bg-white p-12 rounded-lg shadow-sm border border-gray-200 text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No clients yet
          </h3>
          <p className="text-gray-600 mb-6">
            Get started by creating your first client
          </p>
          <Link href="/clients/new">
            <Button>Create Client</Button>
          </Link>
        </div>
      )}
    </div>
  );
} 