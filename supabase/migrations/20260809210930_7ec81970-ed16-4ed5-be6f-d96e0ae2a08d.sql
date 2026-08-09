-- Permite que usuários anônimos visualizem as capas dos softwares
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'Public Read Softwares Anon'
    ) THEN
        CREATE POLICY "Public Read Softwares Anon" ON storage.objects 
        FOR SELECT TO anon 
        USING (bucket_id IN ('softwares', 'courses'));
    END IF;
END $$;
