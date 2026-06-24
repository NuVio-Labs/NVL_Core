-- Fix: Storage RLS policies waren zu weit offen (jeder auth. User = Zugriff auf alle Mandanten-Dateien)
-- Neu: Pfad-Prefix muss zur eigenen company_id passen (Format: {company_id}/{entity_type}/{entity_id}/...)

DROP POLICY IF EXISTS "storage_upload" ON storage.objects;
DROP POLICY IF EXISTS "storage_select" ON storage.objects;
DROP POLICY IF EXISTS "storage_delete" ON storage.objects;

CREATE POLICY "storage_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'company-files'
    AND EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.profile_id = auth.uid()
        AND m.status = 'active'
        AND storage.objects.name LIKE m.company_id::text || '/%'
    )
  );

CREATE POLICY "storage_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'company-files'
    AND EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.profile_id = auth.uid()
        AND m.status IN ('active', 'invited')
        AND storage.objects.name LIKE m.company_id::text || '/%'
    )
  );

CREATE POLICY "storage_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'company-files'
    AND EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.profile_id = auth.uid()
        AND m.status = 'active'
        AND m.role IN ('admin', 'editor')
        AND storage.objects.name LIKE m.company_id::text || '/%'
    )
  );
