/**
 * NuVio Core — Permission Map
 *
 * Rollenmodell zweistufig:
 *   platform_role: 'owner'         — SaaS-Betreiber, plattformweit
 *   company_role:  'admin' | 'editor' | 'user'  — innerhalb einer Company
 *
 * Alle Guards hängen an activeCompanyId + activeRole (+ optional platform_role).
 * Owner-Zugriff wird immer zusätzlich geprüft, niemals als Company-Rolle behandelt.
 *
 * ─── Permission Overrides ────────────────────────────────────────────────────
 * Admin kann in den Company-Einstellungen die globale Matrix überschreiben:
 *   - subject_type 'role'       → ganze Rolle bekommt ein Extra-Recht oder verliert eines
 *   - subject_type 'membership' → einzelner User bekommt individuelle Rechte (Phase 2)
 *
 * Auflösungsreihenfolge:
 *   1. isPlatformOwner() → sofort true
 *   2. membership-spezifischer Override (engster Scope gewinnt) — Phase 2
 *   3. rollen-spezifischer Override
 *   4. globale Matrix (diese Datei)
 *
 * Einstiegspunkt: canWithOverrides(role, membershipId, module, action, overrides)
 */

export type PlatformRole = 'owner'
export type CompanyRole = 'admin' | 'editor' | 'user'
export type AnyRole = PlatformRole | CompanyRole

// ─── Module ──────────────────────────────────────────────────────────────────

export type Module =
  | 'platform.tenants'
  | 'workspace'
  | 'users'
  | 'customers'
  | 'resources.data'
  | 'resources.status'
  | 'bookings'
  | 'pricing'
  | 'locations'
  | 'contracts'
  | 'damages'
  | 'uploads'
  | 'ocr'
  | 'company.settings'
  | 'audit'
  | 'billing'

// ─── Actions per Module ───────────────────────────────────────────────────────

export type Action =
  // generic CRUD
  | 'read'
  | 'create'
  | 'update'
  | 'delete'
  | 'archive'
  // role / membership management
  | 'invite'
  | 'manage_roles'
  // booking lifecycle
  | 'cancel'
  | 'override_price'
  // resource status transitions
  | 'status.report'        // available/in_use → maintenance | defect
  | 'status.restore'       // maintenance | defect → available  (editor+ only)
  // contracts
  | 'finalize'
  // damages
  | 'close'
  // audit / billing
  | 'export'

// ─── Permission Map ───────────────────────────────────────────────────────────
//
// Structure: permissions[module][action] = roles that are allowed
// 'owner' has blanket access to everything — checked separately via isPlatformOwner().
// Only company roles (admin | editor | user) are listed per entry.

export const permissions: Record<Module, Partial<Record<Action, CompanyRole[]>>> = {

  'platform.tenants': {
    // owner-only; no company role has access
  },

  'workspace': {
    read:   ['admin', 'editor', 'user'],
    update: ['admin'],
  },

  'users': {
    read:         ['admin', 'editor'],
    invite:       ['admin'],
    manage_roles: ['admin'],
    update:       ['admin'],
    delete:       ['admin'],
  },

  'customers': {
    read:    ['admin', 'editor', 'user'],
    create:  ['admin', 'editor', 'user'],
    update:  ['admin', 'editor', 'user'],
    archive: ['admin'],
    delete:  ['admin'],
  },

  'resources.data': {
    read:    ['admin', 'editor', 'user'],
    create:  ['admin', 'editor'],
    update:  ['admin', 'editor'],
    archive: ['admin'],
    delete:  ['admin'],
  },

  'resources.status': {
    read:           ['admin', 'editor', 'user'],
    'status.report':   ['admin', 'editor', 'user'],  // → maintenance | defect
    'status.restore':  ['admin', 'editor'],            // → available (freigeben)
  },

  'bookings': {
    read:           ['admin', 'editor', 'user'],
    create:         ['admin', 'editor', 'user'],
    update:         ['admin', 'editor', 'user'],
    cancel:         ['admin', 'editor', 'user'],
    delete:         ['admin'],
    archive:        ['admin'],
    override_price: ['admin'],
  },

  'pricing': {
    read:   ['admin', 'editor', 'user'],
    create: ['admin'],
    update: ['admin'],
    delete: ['admin'],
    archive:['admin'],
  },

  'locations': {
    read:    ['admin', 'editor', 'user'],
    create:  ['admin', 'editor'],
    update:  ['admin', 'editor'],
    archive: ['admin'],
    delete:  ['admin'],
  },

  'contracts': {
    read:     ['admin', 'editor', 'user'],
    create:   ['admin', 'editor', 'user'],
    update:   ['admin', 'editor'],
    finalize: ['admin', 'editor'],
    delete:   ['admin'],
    archive:  ['admin'],
  },

  'damages': {
    read:   ['admin', 'editor', 'user'],
    create: ['admin', 'editor', 'user'],  // melden + Bilder hochladen
    update: ['admin', 'editor'],
    close:  ['admin', 'editor'],
    delete: ['admin'],
  },

  'uploads': {
    read:   ['admin', 'editor', 'user'],
    create: ['admin', 'editor', 'user'],  // hochladen im eigenen Vorgang
    delete: ['admin', 'editor'],
  },

  'ocr': {
    read:   ['admin', 'editor', 'user'],
    create: ['admin', 'editor', 'user'],  // Scan auslösen + bestätigen
    update: ['admin', 'editor', 'user'],  // Ergebnis korrigieren
  },

  'company.settings': {
    read:   ['admin', 'editor'],
    update: ['admin'],
    delete: ['admin'],
  },

  'audit': {
    read:   ['admin', 'editor'],
    export: ['admin'],
  },

  'billing': {
    read:   ['admin'],
    update: ['admin'],
  },
}

