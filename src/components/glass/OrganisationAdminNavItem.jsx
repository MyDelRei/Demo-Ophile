import { NavLink } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

function OrganisationAdminNavItem({
  collapsed,
  end,
  icon: Icon,
  label,
  onClick,
  to,
}) {
  function itemClassName(isActive) {
    return cn(
      'orgadmin-nav-item flex min-h-10 w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring/60',
      collapsed && 'md:justify-center md:px-0',
      isActive
        ? 'border-white/65 bg-background/85 text-foreground shadow-sm dark:border-white/20'
        : 'border-transparent text-muted-foreground hover:bg-background/60 hover:text-foreground',
    )
  }

  const content = (
    <>
      <Icon className="relative z-10 size-4 shrink-0" aria-hidden="true" />
      <span className={cn('relative z-10 truncate', collapsed && 'md:hidden')}>
        {label}
      </span>
    </>
  )

  return (
    <div className="group/org-nav relative">
      {to ? (
        <NavLink
          to={to}
          end={end}
          title={collapsed ? label : undefined}
          aria-label={collapsed ? label : undefined}
          onClick={onClick}
          className={({ isActive }) => itemClassName(isActive)}
        >
          {content}
        </NavLink>
      ) : (
        <Button
          className={itemClassName(false)}
          variant="ghost"
          title={collapsed ? label : undefined}
          aria-label={collapsed ? label : undefined}
          onClick={onClick}
        >
          {content}
        </Button>
      )}

      {collapsed && (
        <span
          className="pointer-events-none absolute top-1/2 left-[calc(100%+0.75rem)] z-[60] hidden -translate-y-1/2 whitespace-nowrap rounded-md border bg-popover px-2 py-1 text-xs font-medium text-popover-foreground opacity-0 shadow-md transition-opacity duration-150 group-hover/org-nav:opacity-100 group-focus-within/org-nav:opacity-100 md:block motion-reduce:transition-none"
          role="tooltip"
        >
          {label}
        </span>
      )}
    </div>
  )
}

export default OrganisationAdminNavItem
