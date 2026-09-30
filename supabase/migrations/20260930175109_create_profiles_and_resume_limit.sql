-- Per-user limits. A row is created on sign-up and I adjust limits from the dashboard.
-- Users can read their own row but never change it.
create table public.profiles (
  user_id     uuid        primary key
                          references auth.users (id) on delete cascade,
  max_resumes integer     default 2
                          check (max_resumes >= 0),  -- null means unlimited
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

grant select
  on public.profiles
  to authenticated;

create policy "Users can read their own profile"
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute procedure extensions.moddatetime(updated_at);

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Backfill users created before this migration.
insert into public.profiles (user_id)
select id from auth.users
on conflict (user_id) do nothing;

create function public.enforce_resume_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  resume_limit integer;
  resume_count integer;
begin
  -- Lock the profile row so concurrent inserts for one user can't both pass the count check.
  select max_resumes into resume_limit
  from public.profiles
  where user_id = new.user_id
  for update;

  if not found then
    raise exception 'No profile for user %', new.user_id;
  end if;

  if resume_limit is null then
    return new;
  end if;

  select count(*) into resume_count
  from public.resumes
  where user_id = new.user_id;

  if resume_count >= resume_limit then
    raise exception 'Resume limit of % reached', resume_limit
      using hint = 'Delete a resume or ask for a higher limit.';
  end if;

  return new;
end;
$$;

create trigger resumes_enforce_limit
  before insert on public.resumes
  for each row
  execute function public.enforce_resume_limit();

-- Trigger-only functions; not callable through the API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.enforce_resume_limit() from public, anon, authenticated;
