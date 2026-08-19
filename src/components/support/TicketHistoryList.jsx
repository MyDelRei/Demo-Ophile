import {
  CheckCircle2Icon,
  CircleOffIcon,
  CirclePlusIcon,
  HistoryIcon,
  MessageSquareIcon,
  LockIcon,
  RefreshCwIcon,
  RouteIcon,
  TagIcon,
  UserRoundCheckIcon,
  WrenchIcon,
  XCircleIcon,
} from 'lucide-react'

import { formatTicketDateTime } from '@/lib/supportTicketUtils'
import { ticketIssueTypeLabels } from '@/lib/ticketIssueTypes'
import { cn } from '@/lib/utils'

const historyTypes = {
  TICKET_CREATED: {
    label: 'Ticket Created',
    icon: CirclePlusIcon,
    className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
  },
  TICKET_ROUTED: {
    label: 'Ticket Routed',
    icon: RouteIcon,
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  },
  TICKET_REROUTED: {
    label: 'Ticket Re-routed',
    icon: RouteIcon,
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  },
  CATEGORY_CLASSIFIED: {
    label: 'Category Classified',
    icon: TagIcon,
    className: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300',
  },
  CATEGORY_CHANGED: {
    label: 'Category Changed',
    icon: TagIcon,
    className: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300',
  },
  ISSUE_TYPE_CLASSIFIED: {
    label: 'Issue Type Classified',
    icon: TagIcon,
    className: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300',
  },
  ISSUE_TYPE_CHANGED: {
    label: 'Issue Type Changed',
    icon: TagIcon,
    className: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300',
  },
  ASSIGNED_TO_SUPPORTER: {
    label: 'Assigned to Supporter',
    icon: UserRoundCheckIcon,
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  },
  ASSIGNED_TO_TEAMMATE: {
    label: 'Assigned to Teammate',
    icon: UserRoundCheckIcon,
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  },
  REASSIGNED: {
    label: 'Reassigned',
    icon: RefreshCwIcon,
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  },
  IMPLEMENTATION_STARTED: {
    label: 'Implementation Started',
    icon: WrenchIcon,
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  },
  COMMENT_ADDED: {
    label: 'Comment Added',
    icon: MessageSquareIcon,
    className: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
  },
  MARKED_RESOLVED: {
    label: 'Marked Resolved',
    icon: CheckCircle2Icon,
    className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  },
  RESOLUTION_REJECTED: {
    label: 'Resolution Rejected',
    icon: XCircleIcon,
    className: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
  },
  TICKET_CLOSED: {
    label: 'Closed',
    icon: CheckCircle2Icon,
    className: 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200',
  },
  REQUESTER_CONFIRMED: {
    label: 'Requester Confirmed',
    icon: CheckCircle2Icon,
    className: 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200',
  },
  HELP_DESK_CLOSED_FOR_USER: {
    label: 'Help Desk Closed for User',
    icon: LockIcon,
    className: 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200',
  },
  TICKET_DROPPED: {
    label: 'Ticket Dropped',
    icon: CircleOffIcon,
    className: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
  },
  REOPENED: {
    label: 'Reopened',
    icon: RefreshCwIcon,
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  },
}

function getEventDetail(event, ticket) {
  const metadata = event.metadata ?? {}
  if (['ISSUE_TYPE_CLASSIFIED', 'ISSUE_TYPE_CHANGED'].includes(event.type)) {
    return `Previous: ${ticketIssueTypeLabels[metadata.previousIssueType] ?? 'Not Classified'}\nNew: ${ticketIssueTypeLabels[metadata.newIssueType] ?? metadata.newIssueType}`
  }
  if (['CATEGORY_CLASSIFIED', 'CATEGORY_CHANGED'].includes(event.type)) {
    return `${metadata.previousCategoryName ?? 'Previous category'} → ${metadata.newCategoryName ?? 'New category'}`
  }
  if (event.type === 'TICKET_ROUTED') {
    return `Group: ${metadata.groupName ?? ticket.group?.name ?? 'Unavailable Group'}`
  }
  if (event.type === 'TICKET_REROUTED') {
    return `${metadata.previousGroupName ?? 'Previous Group'} → ${metadata.newGroupName ?? 'New Group'}\nReason: ${metadata.reason}`
  }
  if (['ASSIGNED_TO_SUPPORTER', 'ASSIGNED_TO_TEAMMATE'].includes(event.type)) {
    return `Assigned to ${metadata.assigneeName ?? ticket.assignee?.name ?? 'Supporter'}`
  }
  if (event.type === 'HELP_DESK_CLOSED_FOR_USER') {
    return `Close Method: Help Desk Override\nReason: ${metadata.reason}`
  }
  if (event.type === 'REQUESTER_CONFIRMED') {
    return 'The requester confirmed that the solution resolved the issue.'
  }
  if (event.type === 'TICKET_DROPPED') {
    return `Previous Status: ${metadata.previousStatus ?? '—'}\nReason: ${metadata.reason}`
  }
  if (metadata.reason) return `Reason: ${metadata.reason}`
  return null
}

function TicketHistoryList({ history = [], ticket }) {
  if (history.length === 0) {
    return (
      <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
        No ticket history is available yet.
      </p>
    )
  }

  const chronologicalHistory = [...history].sort(
    (first, second) => new Date(first.createdAt) - new Date(second.createdAt),
  )

  return (
    <ol className="space-y-0" aria-label="Ticket activity history">
      {chronologicalHistory.map((event, index) => {
        const definition = historyTypes[event.type] ?? {
          label: event.type,
          icon: HistoryIcon,
          className: 'bg-muted text-muted-foreground',
        }
        const Icon = definition.icon
        const detail = getEventDetail(event, ticket)

        return (
          <li
            key={event.id}
            className="relative grid grid-cols-[2.5rem_minmax(0,1fr)] gap-3 pb-6 last:pb-0"
          >
            {index < chronologicalHistory.length - 1 && (
              <span
                className="absolute top-9 bottom-0 left-[1.2rem] w-px bg-border"
                aria-hidden="true"
              />
            )}
            <span
              className={cn(
                'relative z-10 flex size-10 items-center justify-center rounded-full',
                definition.className,
              )}
              aria-hidden="true"
            >
              <Icon className="size-4" />
            </span>
            <article className="min-w-0 rounded-xl border border-border/60 bg-background/45 p-4">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                <h3 className="text-sm font-medium">{definition.label}</h3>
                <time
                  className="shrink-0 text-xs text-muted-foreground"
                  dateTime={event.createdAt}
                >
                  {formatTicketDateTime(event.createdAt)}
                </time>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {event.actor?.name ?? 'System'}
              </p>
              {detail && (
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                  {detail}
                </p>
              )}
            </article>
          </li>
        )
      })}
    </ol>
  )
}

export default TicketHistoryList
