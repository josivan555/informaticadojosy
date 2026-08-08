-- Grant access to the storage.objects table so the client can check for existing files
GRANT SELECT ON storage.objects TO authenticated;

-- Ensure policies exist for authenticated users to manage files in their buckets
-- These policies are standard for allowing the admin to manage assets

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated uploads to softwares'
    ) THEN
        CREATE POLICY "Allow authenticated uploads to softwares"
        ON storage.objects FOR INSERT TO authenticated
        WITH CHECK (bucket_id = 'softwares');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated updates to softwares'
    ) THEN
        CREATE POLICY "Allow authenticated updates to softwares"
        ON storage.objects FOR UPDATE TO authenticated
        USING (bucket_id = 'softwares');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated uploads to courses'
    ) THEN
        CREATE POLICY "Allow authenticated uploads to courses"
        ON storage.objects FOR INSERT TO authenticated
        WITH CHECK (bucket_id = 'courses');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated updates to courses'
    ) THEN
        CREATE POLICY "Allow authenticated updates to courses"
        ON storage.objects FOR UPDATE TO authenticated
        USING (bucket_id = 'courses');
    END IF;
END $$;
