DROP POLICY IF EXISTS "Public Read Softwares" ON storage.objects;
DROP POLICY IF EXISTS "Public Read Softwares Anon" ON storage.objects;

CREATE POLICY "Admins can read software and course files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = ANY (ARRAY['softwares','courses']) AND private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update download history"
ON public.download_history FOR UPDATE TO authenticated
USING (private.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete download history"
ON public.download_history FOR DELETE TO authenticated
USING (private.has_role(auth.uid(), 'admin'::app_role));

GRANT UPDATE, DELETE ON public.download_history TO authenticated;