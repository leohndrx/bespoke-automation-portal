'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { createClient } from '@/lib/supabase/client';
import { Client } from '@/lib/supabase/types';

interface TaskFiltersProps {
  totalTasks: number;
  hasUnapprovedTasks: boolean;
}

export function AdminTaskFilters({ totalTasks, hasUnapprovedTasks }: TaskFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [expanded, setExpanded] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Get current filter values from URL
  const currentClient = searchParams.get('client') || '';
  const currentSortBy = searchParams.get('sort') || 'created_at_desc';
  const currentValueMin = searchParams.get('value_min') || '';
  const currentValueMax = searchParams.get('value_max') || '';
  const filterUnapproved = searchParams.get('unapproved') === 'true';
  
  // Fetch clients for the filter dropdown
  useEffect(() => {
    const loadClients = async () => {
      try {
        setIsLoading(true);
        const supabase = createClient();
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .order('company');
          
        if (error) {
          throw error;
        }
        
        setClients(data || []);
      } catch (error) {
        console.error('Error loading clients:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (expanded) {
      loadClients();
    }
  }, [expanded]);
  
  // Helper function to update URL with filters
  const updateFilters = (params: Record<string, string | null>) => {
    const newParams = new URLSearchParams(searchParams.toString());
    
    // Update or remove each parameter
    Object.entries(params).forEach(([key, value]) => {
      if (value === null) {
        newParams.delete(key);
      } else {
        newParams.set(key, value);
      }
    });
    
    // Navigate to the new URL
    router.push(`${pathname}?${newParams.toString()}`);
  };
  
  // Quick filter presets
  const applyHighValueFilter = () => {
    updateFilters({
      value_min: '500',
      value_max: null,
      sort: 'value_desc',
      unapproved: null
    });
  };
  
  const applyUnapprovedFilter = () => {
    updateFilters({
      unapproved: 'true',
      sort: 'created_at_desc',
      value_min: null,
      value_max: null
    });
  };
  
  const resetFilters = () => {
    router.push(pathname);
  };
  
  // Sorting options
  const sortOptions = [
    { value: 'created_at_desc', label: 'Newest First' },
    { value: 'created_at_asc', label: 'Oldest First' },
    { value: 'value_desc', label: 'Value: High to Low' },
    { value: 'value_asc', label: 'Value: Low to High' },
    { value: 'due_date_asc', label: 'Due Date: Soonest' },
    { value: 'title_asc', label: 'Title: A-Z' },
  ];
  
  const clientOptions = [
    { value: '', label: 'All Clients' },
    ...clients.map(client => ({
      value: client.id, 
      label: client.company
    }))
  ];
  
  return (
    <div className="bg-white shadow-sm border rounded-lg overflow-hidden mb-6">
      <div className="px-4 py-3 bg-gray-50 border-b flex justify-between items-center">
        <h3 className="font-medium text-gray-700">Admin Filters</h3>
        <button 
          onClick={() => setExpanded(!expanded)}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          {expanded ? 'Hide Filters' : 'Show Filters'}
        </button>
      </div>
      
      {expanded && (
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <Select
                id="sort-by"
                options={sortOptions}
                value={currentSortBy}
                onChange={(e) => updateFilters({ sort: e.target.value })}
                fullWidth
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
              <Select
                id="client-filter"
                options={clientOptions}
                value={currentClient}
                onChange={(e) => updateFilters({ client: e.target.value || null })}
                fullWidth
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Value (€)</label>
                <input
                  type="number"
                  value={currentValueMin}
                  onChange={(e) => updateFilters({ value_min: e.target.value })}
                  className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                  placeholder="Min value"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Value (€)</label>
                <input
                  type="number"
                  value={currentValueMax}
                  onChange={(e) => updateFilters({ value_max: e.target.value })}
                  className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                  placeholder="Max value"
                />
              </div>
            </div>
          </div>
          
          <div className="flex space-x-3 mb-4">
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={filterUnapproved}
                onChange={(e) => updateFilters({ unapproved: e.target.checked ? 'true' : null })}
                className="w-4 h-4 rounded"
              />
              <span>Unapproved Tasks Only</span>
            </label>
          </div>
          
          <div className="flex flex-wrap gap-2 pt-3 border-t">
            <Button
              size="sm"
              variant="outline"
              onClick={applyHighValueFilter}
            >
              High Value Tasks
            </Button>
            
            {hasUnapprovedTasks && (
              <Button
                size="sm"
                variant="outline"
                onClick={applyUnapprovedFilter}
              >
                Needs Approval ({hasUnapprovedTasks ? 'Some' : '0'})
              </Button>
            )}
            
            <Button
              size="sm"
              variant="outline"
              onClick={resetFilters}
              className="ml-auto"
            >
              Reset Filters
            </Button>
          </div>
        </div>
      )}
    </div>
  );
} 