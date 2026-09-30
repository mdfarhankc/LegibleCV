-- Resumes owned by authenticated users. `data` holds the Resume contract JSON
-- (render_service/app/schemas/resume.py), validated by the render service on every render.
create table public.resumes (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null default auth.uid()
                         references auth.users (id) on delete cascade,
  title      text        not null default 'Untitled resume'
                         check (char_length(title) between 1 and 120),
  data       jsonb       not null
                         check (jsonb_typeof(data) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS filters every query by user_id; the dashboard lists resumes by most recently edited.
create index resumes_user_id_updated_at_idx
  on public.resumes (user_id, updated_at desc);

alter table public.resumes enable row level security;

-- New tables are not exposed to the Data API automatically; grant only what the client needs.
grant select, insert, update, delete
  on public.resumes
  to authenticated;

create policy "Users can read their own resumes"
  on public.resumes
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their own resumes"
  on public.resumes
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own resumes"
  on public.resumes
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own resumes"
  on public.resumes
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create extension if not exists moddatetime schema extensions;

create trigger resumes_set_updated_at
  before update on public.resumes
  for each row
  execute procedure extensions.moddatetime(updated_at);
