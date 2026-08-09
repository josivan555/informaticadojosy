-- Correcting has_role function and user_roles policies to prevent permission denied errors

-- 1. Ensure the has_role function exists and is correctly defined as SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

-- 2. Ensure proper GRANTs on user_roles (Supabase requires this for the function to work via API)
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

-- 3. Update user_roles table policies
DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
    DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
END $$;

-- Allow users to see their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow admins to see all roles (uses the security definer function)
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 4. Fix softwares and courses policies to ensure admins have full access
DO $$
BEGIN
    -- Softwares
    DROP POLICY IF EXISTS "Admins can manage softwares" ON public.softwares;
    CREATE POLICY "Admins can manage softwares"
    ON public.softwares
    FOR ALL
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

    -- Courses
    DROP POLICY IF EXISTS "Admins can manage courses" ON public.courses;
    CREATE POLICY "Admins can manage courses"
    ON public.courses
    FOR ALL
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));
END $$;
