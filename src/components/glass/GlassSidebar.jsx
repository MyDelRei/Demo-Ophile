import { Fragment } from 'react'
import {
  ExternalLinkIcon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
} from 'lucide-react'

import IconActionButton from '@/components/common/IconActionButton'
import { glassChromeClass } from '@/components/glass/glassStyles'
import OrganisationAdminNavItem from '@/components/glass/OrganisationAdminNavItem'
import { cn } from '@/lib/utils'

function GlassSidebar({
  className,
  collapsed,
  navigation,
  onNavigate,
  onOpenSupportPortal,
  onToggleCollapsed,
  user,
}) {
  const ToggleIcon = collapsed ? PanelLeftOpenIcon : PanelLeftCloseIcon
  const toggleLabel = collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'
  const userInitial = user.name?.charAt(0).toUpperCase() || 'A'

  return (
    <aside
      className={cn(
        'flex h-full w-64 flex-col rounded-2xl p-4',
        glassChromeClass,
        collapsed && 'md:w-20 md:p-3',
        className,
      )}
    >
      <div
        className={cn(
          'mb-6 flex items-center justify-between gap-3 px-2',
          collapsed && 'md:flex-col md:px-0',
        )}
      >
        <div className="min-w-0">
          <div className={cn(collapsed && 'md:hidden')}>
            <p className="font-semibold tracking-tight">Ophile</p>
            <p className="text-xs text-muted-foreground">Admin Portal</p>
          </div>
          <div
            className={cn(
              'hidden size-10 items-center justify-center rounded-xl border border-white/60 bg-background/65 font-semibold shadow-sm',
              collapsed && 'md:flex',
            )}
            aria-label="Ophile"
          >
            O
          </div>
        </div>

        <IconActionButton
          className="hidden md:inline-flex"
          icon={ToggleIcon}
          variant="ghost"
          size={40}
          title={toggleLabel}
          aria-expanded={!collapsed}
          onClick={onToggleCollapsed}
        />
      </div>

      <nav className="space-y-1" aria-label="Organisation Admin navigation">
        {navigation.map((item, index) => (
          <Fragment key={item.to}>
            {item.section &&
              item.section !== navigation[index - 1]?.section && (
                <div
                  className={cn(
                    'mt-4 border-t border-white/40 pt-3 dark:border-white/10',
                    collapsed && 'md:mt-3 md:pt-3',
                  )}
                >
                  <p
                    className={cn(
                      'px-3 pb-1 text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase',
                      collapsed && 'md:sr-only',
                    )}
                  >
                    {item.section}
                  </p>
                </div>
              )}
            <OrganisationAdminNavItem
              collapsed={collapsed}
              icon={item.icon}
              label={item.label}
              to={item.to}
              end={item.end}
              onClick={onNavigate}
            />
          </Fragment>
        ))}

        <div className="mt-3 border-t border-white/40 pt-3 dark:border-white/10">
          <OrganisationAdminNavItem
            collapsed={collapsed}
            icon={ExternalLinkIcon}
            label="Open Support Portal"
            onClick={onOpenSupportPortal}
          />
        </div>
      </nav>

      <div className="mt-auto rounded-xl border border-white/50 bg-background/55 p-3 dark:border-white/10">
        <div className={cn(collapsed && 'md:hidden')}>
          <p className="truncate text-sm font-medium">{user.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            Organisation Admin
          </p>
        </div>
        <div
          className={cn(
            'hidden size-8 items-center justify-center rounded-lg bg-background/75 text-sm font-semibold',
            collapsed && 'md:flex',
          )}
          title={`${user.name} — Organisation Admin`}
          aria-label={`${user.name}, Organisation Admin`}
        >
          {userInitial}
        </div>
      </div>
    </aside>
  )
}

export default GlassSidebar
