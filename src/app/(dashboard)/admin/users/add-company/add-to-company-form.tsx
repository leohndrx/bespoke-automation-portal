'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

interface Company {
  id: string;
  name: string;
  company?: string;
}

interface AddToCompanyFormProps {
  userId: string;
  companies: Company[];
}

interface FormData {
  companyId: string;
  role: 'admin' | 'member' | 'viewer';
}

export default function AddToCompanyForm({ userId, companies }: AddToCompanyFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [selectedRole, setSelectedRole] = useState<'admin' | 'member' | 'viewer'>('member');
  
  const { 
    handleSubmit, 
    register,
    formState: { errors }
  } = useForm<FormData>({
    defaultValues: {
      role: 'member'
    }
  });
  
  // Convert companies to options for the select component
  const companyOptions = companies.map(company => ({
    value: company.id,
    label: company.company ? `${company.name} (${company.company})` : company.name
  }));
  
  const handleRoleChange = (role: 'admin' | 'member' | 'viewer') => {
    setSelectedRole(role);
  };
  
  const onSubmit = async (data: FormData) => {
    if (!data.companyId) {
      setMessage({
        type: 'error',
        text: 'Please select a company'
      });
      return;
    }
    
    setIsLoading(true);
    setMessage(null);
    
    try {
      const response = await fetch('/api/admin/add-user-to-company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          clientId: data.companyId,
          role: selectedRole
        }),
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        setMessage({
          type: 'success',
          text: 'User successfully added to company'
        });
        
        // Redirect back to user detail
        setTimeout(() => {
          router.push(`/admin/users/${userId}`);
          router.refresh();
        }, 1500);
      } else {
        setMessage({
          type: 'error',
          text: result.error || 'Failed to add user to company'
        });
      }
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'An error occurred'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {message && (
        <div className={`p-3 rounded-md mb-3 ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800' 
            : 'bg-red-50 text-red-800'
        }`}>
          {message.text}
        </div>
      )}
      
      <div>
        <Label htmlFor="company-select">Select Company</Label>
        <Select
          id="company-select"
          label=""
          options={companyOptions}
          fullWidth
          {...register('companyId', { required: 'Please select a company' })}
        />
        {errors.companyId && (
          <p className="text-sm text-red-600">{errors.companyId.message}</p>
        )}
      </div>
      
      <div className="space-y-3">
        <Label>User Role</Label>
        <div className="space-y-4 mt-2">
          <div className="flex items-start space-x-3">
            <div className="flex h-5 items-center">
              <input
                type="radio"
                id="role-admin"
                name="role"
                value="admin"
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={selectedRole === 'admin'}
                onChange={() => handleRoleChange('admin')}
              />
            </div>
            <div className="flex flex-col">
              <label htmlFor="role-admin" className="font-medium cursor-pointer">
                Admin
              </label>
              <span className="text-sm text-gray-500">Can manage company and projects</span>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="flex h-5 items-center">
              <input
                type="radio"
                id="role-member"
                name="role"
                value="member"
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={selectedRole === 'member'}
                onChange={() => handleRoleChange('member')}
              />
            </div>
            <div className="flex flex-col">
              <label htmlFor="role-member" className="font-medium cursor-pointer">
                Member
              </label>
              <span className="text-sm text-gray-500">Can view and edit assigned projects</span>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="flex h-5 items-center">
              <input
                type="radio"
                id="role-viewer"
                name="role"
                value="viewer"
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={selectedRole === 'viewer'}
                onChange={() => handleRoleChange('viewer')}
              />
            </div>
            <div className="flex flex-col">
              <label htmlFor="role-viewer" className="font-medium cursor-pointer">
                Viewer
              </label>
              <span className="text-sm text-gray-500">Can only view projects</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end pt-4">
        <Button 
          type="submit" 
          disabled={isLoading}
        >
          {isLoading ? 'Adding User...' : 'Add to Company'}
        </Button>
      </div>
    </form>
  );
} 