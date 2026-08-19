import { useEffect, useState } from 'react'
import {
  FileChartColumnIcon,
  HeadsetIcon,
  LayoutDashboardIcon,
  SettingsIcon,
  ShieldCheckIcon,
  TagsIcon,
  UsersIcon,
  UsersRoundIcon,
} from 'lucide-react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'

import {
  getOrganisationAppearance,
  updateOrganisationAppearance,
} from '@/api/organisationApi'
import GlassHeader from '@/components/glass/GlassHeader'
import GlassPanel from '@/components/glass/GlassPanel'
import GlassSidebar from '@/components/glass/GlassSidebar'
import { OrganisationAppearanceContext } from '@/context/organisation-appearance-context'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import {
  defaultOrganisationBackgroundId,
  getOrganisationBackground,
} from '@/lib/organisationBackgrounds'

const navigation = [
  {
    label: 'Overview',
    to: '/admin',
    end: true,
    icon: LayoutDashboardIcon,
  },
  { label: 'Groups', to: '/admin/groups', icon: UsersRoundIcon },
  { label: 'Users', to: '/admin/users', icon: UsersIcon },
  {
    label: 'Help Desk Management',
    to: '/admin/helpdesk',
    icon: HeadsetIcon,
  },
  {
    label: 'Ticket Categories',
    section: 'Ticket Management',
    to: '/admin/ticket-categories',
    icon: TagsIcon,
  },
  {
    label: 'Roles & Permissions',
    to: '/admin/roles-permissions',
    icon: ShieldCheckIcon,
  },
  {
    label: 'Organisation Settings',
    to: '/admin/settings',
    icon: SettingsIcon,
  },
  {
    label: 'Reports',
    to: '/admin/reports',
    icon: FileChartColumnIcon,
    requiredPermission: 'VIEW_REPORTS',
  },
]

const sidebarCollapsedStorageKey = 'ophile-orgadmin-sidebar-collapsed'

function getInitialSidebarCollapsed() {
  if (typeof window === 'undefined') return false

  try {
    return window.localStorage.getItem(sidebarCollapsedStorageKey) === 'true'
  } catch {
    return false
  }
}

const pageDetails = [
  {
    matches: (pathname) => pathname === '/admin/ticket-categories',
    title: 'Ticket Categories',
    description: 'Manage the Categories available for Company tickets.',
  },
  {
    matches: (pathname) => pathname.startsWith('/admin/groups/'),
    title: 'Group Details',
    description: 'Review the Group profile and membership.',
  },
  {
    matches: (pathname) => pathname === '/admin/groups',
    title: 'Groups',
    description: 'Manage organisational Groups and membership.',
  },
  {
    matches: (pathname) => pathname === '/admin/users/new',
    title: 'Create User',
    description: 'Create an Ophile account for your Organisation.',
  },
  {
    matches: (pathname) =>
      pathname.startsWith('/admin/users/') && pathname.endsWith('/edit'),
    title: 'Edit User',
    description: 'Update the user profile and account access.',
  },
  {
    matches: (pathname) => pathname.startsWith('/admin/users/'),
    title: 'User Details',
    description: 'Review the user profile and account access.',
  },
  {
    matches: (pathname) => pathname === '/admin/users',
    title: 'Users',
    description: 'Manage users in your Organisation.',
  },
  {
    matches: (pathname) => pathname === '/admin/helpdesk/new',
    title: 'Create Help Desk',
    description: 'Create a Help Desk account for your Organisation.',
  },
  {
    matches: (pathname) =>
      pathname.startsWith('/admin/helpdesk/') && pathname.endsWith('/edit'),
    title: 'Edit Help Desk',
    description: 'Update the Help Desk profile and account access.',
  },
  {
    matches: (pathname) => pathname.startsWith('/admin/helpdesk/'),
    title: 'Help Desk Details',
    description: 'Review the Help Desk profile and account access.',
  },
  {
    matches: (pathname) => pathname === '/admin/helpdesk',
    title: 'Help Desk Management',
    description: 'Manage Help Desk users in your Organisation.',
  },
  {
    matches: (pathname) =>
      pathname.startsWith('/admin/roles-permissions/users/'),
    title: 'Manage User Access',
    description: 'Review effective role and additional permissions.',
  },
  {
    matches: (pathname) => pathname === '/admin/roles-permissions',
    title: 'Roles & Permissions',
    description: 'Review Organisation access controls.',
  },
  {
    matches: (pathname) => pathname === '/admin/settings',
    title: 'Organisation Settings',
    description: 'Manage your Organisation profile and preferences.',
  },
  {
    matches: (pathname) => pathname === '/admin/reports',
    title: 'Reports',
    description: 'Review available Organisation reports.',
  },
]

