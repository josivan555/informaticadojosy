-- Create app_role enum
create type public.app_role as enum ('admin', 'user');

-- Create user_roles table
create table public.user_roles (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    role app_role not null default 'user',
    unique (user_id, role)
);

-- Grant access
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;

-- Enable RLS
alter table public.user_roles enable row level security;

-- Security definer function for role checking
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

-- Create Softwares table
create table public.softwares (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    description text,
    version text,
    file_url text,
    size text,
    category text,
    downloads integer default 0,
    status text default 'published',
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Create Courses table
create table public.courses (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    description text,
    price numeric(10, 2) not null,
    pages integer,
    level text,
    file_url text,
    status text default 'published',
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Grant access to softwares
grant select on public.softwares to anon;
grant select on public.softwares to authenticated;
grant insert, update, delete on public.softwares to authenticated;
grant all on public.softwares to service_role;

-- Grant access to courses
grant select on public.courses to anon;
grant select on public.courses to authenticated;
grant insert, update, delete on public.courses to authenticated;
grant all on public.courses to service_role;

-- Enable RLS
alter table public.softwares enable row level security;
alter table public.courses enable row level security;

-- Policies for softwares
create policy "Anyone can view published softwares"
    on public.softwares for select
    using (status = 'published');

create policy "Admins can manage softwares"
    on public.softwares
    for all
    to authenticated
    using (public.has_role(auth.uid(), 'admin'));

-- Policies for courses
create policy "Anyone can view published courses"
    on public.courses for select
    using (status = 'published');

create policy "Admins can manage courses"
    on public.courses
    for all
    to authenticated
    using (public.has_role(auth.uid(), 'admin'));
