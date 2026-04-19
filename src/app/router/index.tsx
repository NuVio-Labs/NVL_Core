import { createBrowserRouter, RouterProvider } from 'react-router'
import { RootLayout } from '@/app/router/RootLayout'
import { ProtectedRoute } from '@/app/router/ProtectedRoute'
import { OnboardingGuard } from '@/app/router/OnboardingGuard'
import { AppShell } from '@/app/shell/AppShell'

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        path: 'login',
        lazy: () => import('@/pages/LoginPage').then((m) => ({ Component: m.LoginPage })),
      },
      {
        path: 'signup',
        lazy: () => import('@/pages/SignupPage').then((m) => ({ Component: m.SignupPage })),
      },
      // Onboarding is outside ProtectedRoute so the Supabase invite token can be
      // processed by onAuthStateChange before the session guard runs.
      {
        path: 'onboarding',
        lazy: () => import('@/pages/OnboardingPage').then((m) => ({ Component: m.OnboardingPage })),
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            element: <OnboardingGuard />,
            children: [
              {
                element: <AppShell />,
                children: [
                  {
                    index: true,
                    lazy: () => import('@/pages/DashboardPage').then((m) => ({ Component: m.DashboardPage })),
                  },
                  {
                    path: 'bookings',
                    lazy: () => import('@/pages/BookingsPage').then((m) => ({ Component: m.BookingsPage })),
                  },
                  {
                    path: 'resources',
                    lazy: () => import('@/pages/ResourcesPage').then((m) => ({ Component: m.ResourcesPage })),
                  },
                  {
                    path: 'pricing',
                    lazy: () => import('@/pages/PricingPage').then((m) => ({ Component: m.PricingPage })),
                  },
                  {
                    path: 'customers',
                    lazy: () => import('@/pages/CustomersPage').then((m) => ({ Component: m.CustomersPage })),
                  },
                  {
                    path: 'staff',
                    lazy: () => import('@/pages/StaffPage').then((m) => ({ Component: m.StaffPage })),
                  },
                  {
                    path: 'settings',
                    lazy: () => import('@/pages/SettingsPage').then((m) => ({ Component: m.SettingsPage })),
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
