-- Revoke execute from anon specifically to satisfy linter
revoke execute on function public.has_role(uuid, app_role) from anon;

-- Storage policies for the 'files' bucket
-- Allow public select (read) of files in the bucket
create policy "Anyone can view files"
on storage.objects for select
using ( bucket_id = 'files' );

-- Allow authenticated admins to upload/manage files
create policy "Admins can manage files"
on storage.objects for all
to authenticated
using ( 
  bucket_id = 'files' 
  and public.has_role(auth.uid(), 'admin')
)
with check ( 
  bucket_id = 'files' 
  and public.has_role(auth.uid(), 'admin')
);
