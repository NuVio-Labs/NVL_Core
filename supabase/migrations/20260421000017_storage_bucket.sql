-- Create the company-files storage bucket (private)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'company-files',
  'company-files',
  false,
  10485760, -- 10 MB
  array[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do nothing;

-- Storage RLS: authenticated users can upload to their company folder
create policy "storage_upload" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'company-files'
  );

create policy "storage_select" on storage.objects
  for select to authenticated using (
    bucket_id = 'company-files'
  );

create policy "storage_delete" on storage.objects
  for delete to authenticated using (
    bucket_id = 'company-files'
  );