// ─── Helper functions ─────────────────────────────────────────────────────────

/**
 * Owner has blanket access to all modules and actions across all companies.
 * This must be checked before any company-role guard.
 */
export function isPlatformOwner(platformRole: string | null | undefined): boolean {
  return platformRole === 'owner'
}

/**
 * Check if a company role has permission for a given module + action.
 * Does NOT account for owner — call isPlatformOwner() first.
 */
export function hasPermission(
  role: CompanyRole | null | undefined,
  module: Module,
  action: Action,
): boolean {
  if (!role) return false
  return permissions[module][action]?.includes(role) ?? false
}

/**
 * Convenience: check permission, owner always passes.
 */
export function can(
  role: AnyRole | null | undefined,
  module: Module,
  action: Action,
): boolean {
  if (role === 'owner') return true
  return hasPermission(role as CompanyRole, module, action)
}

// ─── Override type ────────────────────────────────────────────────────────────

export interface PermissionOverride {
  subject_type: 'role' | 'membership'
  subject_id: string
  module: string
  action: string
  granted: boolean
}

/**
 * Check permission with company-level overrides applied.
 * Phase 1: subject_type = 'role' overrides only.
 * Phase 2: subject_type = 'membership' (membershipId required).
 */
export function canWithOverrides(
  role: AnyRole | null | undefined,
  membershipId: string | null | undefined,
  module: Module,
  action: Action,
  overrides: PermissionOverride[],
): boolean {
  if (role === 'owner') return true
  if (!role) return false

  // Phase 2: membership-specific override (engster Scope)
  if (membershipId) {
    const membershipOverride = overrides.find(
      (o) => o.subject_type === 'membership' && o.subject_id === membershipId && o.module === module && o.action === action,
    )
    if (membershipOverride !== undefined) return membershipOverride.granted
  }

  // Phase 1: role-specific override
  const roleOverride = overrides.find(
    (o) => o.subject_type === 'role' && o.subject_id === role && o.module === module && o.action === action,
  )
  if (roleOverride !== undefined) return roleOverride.granted

  // Fallback: global matrix
  return hasPermission(role as CompanyRole, module, action)
}

// ─── Resource status transition rules ────────────────────────────────────────

export type ResourceStatus = 'available' | 'in_use' | 'maintenance' | 'defect' | 'archived'

/**
 * Which status transitions are allowed per role.
 * Returning false blocks the action at service + UI level.
 */
export function canTransitionResourceStatus(
  role: AnyRole | null | undefined,
  from: ResourceStatus,
  to: ResourceStatus,
): boolean {
  if (role === 'owner' || role === 'admin' || role === 'editor') return true

  if (role === 'user') {
    // user may report problems, but cannot restore
    const reportable: ResourceStatus[] = ['maintenance', 'defect']
    const reportableFrom: ResourceStatus[] = ['available', 'in_use']
    return reportableFrom.includes(from) && reportable.includes(to)
  }

  return false
}
