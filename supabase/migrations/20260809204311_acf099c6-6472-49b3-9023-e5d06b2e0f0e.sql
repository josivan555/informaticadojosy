-- Explicitly grant SELECT to authenticated users on core tables to resolve 403 errors
GRANT SELECT ON public.softwares TO authenticated;
GRANT SELECT ON public.courses TO authenticated;
GRANT SELECT ON public.software_categories TO authenticated;
GRANT SELECT ON public.user_roles TO authenticated;

-- Ensure RLS policies don't block authenticated users who are admins
-- Re-applying admin policies with SECURITY DEFINER checks
DO $$
BEGIN
    -- Softwares
    DROP POLICY IF EXISTS "Admins can manage softwares" ON public.softwares;
    CREATE POLICY "Admins can manage softwares"
    ON public.softwares FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

    -- Courses
    DROP POLICY IF EXISTS "Admins can manage courses" ON public.courses;
    CREATE POLICY "Admins can manage courses"
    ON public.courses FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

    -- Categories
    DROP POLICY IF EXISTS "Admin full access software_categories" ON public.software_categories;
    CREATE POLICY "Admin full access software_categories"
    ON public.software_categories FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));
END $$;
