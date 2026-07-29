-- Create admins table
create table if not exists public.admins (
  id uuid default gen_random_uuid() primary key,
  email text unique not null,
  password_hash text not null,
  is_temp_password boolean default true not null,
  is_super_admin boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Copy existing admin from admin_config to admins table (set as super admin)
do $$
begin
  if exists (select 1 from pg_tables where tablename = 'admin_config') then
    insert into public.admins (email, password_hash, is_temp_password, is_super_admin)
    select email, password_hash, is_temp_password, true
    from public.admin_config
    on conflict (email) do nothing;
  end if;
end $$;

-- If no admins exist, insert the initial default super admin
insert into public.admins (email, password_hash, is_temp_password, is_super_admin)
values ('luizrogeriopx@gmail.com', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', true, true)
on conflict (email) do nothing;

-- Enable RLS and grant permissions
alter table public.admins enable row level security;
grant all on public.admins to service_role;

-- Safely drop old admin_config table
drop table if exists public.admin_config;
