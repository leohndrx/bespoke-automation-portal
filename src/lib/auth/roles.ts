import { createClient } from '@/lib/supabase/server';
import { cache } from 'react';

export type UserRoleType = 'admin' | 'user' | null;

export const getUserRole = cache(async (): Promise<UserRoleType> => {
  const supabase = await createClient();
  
  // Use getUser instead of getSession for better security
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return null;
  }
  
  // Get the user's role from the user_roles table
  const { data: userRole, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();
  
  if (error) {
    console.error('Error fetching user role:', error);
    return 'user'; // Default to 'user' on error
  }
  
  return userRole?.role as UserRoleType || 'user'; // Default to 'user' if no role is found
});

export const isAdmin = cache(async (): Promise<boolean> => {
  const role = await getUserRole();
  return role === 'admin';
});

// Server action to set a new user's role
export async function setUserRole(userId: string, role: 'admin' | 'user') {
  const supabase = await createClient();
  
  // Check if the user already has a role
  const { data: existingRole, error: checkError } = await supabase
    .from('user_roles')
    .select('id')
    .eq('user_id', userId)
    .single();
  
  if (checkError && checkError.code !== 'PGRST116') {
    console.error('Error checking user role:', checkError);
    throw new Error('Failed to check existing role');
  }
  
  if (existingRole) {
    // Update existing role
    const { error: updateError } = await supabase
      .from('user_roles')
      .update({ role })
      .eq('user_id', userId);
      
    if (updateError) {
      console.error('Error updating role:', updateError);
      throw new Error('Failed to update role');
    }
    
    return { success: true };
  } else {
    // Insert new role
    const { error: insertError } = await supabase
      .from('user_roles')
      .insert({ user_id: userId, role });
      
    if (insertError) {
      console.error('Error inserting role:', insertError);
      throw new Error('Failed to insert role');
    }
    
    return { success: true };
  }
} 