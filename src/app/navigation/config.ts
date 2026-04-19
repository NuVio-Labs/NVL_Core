import {
  LayoutDashboard,
  Users,
  UserCog,
  Package,
  CalendarDays,
  Tag,
  Settings,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { MembershipRole } from '@/features/workspace'

export interface NavItem {
  label: string
  path: string
  icon: LucideIcon
  roles?: MembershipRole[]
}

export interface NavGroup {
  label: string
  items: NavItem[]
}

export const navigation: NavGroup[] = [
  {
    label: 'Übersicht',
    items: [
      { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Betrieb',
    items: [
      { label: 'Buchungen', path: '/bookings', icon: CalendarDays },
      { label: 'Ressourcen', path: '/resources', icon: Package },
      { label: 'Preislisten', path: '/pricing', icon: Tag },
    ],
  },
  {
    label: 'Verwaltung',
    items: [
      { label: 'Kunden', path: '/customers', icon: Users },
      {
        label: 'Mitarbeiter',
        path: '/staff',
        icon: UserCog,
        roles: ['admin'],
      },
      {
        label: 'Einstellungen',
        path: '/settings',
        icon: Settings,
        roles: ['admin'],
      },
    ],
  },
]
