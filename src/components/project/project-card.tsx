import React from 'react';
import Link from 'next/link';
import { Project, Client } from '@/lib/supabase/types';
import { Button } from '@/components/ui/button';
import clsx from 'clsx';

interface ProjectCardProps {
  project: Project;
  client?: Client | null;
  showStatus?: boolean;
  onEdit?: (project: Project) => void;
  onDelete?: (project: Project) => void;
}

export function ProjectCard({ 
  project, 
  client, 
  showStatus = true,
  onEdit, 
  onDelete 
}: ProjectCardProps) {
  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    onEdit?.(project);
  };
  
  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    if (window.confirm('Are you sure you want to delete this project?')) {
      onDelete?.(project);
    }
  };
  
  const formattedDate = new Date(project.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  
  // Status badge style and icon
  const getStatusInfo = () => {
    switch(project.status) {
      case 'pending':
        return {
          class: 'bg-amber-500 bg-opacity-10 text-amber-600',
          icon: (
            <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        };
      case 'approved':
        return {
          class: 'bg-green-500 bg-opacity-10 text-green-600',
          icon: (
            <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        };
      case 'rejected':
        return {
          class: 'bg-red-500 bg-opacity-10 text-red-600',
          icon: (
            <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        };
      case 'completed':
        return {
          class: 'bg-primary bg-opacity-10 text-primary',
          icon: (
            <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )
        };
      default:
        return {
          class: 'bg-muted text-muted-foreground',
          icon: (
            <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        };
    }
  };
  
  const statusInfo = getStatusInfo();
  
  return (
    <Link
      href={`/projects/${project.id}`}
      className={clsx(
        "block rounded-xl border shadow-sm hover:shadow-hover transition-all duration-300 overflow-hidden",
        "transform hover:-translate-y-2 relative group",
        project.is_archived 
          ? "border-border bg-muted bg-opacity-50" 
          : "border-border bg-card"
      )}
    >
      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      {/* Status Indicator Line */}
      {showStatus && project.status && (
        <div className="w-full h-1">
          <div className={`h-full ${
            project.status === 'completed' ? 'bg-gradient-to-r from-green-500 to-green-400' :
            project.status === 'approved' ? 'bg-gradient-to-r from-primary to-primary-light' :
            project.status === 'pending' ? 'bg-gradient-to-r from-amber-500 to-amber-400' :
            project.status === 'rejected' ? 'bg-gradient-to-r from-red-500 to-red-400' : 'bg-muted'
          }`}></div>
        </div>
      )}
      
      <div className="p-6">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-lg font-semibold tracking-tight">{project.name}</h3>
          <div className="flex space-x-2">
            {project.is_archived && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
                Archived
              </span>
            )}
            {showStatus && project.status && (
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusInfo.class}`}>
                {statusInfo.icon}
                {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
              </span>
            )}
          </div>
        </div>
        
        {client && (
          <div className="mb-3">
            <span className="text-sm text-primary flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-primary-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span className="font-medium">{client.name}</span> {client.company && <span className="text-muted-foreground">{`(${client.company})`}</span>}
            </span>
          </div>
        )}
        
        {project.description && (
          <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{project.description}</p>
        )}
        
        {project.total_price !== null && (
          <div className="mb-4 flex items-center">
            <div className="px-3 py-1.5 bg-green-500 bg-opacity-10 text-green-600 rounded-lg text-sm font-medium flex items-center">
              <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              ${project.total_price.toFixed(2)}
            </div>
          </div>
        )}
        
        <div className="flex items-center justify-between pt-4 border-t border-border mt-2">
          <span className="text-xs text-muted-foreground flex items-center">
            <svg className="w-3.5 h-3.5 mr-1 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {formattedDate}
          </span>
          <div className="flex space-x-2">
            {onEdit && (
              <Button variant="outline" size="sm" className="h-8 text-xs group" onClick={handleEdit}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1 group-hover:text-primary transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                Edit
              </Button>
            )}
            {onDelete && (
              <Button variant="danger" size="sm" className="h-8 text-xs group" onClick={handleDelete}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1 group-hover:text-white transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18"></path>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
                  <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
                Delete
              </Button>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
} 