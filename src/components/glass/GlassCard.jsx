import { Card } from '@/components/ui/card'
import { glassSurfaceClass } from '@/components/glass/glassStyles'
import { cn } from '@/lib/utils'

function GlassCard({ className, ...props }) {
  return (
    <Card
      className={cn(
        'rounded-2xl ring-0',
        glassSurfaceClass,
        className,
      )}
      {...props}
    />
  )
}

export default GlassCard
