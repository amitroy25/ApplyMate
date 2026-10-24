create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  email text not null default '',
  phone text not null default '',
  current_position text not null default '',
  skills jsonb not null default '[]'::jsonb,
  resume_file_name text not null default '',
  resume_file_size text not null default '',
  resume_last_updated text not null default '',
  resume_storage_path text,
  updated_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists current_position text not null default '';

create table if not exists public.app_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email_signature text not null default '',
  email_template text not null default '',
  daily_application_target integer not null default 20 check (daily_application_target between 1 and 100),
  theme text not null default 'light' check (theme in ('light', 'dark', 'system')),
  notifications_enabled boolean not null default true,
  auto_extract_on_upload boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.applications (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  company_name text not null,
  job_title text not null,
  recruiter_email text not null,
  location text not null default '',
  experience text not null default '',
  skills jsonb not null default '[]'::jsonb,
  job_description text not null default '',
  application_instructions text,
  email_subject text not null,
  email_body text not null,
  resume_file_name text not null,
  resume_file_size text not null,
  status text not null check (status in ('Draft', 'Ready', 'Sending', 'Sent', 'Failed', 'Unknown', 'Pending', 'Interview', 'Rejected', 'No Reply')),
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  gmail_message_id text,
  send_error text
);

create index if not exists applications_user_created_at_idx
  on public.applications (user_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.app_settings enable row level security;
alter table public.applications enable row level security;

create policy "Users can manage their own profile"
  on public.profiles for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can manage their own settings"
  on public.app_settings for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can manage their own applications"
  on public.applications for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('resumes', 'resumes', false, 10485760, array['application/pdf'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Users can access their own resume files"
  on storage.objects for all
  using (
    bucket_id = 'resumes'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'resumes'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
