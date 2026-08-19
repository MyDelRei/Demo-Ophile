import { cn } from '@/lib/utils'

function GlassSection({ className, ...props }) {
  return <section className={cn('space-y-6', className)} {...props} />
}

export default GlassSection
