'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ClientCard } from '@/components/client/client-card';
import { Client } from '@/lib/supabase/types';

export default function AdminClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingClient, setDeletingClient] = useState<string | null>(null);

  useEffect(() => {
    loadClients();
  }, []);

  async function loadClients() {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/clients');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load clients');
      }
      
      setClients(data.clients || []);
    } catch (err: any) {
      console.error('Error loading clients:', err);
      setError(err.message || 'Failed to load clients');
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteClient(clientId: string) {
    if (!confirm('Are you sure you want to delete this company? This will remove all user associations but not the users themselves.')) {
      return;
    }

    try {
      setDeletingClient(clientId);
      
      const response = await fetch(`/api/admin/clients/${clientId}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete company');
      }
      
      // Update the clients list by removing the deleted client
      setClients(clients.filter(client => client.id !== clientId));
      
    } catch (err: any) {
      console.error('Error deleting client:', err);
      alert(err.message || 'Failed to delete company');
    } finally {
      setDeletingClient(null);
    }
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto my-12 bg-red-50 p-6 rounded-xl border border-red-200 shadow-sm">
        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-red-100">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>
        <h2 className="text-xl font-bold text-red-700 mb-2 text-center">Error Loading Companies</h2>
        <p className="text-red-600 mb-6 text-center">
          {error}
        </p>
        <div className="flex justify-center">
          <Button variant="outline" size="lg" className="shadow-sm" onClick={loadClients}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-12 gap-4">
        <div className="relative">
          <h1 className="text-3xl font-bold mb-1 relative inline-block">
            Company Management
            <span className="absolute -bottom-1 left-0 w-1/3 h-1 bg-gradient-to-r from-primary to-primary-light rounded-full"></span>
          </h1>
          <p className="text-muted-foreground">Manage companies and user invitations</p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/clients/new">
            <Button variant="outline" size="lg" className="shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
              New Company
            </Button>
          </Link>
          <Link href="/admin/users/add">
            <Button size="lg" className="shadow-sm group relative overflow-hidden">
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-primary-light to-primary opacity-0 group-hover:opacity-10 transition-opacity duration-300"></span>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-1.5 transform group-hover:rotate-90 transition-transform duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="8.5" cy="7" r="4"></circle>
                <line x1="20" y1="8" x2="20" y2="14"></line>
                <line x1="23" y1="11" x2="17" y2="11"></line>
              </svg>
              Invite User
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Company Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="bg-white p-6 rounded-xl border border-border shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-1">
          <div className="text-sm font-medium text-muted-foreground mb-1">Total Companies</div>
          <div className="text-2xl font-bold text-gradient">{clients?.length || 0}</div>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin h-12 w-12 border-4 border-primary rounded-full border-t-transparent"></div>
        </div>
      ) : clients && clients.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.map((client: Client) => (
            <ClientCard 
              key={client.id} 
              client={client} 
              adminView={true}
              inviteLink={`/admin/users/add?client=${client.id}`}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-200 text-center">
          <div className="mx-auto flex items-center justify-center w-20 h-20 mb-6 bg-primary bg-opacity-5 text-primary rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No companies yet
          </h3>
          <p className="text-gray-600 mb-6">
            Get started by adding your first company
          </p>
          <Link href="/admin/clients/new">
            <Button>Create Company</Button>
          </Link>
        </div>
      )}
    </div>
  );
} 