import { createBrowserRouter, RouterProvider } from 'react-router'
import { RootLayout } from '@/app/router/RootLayout'
import { ProtectedRoute } from '@/app/router/ProtectedRoute'
import { OnboardingGuard } from '@/app/router/OnboardingGuard'
import { RouteErrorBoundary } from '@/app/router/RouteErrorBoundary'
import { lazyWithReload } from '@/app/router/lazyWithReload'
import { AppShell } from '@/app/shell/AppShell'

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        path: 'login',
        lazy: lazyWithReload(() => import('@/pages/LoginPage'), (m) => m.LoginPage),
      },
      {
        path: 'signup',
        lazy: lazyWithReload(() => import('@/pages/SignupPage'), (m) => m.SignupPage),
      },
      // Onboarding is outside ProtectedRoute so the Supabase invite token can be
      // processed by onAuthStateChange before the session guard runs.
      {
        path: 'onboarding',
        lazy: lazyWithReload(() => import('@/pages/OnboardingPage'), (m) => m.OnboardingPage),
      },
      {
        path: 'forgot-password',
        lazy: lazyWithReload(() => import('@/pages/ForgotPasswordPage'), (m) => m.ForgotPasswordPage),
      },
      {
        path: 'reset-password',
        lazy: lazyWithReload(() => import('@/pages/ResetPasswordPage'), (m) => m.ResetPasswordPage),
      },
      {
        path: 'datenschutz',
        lazy: lazyWithReload(() => import('@/pages/DatenschutzPage'), (m) => m.DatenschutzPage),
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
                    lazy: lazyWithReload(() => import('@/pages/DashboardPage'), (m) => m.DashboardPage),
                  },
                  {
                    path: 'bookings',
                    lazy: lazyWithReload(() => import('@/pages/BookingsPage'), (m) => m.BookingsPage),
                  },
                  {
                    path: 'resources',
                    lazy: lazyWithReload(() => import('@/pages/ResourcesPage'), (m) => m.ResourcesPage),
                  },
                  {
                    path: 'pricing',
                    lazy: lazyWithReload(() => import('@/pages/PricingPage'), (m) => m.PricingPage),
                  },
                  {
                    path: 'customers',
                    lazy: lazyWithReload(() => import('@/pages/CustomersPage'), (m) => m.CustomersPage),
                  },
                  {
                    path: 'staff',
                    lazy: lazyWithReload(() => import('@/pages/StaffPage'), (m) => m.StaffPage),
                  },
                  {
                    path: 'settings',
                    lazy: lazyWithReload(() => import('@/pages/SettingsPage'), (m) => m.SettingsPage),
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
