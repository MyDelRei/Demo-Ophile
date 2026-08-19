import { Badge } from '@/components/ui/badge'
import { ticketIssueTypeLabels } from '@/lib/ticketIssueTypes'
import { cn } from '@/lib/utils'

const ticketIssueTypeClasses = {
  INCIDENT:
    'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300',
  ENHANCEMENT:
    'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300',
  NEW_REQUEST:
    'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-300',
}

function TicketIssueTypeBadge({ issueType, className }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'font-medium',
        issueType
          ? ticketIssueTypeClasses[issueType]
          : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300',
        className,
      )}
    >
      {ticketIssueTypeLabels[issueType] ?? 'Not Classified'}
    </Badge>
  )
}

export default TicketIssueTypeBadge
