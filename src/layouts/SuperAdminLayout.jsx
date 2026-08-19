import { useEffect, useState } from 'react'
import { ChevronDownIcon } from 'lucide-react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'

import LogoutButton from '@/components/common/LogoutButton'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { useAuth } from '@/hooks/useAuth'

const navigation = [
  { label: 'Overview', to: '/admin', end: true },
  { label: 'Reports', to: '/admin/reports' },
]

function SuperAdminLayout() {
  const { user } = useAuth()
  const location = useLocation()
  const isOrganizationsSectionActive =
    location.pathname.startsWith('/admin/organisations') ||
    location.pathname.startsWith('/admin/organisation-admins')
  const isSubscriptionsSectionActive = location.pathname.startsWith(
    '/admin/subscriptions',
  )
  const [organizationsOpen, setOrganizationsOpen] = useState(
    isOrganizationsSectionActive,
  )
  const [subscriptionsOpen, setSubscriptionsOpen] = useState(
    isSubscriptionsSectionActive,
  )

  useEffect(() => {
    if (isOrganizationsSectionActive) setOrganizationsOpen(true)
  }, [isOrganizationsSectionActive])

  useEffect(() => {
    if (isSubscriptionsSectionActive) setSubscriptionsOpen(true)
  }, [isSubscriptionsSectionActive])

  return (
    <div className="min-h-screen bg-background md:grid md:grid-cols-[16rem_1fr]">
      <aside className="border-b bg-muted/30 p-4 md:border-r md:border-b-0">
        <div className="mb-6">
          <p className="font-semibold">Ophile</p>
          <p className="text-sm text-muted-foreground">Admin Portal</p>
        </div>

        <nav className="space-y-1" aria-label="Super Admin navigation">
          {navigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                [
                  'block rounded-lg px-3 py-2 text-sm font-medium',
                  isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                ].join(' ')
              }
            >
              {item.label}
            </NavLink>
          ))}

          <Collapsible
            open={organizationsOpen}
            onOpenChange={setOrganizationsOpen}
          >
            <CollapsibleTrigger
              className={[
                'flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium',
                isOrganizationsSectionActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              ].join(' ')}
            >
              Companies
              <ChevronDownIcon className="size-4" />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-1 space-y-1 pl-3">
              <NavLink
                to="/admin/organisations"
                className={({ isActive }) =>
                  [
                    'block rounded-lg px-3 py-2 text-sm',
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  ].join(' ')
                }
              >
                Company Profiles
              </NavLink>
              <NavLink
                to="/admin/organisation-admins"
                className={({ isActive }) =>
                  [
                    'block rounded-lg px-3 py-2 text-sm',
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  ].join(' ')
                }
              >
                Company Admin Management
              </NavLink>
            </CollapsibleContent>
          </Collapsible>

          <Collapsible
            open={subscriptionsOpen}
            onOpenChange={setSubscriptionsOpen}
          >
            <CollapsibleTrigger
              className={[
                'flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium',
                isSubscriptionsSectionActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              ].join(' ')}
            >
              Subscription Management
              <ChevronDownIcon className="size-4" />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-1 space-y-1 pl-3">
              <NavLink
                to="/admin/subscriptions/companies"
                className={({ isActive }) =>
                  [
                    'block rounded-lg px-3 py-2 text-sm',
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  ].join(' ')
                }
              >
                Company Subscription
              </NavLink>
              <NavLink
                to="/admin/subscriptions/payments"
                className={({ isActive }) =>
                  [
                    'block rounded-lg px-3 py-2 text-sm',
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  ].join(' ')
                }
              >
                Subscription Payment
              </NavLink>
              <NavLink
                to="/admin/subscriptions/negotiations"
                className={({ isActive }) =>
                  [
                    'block rounded-lg px-3 py-2 text-sm',
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  ].join(' ')
                }
              >
                Negotiations &amp; Contracts
              </NavLink>
            </CollapsibleContent>
          </Collapsible>
        </nav>
      </aside>

      <div className="min-w-0">
        <header className="flex min-h-16 items-center justify-between gap-4 border-b px-6 py-3">
          <p className="font-medium">Admin Portal</p>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-muted-foreground">Super Admin</p>
            </div>
            <LogoutButton />
          </div>
        </header>

        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default SuperAdminLayout
