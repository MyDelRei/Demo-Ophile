import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const ticketStatusLabels = {
  OPEN: 'Open',
  PENDING: 'Pending',
  IMPLEMENTATION: 'In Progress',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
  DROPPED: 'Dropped',
}

const ticketStatusClasses = {
  OPEN: 'border-sky-200 bg-sky-50 text-sky-700',
  PENDING: 'border-violet-200 bg-violet-50 text-violet-700',
  IMPLEMENTATION: 'border-amber-200 bg-amber-50 text-amber-700',
  RESOLVED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  CLOSED: 'border-slate-200 bg-slate-100 text-slate-700',
  DROPPED: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300',
}

function TicketStatusBadge({ status }) {
  return (
    <Badge
      variant="outline"
      className={cn('font-medium', ticketStatusClasses[status])}
    >
      {ticketStatusLabels[status] ?? status}
    </Badge>
  )
}

export default TicketStatusBadge
