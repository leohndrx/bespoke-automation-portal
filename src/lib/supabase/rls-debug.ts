/**
 * Helper utilities to debug Supabase Row Level Security (RLS) issues
 */

import { createClient } from './server';

/**
 * Check the current RLS policies for a given table
 * @param tableName The name of the table to check
 */
export async function checkRlsPolicies(tableName: string) {
  const supabase = await createClient();
  
  // Get the policies for this table
  const { data, error } = await supabase.rpc('get_policies_for_table', {
    table_name: tableName
  });
  
  if (error) {
    console.error(`Error fetching RLS policies for ${tableName}:`, error);
    return null;
  }
  
  return data;
}

/**
 * Helper function to test a specific RLS policy that might cause infinite recursion
 * This helps identify infinite recursion issues in RLS policies
 * @param tableName The table to test
 * @param userId The user ID to test with
 */
export async function testRlsAccess(tableName: string, userId: string) {
  try {
    const supabase = await createClient();
    
    console.log(`Testing RLS access for table ${tableName} with user ${userId}`);
    
    // First, check what policies exist
    const policies = await checkRlsPolicies(tableName);
    console.log('Policies:', policies);
    
    // Then, try a simple query with tracing
    console.time(`RLS query on ${tableName}`);
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    console.timeEnd(`RLS query on ${tableName}`);
    
    if (error) {
      console.error(`RLS access error for ${tableName}:`, error);
      return { success: false, error };
    }
    
    return { success: true, data };
  } catch (error) {
    console.error('RLS test failed with exception:', error);
    return { success: false, error };
  }
} 