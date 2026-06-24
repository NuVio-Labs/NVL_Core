import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type CompanyRole = 'admin' | 'editor' | 'user'

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } })

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!

    const { email, company_id, role, redirect_to } = await req.json() as {
      email: string
      company_id: string
      role: CompanyRole
      redirect_to: string
    }

    if (!email || !company_id || !role) return json({ error: 'email, company_id, role required' }, 400)
    if (!['admin', 'editor', 'user'].includes(role)) return json({ error: 'invalid role' }, 400)

    // 1) Aufrufer identifizieren (anon-Client mit dem mitgesendeten JWT)
    const authHeader = req.headers.get('Authorization') ?? ''
    const caller = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: userData, error: userErr } = await caller.auth.getUser()
    if (userErr || !userData.user) return json({ error: 'not authenticated' }, 401)

    // 2) Admin-Client (service_role) — umgeht RLS, nur serverseitig
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE)

    // 3) Autorisierung: Aufrufer muss admin (oder platform owner) in DIESER Company sein
    const { data: callerMembership } = await admin
      .from('memberships')
      .select('role')
      .eq('company_id', company_id)
      .eq('profile_id', userData.user.id)
      .eq('status', 'active')
      .maybeSingle()

    const { data: callerProfile } = await admin
      .from('profiles')
      .select('platform_role')
      .eq('id', userData.user.id)
      .maybeSingle()

    const isOwner = callerProfile?.platform_role === 'owner'
    const isAdmin = callerMembership?.role === 'admin'
    if (!isOwner && !isAdmin) return json({ error: 'forbidden: nur Admins dürfen einladen' }, 403)

    // 4) Existiert der Nutzer schon? (per E-Mail)
    const { data: existing } = await admin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    let profileId = existing?.id ?? null

    if (!profileId) {
      // Echte Invite-Mail mit korrektem Redirect
      const { data: invited, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(email, {
        redirectTo: redirect_to,
      })
      if (inviteErr) return json({ error: inviteErr.message }, 400)
      profileId = invited.user.id
    }

    // 5) Membership anlegen (oder vorhandene respektieren)
    const { data: existingMembership } = await admin
      .from('memberships')
      .select('id')
      .eq('company_id', company_id)
      .eq('profile_id', profileId)
      .maybeSingle()

    if (existingMembership) {
      return json({ ok: true, already_member: true })
    }

    const { error: memErr } = await admin.from('memberships').insert({
      company_id,
      profile_id: profileId,
      role,
      status: 'invited',
    })
    if (memErr) return json({ error: memErr.message }, 400)

    return json({ ok: true })
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'unknown error' }, 500)
  }
})
