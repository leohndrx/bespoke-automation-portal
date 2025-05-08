-- Drop any existing policies on user_roles to start clean
DROP POLICY IF EXISTS "Users can read their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can read all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can update their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;

-- Now create fixed policies that avoid recursion

-- Policy for users to read their own role without checking user_roles table recursively
CREATE POLICY "Users can read their own roles" 
ON public.user_roles 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- Policy for admin-only operations - using a direct check against email domain or other criteria
-- This avoids the recursion by not querying the user_roles table within its own policy
CREATE POLICY "Admins can read all roles" 
ON public.user_roles 
FOR SELECT 
TO authenticated 
USING (
  -- This is a simplified admin check that doesn't cause recursion
  -- You can replace this with your own admin criteria without querying user_roles
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid() 
    AND auth.users.email ILIKE '%@bespoke-automation.com' -- Replace with your admin domain
  )
);

-- Policy for admins to update roles
CREATE POLICY "Admins can update all roles" 
ON public.user_roles 
FOR UPDATE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid() 
    AND auth.users.email ILIKE '%@bespoke-automation.com' -- Replace with your admin domain
  )
);

-- Policy for admins to insert roles
CREATE POLICY "Admins can insert roles" 
ON public.user_roles 
FOR INSERT 
TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid() 
    AND auth.users.email ILIKE '%@bespoke-automation.com' -- Replace with your admin domain
  )
);

-- Policy for admins to delete roles
CREATE POLICY "Admins can delete roles" 
ON public.user_roles 
FOR DELETE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid() 
    AND auth.users.email ILIKE '%@bespoke-automation.com' -- Replace with your admin domain
  )
);

-- Verify RLS is enabled on the table
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY; 