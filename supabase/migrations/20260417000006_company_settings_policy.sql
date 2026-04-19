create policy "admins can update company settings"
  on public.companies for update
  using (
    exists (
      select 1 from public.memberships m
      where m.company_id = companies.id
        and m.profile_id = auth.uid()
        and m.role in ('owner', 'admin')
        and m.status = 'active'
    )
  )
  with check (
    exists (
      select 1 from public.memberships m
      where m.company_id = companies.id
        and m.profile_id = auth.uid()
        and m.role in ('owner', 'admin')
        and m.status = 'active'
    )
  );