function getPageDetails(pathname) {
  return (
    pageDetails.find((item) => item.matches(pathname)) ?? {
      title: 'Overview',
      description: 'Your Organisation administration workspace.',
    }
  )
}

function OrganisationAdminLayout() {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [navigationOpen, setNavigationOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    getInitialSidebarCollapsed,
  )
  const [appearance, setAppearance] = useState({
    organisationId: user.organisationId,
    backgroundId: defaultOrganisationBackgroundId,
  })
  const visibleNavigation = navigation.filter(
    (item) =>
      !item.requiredPermission ||
      user.permissions?.includes(item.requiredPermission),
  )
  const currentPage = getPageDetails(location.pathname)
  const pageUsesGlassComponents =
    location.pathname.startsWith('/admin/groups') ||
    location.pathname.startsWith('/admin/users') ||
    location.pathname.startsWith('/admin/helpdesk') ||
    location.pathname.startsWith('/admin/ticket-categories') ||
    location.pathname.startsWith('/admin/roles-permissions') ||
    location.pathname === '/admin/settings'
  const selectedBackground = getOrganisationBackground(
    appearance.backgroundId,
  )

  useEffect(() => {
    let isActive = true

    getOrganisationAppearance(user.organisationId)
      .then((organisationAppearance) => {
        if (isActive) setAppearance(organisationAppearance)
      })
      .catch(() => {
        if (isActive) {
          setAppearance({
            organisationId: user.organisationId,
            backgroundId: defaultOrganisationBackgroundId,
          })
        }
      })

    return () => {
      isActive = false
    }
  }, [user.organisationId])

  useEffect(() => {
    setNavigationOpen(false)
  }, [location.pathname])

  function openSupportPortal() {
    setNavigationOpen(false)
    navigate('/support')
  }

  function toggleSidebarCollapsed() {
    setSidebarCollapsed((current) => {
      const nextValue = !current

      try {
        window.localStorage.setItem(
          sidebarCollapsedStorageKey,
          String(nextValue),
        )
      } catch {
        // The collapse control still works when browser storage is unavailable.
      }

      return nextValue
    })
  }

  async function updateOrganisationBackground(backgroundId) {
    const updatedAppearance = await updateOrganisationAppearance(
      user.organisationId,
      { backgroundId },
    )
    setAppearance(updatedAppearance)
    return updatedAppearance
  }

  return (
    <OrganisationAppearanceContext.Provider
      value={{ appearance, updateOrganisationBackground }}
    >
      <div
        className={cn(
          'relative isolate min-h-screen overflow-x-hidden p-3 transition-[grid-template-columns] duration-300 motion-reduce:transition-none md:grid md:items-start md:gap-3',
          sidebarCollapsed
            ? 'md:grid-cols-[5rem_minmax(0,1fr)]'
            : 'md:grid-cols-[16rem_minmax(0,1fr)]',
        )}
      >
        <div
          className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${selectedBackground.image})` }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none fixed inset-0 z-0 bg-background/25"
          aria-hidden="true"
        />

        {navigationOpen && (
          <button
            className="fixed inset-0 z-40 bg-foreground/10 backdrop-blur-[1px] md:hidden"
            type="button"
            title="Close navigation"
            aria-label="Close navigation"
            onClick={() => setNavigationOpen(false)}
          />
        )}

        <GlassSidebar
          className={cn(
            'fixed top-3 bottom-3 left-3 z-50 h-[calc(100vh-1.5rem)] transition-[width,transform] duration-300 motion-reduce:transition-none md:sticky md:top-3 md:bottom-auto md:left-auto md:z-20 md:translate-x-0',
            navigationOpen ? 'translate-x-0' : '-translate-x-[110%]',
          )}
          collapsed={sidebarCollapsed}
          navigation={visibleNavigation}
          user={user}
          onNavigate={() => setNavigationOpen(false)}
          onOpenSupportPortal={openSupportPortal}
          onToggleCollapsed={toggleSidebarCollapsed}
        />

        <div className="relative z-10 min-w-0 md:col-start-2">
          <GlassHeader
            className="sticky top-3 z-30"
            title={currentPage.title}
            description={currentPage.description}
            user={user}
            onOpenNavigation={() => setNavigationOpen(true)}
          />

          <main className="px-1 py-5 sm:px-2 md:px-3 md:py-6">
            {pageUsesGlassComponents ? (
              <Outlet />
            ) : (
              <GlassPanel>
                <Outlet />
              </GlassPanel>
            )}
          </main>
        </div>
      </div>
    </OrganisationAppearanceContext.Provider>
  )
}

export default OrganisationAdminLayout
