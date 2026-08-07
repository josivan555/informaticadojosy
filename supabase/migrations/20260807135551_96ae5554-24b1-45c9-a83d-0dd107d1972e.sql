-- Fix for user_roles: ensure policies exist for all actions
create policy "Authenticated users can read roles"
on public.user_roles
for select
to authenticated
using (true);

-- Fix for security definer function: revoke public and authenticated execute
revoke execute on function public.has_role(uuid, app_role) from public;
revoke execute on function public.has_role(uuid, app_role) from authenticated;

-- Only service_role and internal system should execute it by default 
-- (but it's stable security definer so it will work in RLS)
grant execute on function public.has_role(uuid, app_role) to service_role;
