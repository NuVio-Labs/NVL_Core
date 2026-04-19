-- Allow invited members to read their company (needed for workspace + onboarding)
drop policy if exists "companies: member read" on public.companies;

create policy "companies: member read"
  on public.companies for select
  using (
    exists (
      select 1 from public.memberships m
      where m.company_id = companies.id
        and m.profile_id = auth.uid()
        and m.status in ('active', 'invited')
    )
  );

-- Allow invited members to update their own membership (for onboarding completion)
create policy "members can update own membership on onboarding"
  on public.memberships for update
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());
