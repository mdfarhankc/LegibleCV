-- The photo printed by the two-column templates. The file is in Storage; this is its path.
-- The check keeps the path inside the owner's folder for this resume.
alter table public.resumes
  add column photo_path text
  check (
    photo_path is null
    or photo_path like user_id::text || '/' || id::text || '/%.jpg'
  );

-- Private bucket. The app resizes photos before upload, so the limits are small.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('resume-photos', 'resume-photos', false, 307200, array['image/jpeg']);

-- Files are stored as <user id>/<resume id>/<file>.jpg, so the first folder is the owner.
create policy "Users can read their own resume photos"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'resume-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Users can add their own resume photos"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'resume-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Users can delete their own resume photos"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'resume-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
