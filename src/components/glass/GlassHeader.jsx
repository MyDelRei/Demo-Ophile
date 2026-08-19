import { MenuIcon } from 'lucide-react'

import LogoutButton from '@/components/common/LogoutButton'
import { glassChromeClass } from '@/components/glass/glassStyles'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

function GlassHeader({ className, description, onOpenNavigation, title, user }) {
  return (
    <header
      className={cn(
        'flex min-h-16 items-center justify-between gap-4 rounded-2xl px-4 py-3 sm:px-5',
        glassChromeClass,
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <Button
          className="md:hidden"
          variant="outline"
          size="icon"
          title="Open navigation"
          aria-label="Open navigation"
          onClick={onOpenNavigation}
        >
          <MenuIcon />
        </Button>
        <div className="min-w-0">
          <p className="truncate font-semibold">{title}</p>
          {description && (
            <p className="hidden truncate text-xs text-muted-foreground sm:block">
              {description}
            </p>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium">{user.name}</p>
          <p className="text-xs text-muted-foreground">Organisation Admin</p>
        </div>
        <LogoutButton />
      </div>
    </header>
  )
}

export default GlassHeader
