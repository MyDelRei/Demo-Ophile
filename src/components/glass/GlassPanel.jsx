import { glassSurfaceClass } from '@/components/glass/glassStyles'
import { cn } from '@/lib/utils'

function GlassPanel({ className, interactive = false, ...props }) {
  return (
    <div
      className={cn(
        'rounded-2xl p-5',
        glassSurfaceClass,
        interactive &&
          'transition-[background-color,box-shadow,transform] duration-150 hover:bg-background/85 hover:shadow-md',
        className,
      )}
      {...props}
    />
  )
}

export default GlassPanel
