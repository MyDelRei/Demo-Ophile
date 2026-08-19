import { useEffect, useState } from 'react'
import {
  CircleUserRoundIcon,
  FileChartColumnIcon,
  LifeBuoyIcon,
  LogOutIcon,
  MenuIcon,
  TicketIcon,
  UsersRoundIcon,
  XIcon,
} from 'lucide-react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

function NavigationLink({ item, mobile = false }) {
  const Icon = item.icon

  return (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
          isActive
            ? 'bg-foreground text-background shadow-sm'
            : 'text-muted-foreground hover:bg-background/70 hover:text-foreground',
          mobile && 'w-full',
        )
      }
    >
      <Icon className="size-4" />
      {item.label}
    </NavLink>
  )
}

function SupportNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const navigationItems = [
    { label: 'Tickets', to: '/support/tickets', icon: TicketIcon },
    ...(['USER', 'HELP_DESK'].includes(user.role)
      ? [
          {
            label: 'Group List',
            to: '/support/groups',
            icon: UsersRoundIcon,
          },
        ]
      : []),
    ...(user.permissions?.includes('VIEW_REPORTS')
      ? [
          {
            label: 'Reports',
            to: '/support/reports',
            icon: FileChartColumnIcon,
          },
        ]
      : []),
  ]

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/60 bg-white/75 shadow-[0_8px_30px_rgb(15_23_42/0.06)] backdrop-blur-2xl supports-[backdrop-filter]:bg-white/65">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <NavLink
          to="/support/tickets"
          className="flex shrink-0 items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          aria-label="Ophile Support tickets"
        >
          <span className="flex size-9 items-center justify-center rounded-xl bg-foreground text-background shadow-sm">
            <LifeBuoyIcon className="size-5" />
          </span>
          <span>
            <span className="block text-sm font-semibold leading-none">Ophile</span>
            <span className="mt-1 block text-[11px] leading-none text-muted-foreground">
              Support Portal
            </span>
          </span>
        </NavLink>

        <nav className="ml-4 hidden flex-1 items-center gap-1 lg:flex" aria-label="Support navigation">
          {navigationItems.map((item) => (
            <NavigationLink key={item.to} item={item} />
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-3 sm:flex">
          <div className="flex items-center gap-2 border-r border-border/70 pr-3">
            <CircleUserRoundIcon className="size-5 text-muted-foreground" />
            <div className="max-w-40">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOutIcon />
            Logout
          </Button>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="ml-auto lg:hidden"
          aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((current) => !current)}
        >
          {mobileOpen ? <XIcon /> : <MenuIcon />}
        </Button>
      </div>

      {mobileOpen && (
        <div className="border-t border-white/60 bg-white/80 px-4 py-4 backdrop-blur-2xl lg:hidden">
          <nav className="grid gap-1" aria-label="Mobile support navigation">
            {navigationItems.map((item) => (
              <NavigationLink key={item.to} item={item} mobile />
            ))}
          </nav>
          <div className="mt-4 flex items-center justify-between gap-3 border-t border-border/60 pt-4 sm:hidden">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOutIcon />
              Logout
            </Button>
          </div>
        </div>
      )}
    </header>
  )
}

export default SupportNavbar
