-- ============================================================
-- NuVio Core — Role Model v2 Migration
-- Zweistufiges Rollenmodell:
--   platform_role: 'owner'              (profiles-Spalte)
--   company_role:  'admin' | 'editor' | 'user'  (membership_role enum)
--
-- Ablösung alter Rollen: owner → admin (als Company-Rolle entfällt owner),
--   member → user, viewer → user
-- ============================================================

-- ─── Schritt 1: Neuen Enum-Wert hinzufügen ───────────────────────────────────
-- WICHTIG: Diesen Block ZUERST separat ausführen, dann committen,
-- danach den Rest (Schritt 2–7) in einer zweiten Ausführung laufen lassen.
-- Grund: PostgreSQL erlaubt keine Nutzung eines neu angelegten Enum-Werts
-- innerhalb derselben Transaktion (Error 55P04).

ALTER TYPE membership_role ADD VALUE IF NOT EXISTS 'user';
-- 'admin' und 'editor' existieren bereits

-- ══════════════════════════════════════════════════════════════
-- STOP: Oben bis hier ausführen. Dann neu verbinden / neue Query.
-- Danach den Block ab Schritt 2 ausführen.
-- ══════════════════════════════════════════════════════════════

-- ─── Schritt 2: platform_role Spalte auf profiles ────────────────────────────

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS platform_role text
  CHECK (platform_role IS NULL OR platform_role = 'owner');

COMMENT ON COLUMN profiles.platform_role IS
  'Plattformrolle: nur "owner" möglich. NULL = normaler Benutzer ohne Plattformrechte.';

-- ─── Schritt 3: Bestehende Rollen auf neues Modell mappen ────────────────────

-- 'owner' in memberships war bisher die höchste Company-Rolle → wird admin
UPDATE memberships SET role = 'admin'  WHERE role = 'owner';

-- 'member' → user
UPDATE memberships SET role = 'user'   WHERE role = 'member';

-- 'viewer' → user (Leserechte werden nun über Prozessrechte der user-Rolle abgedeckt)
UPDATE memberships SET role = 'user'   WHERE role = 'viewer';

-- ─── Schritt 4: get_my_role Funktion aktualisieren ───────────────────────────
-- Gibt die Company-Rolle zurück (kein platform_role-Lookup hier)

CREATE OR REPLACE FUNCTION get_my_role(p_company_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role::text
  FROM memberships
  WHERE profile_id = auth.uid()
    AND company_id = p_company_id
    AND status = 'active'
  LIMIT 1;
$$;

-- ─── Schritt 5: platform_role Hilfsfunktion ──────────────────────────────────

CREATE OR REPLACE FUNCTION is_platform_owner()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT platform_role = 'owner' FROM profiles WHERE id = auth.uid()),
    false
  );
$$;

-- ─── Schritt 6: RLS-Policies auf memberships schärfen ────────────────────────
-- Owner darf alles; Admin darf innerhalb seiner Company verwalten.

-- Bestehende Policy entfernen falls vorhanden (Namen ggf. anpassen)
DROP POLICY IF EXISTS "memberships: own read" ON memberships;
DROP POLICY IF EXISTS "admins can insert memberships" ON memberships;
DROP POLICY IF EXISTS "admins can update memberships" ON memberships;
DROP POLICY IF EXISTS "admins can delete memberships" ON memberships;
DROP POLICY IF EXISTS "members can update own membership on onboarding" ON memberships;

-- SELECT: eigene Memberships + alle derselben Company (für Admin-Sicht)
CREATE POLICY "memberships_select" ON memberships
  FOR SELECT USING (
    is_platform_owner()
    OR profile_id = auth.uid()
    OR company_id IN (
      SELECT company_id FROM memberships
      WHERE profile_id = auth.uid() AND status = 'active'
    )
  );

-- INSERT: Owner immer; Admin darf neue Mitglieder einladen; eigene Membership anlegen (Onboarding)
CREATE POLICY "memberships_insert" ON memberships
  FOR INSERT WITH CHECK (
    is_platform_owner()
    OR get_my_role(company_id) = 'admin'
    OR profile_id = auth.uid()  -- eigene Membership beim Onboarding
  );

-- UPDATE: Owner immer; Admin darf Rollen innerhalb eigener Company ändern
CREATE POLICY "memberships_update" ON memberships
  FOR UPDATE USING (
    is_platform_owner()
    OR get_my_role(company_id) = 'admin'
  );

-- DELETE: Owner immer; Admin darf Mitglieder aus eigener Company entfernen
CREATE POLICY "memberships_delete" ON memberships
  FOR DELETE USING (
    is_platform_owner()
    OR get_my_role(company_id) = 'admin'
  );

-- ─── Schritt 7: RLS auf profiles — platform_role nur durch Owner änderbar ─────

DROP POLICY IF EXISTS "profiles_update" ON profiles;

CREATE POLICY "profiles_update" ON profiles
  FOR UPDATE USING (
    id = auth.uid()          -- eigenes Profil
    OR is_platform_owner()   -- Owner darf platform_role setzen
  )
  WITH CHECK (
    -- Nur Owner darf platform_role auf 'owner' setzen
    (platform_role IS NULL OR is_platform_owner())
  );

-- ─── Hinweis: ALTER TYPE (Entfernen alter Werte) ─────────────────────────────
-- PostgreSQL 15+ erlaubt das Entfernen von Enum-Werten NICHT direkt.
-- 'member', 'viewer' und 'owner' (als Company-Rolle) bleiben im Enum vorhanden,
-- werden aber im Code nicht mehr vergeben. Ein vollständiger Enum-Tausch
-- (CREATE TYPE + ALTER TABLE) ist möglich, aber risikoreich bei Live-Daten.
-- Empfehlung: Enum-Werte nach erfolgreichem Rollout in einem separaten
-- Wartungsfenster sauber ersetzen (siehe migrate_roles_v2_cleanup.sql).
