import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

// Force dynamic to avoid caching issues
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const supabase = await createClient();
  
  // Using getUser instead of getSession for better security
  const { data: { user } } = await supabase.auth.getUser();
  
  if (user) {
    redirect('/dashboard');
  } else {
    redirect('/login');
  }
  
  // This will never be reached, but is needed for TypeScript
  return null;
}
