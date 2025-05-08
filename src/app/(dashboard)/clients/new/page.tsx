import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import NewClientForm from './new-client-form';

export default function NewClientPage() {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">New Client</h1>
          <p className="text-gray-600">Create a new client profile</p>
        </div>
        <Link href="/clients">
          <Button variant="outline">Cancel</Button>
        </Link>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <NewClientForm />
      </div>
    </div>
  );
} 