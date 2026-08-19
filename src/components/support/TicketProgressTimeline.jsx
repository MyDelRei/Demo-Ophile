import {
  CheckIcon,
  CheckCircle2Icon,
  CircleIcon,
  CircleOffIcon,
  Clock3Icon,
  LockIcon,
  UserRoundIcon,
  WrenchIcon,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { formatTicketDateTime } from '@/lib/supportTicketUtils'
import { cn } from '@/lib/utils'

const lifecycleSteps = [
  {
    status: 'OPEN',
    label: 'Open',
    icon: CircleIcon,
    eventTypes: ['TICKET_CREATED'],
    iconClass: 'border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200',
    currentClass: 'border-slate-400 bg-slate-50/80 dark:border-slate-500 dark:bg-slate-900/60',
    lineClass: 'bg-slate-300 dark:bg-slate-600',
  },
  {
    status: 'PENDING',
    label: 'Pending',
    icon: Clock3Icon,
    eventTypes: ['TICKET_ROUTED'],
    iconClass: 'border-amber-300 bg-amber-100 text-amber-700 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300',
    currentClass: 'border-amber-300 bg-amber-50/70 dark:border-amber-700 dark:bg-amber-950/40',
    lineClass: 'bg-amber-300 dark:bg-amber-700',
  },
  {
    status: 'IMPLEMENTATION',
    label: 'In Progress',
    icon: WrenchIcon,
    eventTypes: ['IMPLEMENTATION_STARTED', 'ASSIGNED_TO_SUPPORTER', 'ASSIGNED_TO_TEAMMATE'],
    iconClass: 'border-blue-300 bg-blue-100 text-blue-700 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-300',
    currentClass: 'border-blue-300 bg-blue-50/70 dark:border-blue-700 dark:bg-blue-950/40',
    lineClass: 'bg-blue-300 dark:bg-blue-700',
  },
  {
    status: 'RESOLVED',
    label: 'Resolved',
    icon: CheckCircle2Icon,
    eventTypes: ['MARKED_RESOLVED'],
    iconClass: 'border-emerald-300 bg-emerald-100 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
    currentClass: 'border-emerald-300 bg-emerald-50/70 dark:border-emerald-700 dark:bg-emerald-950/40',
    lineClass: 'bg-emerald-300 dark:bg-emerald-700',
  },
  {
    status: 'CLOSED',
    label: 'Closed',
    icon: LockIcon,
    eventTypes: ['TICKET_CLOSED', 'REQUESTER_CONFIRMED', 'HELP_DESK_CLOSED_FOR_USER'],
    iconClass: 'border-zinc-400 bg-zinc-200 text-zinc-700 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200',
    currentClass: 'border-zinc-400 bg-zinc-100/80 dark:border-zinc-600 dark:bg-zinc-900/60',
    lineClass: 'bg-zinc-400 dark:bg-zinc-600',
  },
]

function getLatestStepEvent(history, eventTypes) {
  return [...(history ?? [])]
    .reverse()
    .find((event) => eventTypes.includes(event.type))
}

function getStepDescription(step, ticket) {
  if (step.status === 'OPEN') return 'Ticket submitted for support review.'
  if (step.status === 'PENDING') {
    return ticket.group
      ? `Routed to ${ticket.group.name}.`
      : 'Ticket routing and assignment.'
  }
  if (step.status === 'IMPLEMENTATION') {
    return ticket.assignee
      ? `Assigned to ${ticket.assignee.name}.`
      : 'Support work begins after assignment.'
  }
  if (step.status === 'RESOLVED') {
    return ticket.solution?.resolvedBy
      ? `Solution provided by ${ticket.solution.resolvedBy.name}.`
      : 'Solution provided for requester review.'
  }
  return ticket.closeMethod === 'HELP_DESK_OVERRIDE'
    ? 'Closed by Help Desk using a recorded override.'
    : 'Resolution confirmed by the requester.'
}

function ContextItem({ label, children }) {
  if (!children) return null
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm font-medium">{children}</dd>
    </div>
  )
}

function CurrentStatusContext({ ticket }) {
  const implementationEvent = getLatestStepEvent(ticket.history, [
    'IMPLEMENTATION_STARTED',
    'ASSIGNED_TO_SUPPORTER',
    'ASSIGNED_TO_TEAMMATE',
  ])
  const resolvedEvent = getLatestStepEvent(ticket.history, ['MARKED_RESOLVED'])
  const closedEvent = getLatestStepEvent(ticket.history, [
    'TICKET_CLOSED',
    'REQUESTER_CONFIRMED',
    'HELP_DESK_CLOSED_FOR_USER',
  ])

  if (ticket.status === 'PENDING') {
    return (
      <div className="mt-6 rounded-xl border border-amber-200/80 bg-amber-50/55 p-4 dark:border-amber-800/70 dark:bg-amber-950/25">
        <p className="text-sm font-medium">Waiting for supporter assignment</p>
        {ticket.group?.name && (
          <dl className="mt-3">
            <ContextItem label="Routed Group">{ticket.group.name}</ContextItem>
          </dl>
        )}
      </div>
    )
  }

  if (ticket.status === 'IMPLEMENTATION') {
    return (
      <dl className="mt-6 grid gap-4 rounded-xl border border-blue-200/80 bg-blue-50/55 p-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 dark:border-blue-800/70 dark:bg-blue-950/25">
        <ContextItem label="Assigned Supporter">{ticket.assignee?.name}</ContextItem>
        <ContextItem label="Work Started">
          {implementationEvent?.createdAt && formatTicketDateTime(implementationEvent.createdAt)}
        </ContextItem>
      </dl>
    )
  }

  if (ticket.status === 'RESOLVED') {
    return (
      <dl className="mt-6 grid gap-4 rounded-xl border border-emerald-200/80 bg-emerald-50/55 p-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 dark:border-emerald-800/70 dark:bg-emerald-950/25">
        <ContextItem label="Resolved By">
          {ticket.solution?.resolvedBy?.name ?? resolvedEvent?.actor?.name}
        </ContextItem>
        <ContextItem label="Resolved Date">
          {(ticket.solution?.resolvedAt ?? resolvedEvent?.createdAt) &&
            formatTicketDateTime(ticket.solution?.resolvedAt ?? resolvedEvent.createdAt)}
        </ContextItem>
      </dl>
    )
  }

  if (ticket.status === 'CLOSED') {
    const helpDeskOverride =
      closedEvent?.metadata?.closeMethod === 'HELP_DESK_OVERRIDE' ||
      ticket.closeMethod === 'HELP_DESK_OVERRIDE'
    return (
      <dl className="mt-6 grid gap-4 rounded-xl border border-zinc-300/80 bg-zinc-100/60 p-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 dark:border-zinc-700 dark:bg-zinc-900/40">
        <ContextItem label={helpDeskOverride ? 'Closed By' : 'Confirmed By'}>
          {closedEvent?.actor?.name}
        </ContextItem>
        <ContextItem label="Closed Date">
          {closedEvent?.createdAt && formatTicketDateTime(closedEvent.createdAt)}
        </ContextItem>
        {helpDeskOverride && (
          <ContextItem label="Close Method">Help Desk Override</ContextItem>
        )}
      </dl>
    )
  }

  return null
}

function DroppedTerminalState({ ticket, event }) {
  return (
    <div
      className="mt-2 grid grid-cols-[2.75rem_minmax(0,1fr)] gap-3"
      aria-current="step"
    >
      <span className="flex size-11 items-center justify-center rounded-full border-2 border-rose-300 bg-rose-100 text-rose-700 ring-4 ring-rose-500/10 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-300">
        <CircleOffIcon className="size-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 rounded-xl border-2 border-rose-300 bg-rose-50/65 px-3 py-3 shadow-sm dark:border-rose-800 dark:bg-rose-950/30">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-base font-semibold text-rose-800 dark:text-rose-200">
            Dropped
          </h3>
          <Badge variant="outline" className="border-rose-200 bg-background/75 text-[10px] uppercase tracking-wide text-rose-700 dark:border-rose-800 dark:text-rose-300">
            Alternate terminal status
          </Badge>
        </div>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          This ticket left the normal lifecycle before implementation.
        </p>
        {ticket.dropReason && (
          <p className="mt-2 text-sm leading-6 text-rose-900/80 dark:text-rose-100/80">
            {ticket.dropReason}
          </p>
        )}
        {event && (
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {event.actor?.name && (
              <span className="inline-flex items-center gap-1">
                <UserRoundIcon className="size-3" aria-hidden="true" />
                {event.actor.name}
              </span>
            )}
            {event.createdAt && (
              <time dateTime={event.createdAt}>
                {formatTicketDateTime(event.createdAt)}
              </time>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function TicketProgressTimeline({ ticket }) {
  const droppedEvent = getLatestStepEvent(ticket.history, ['TICKET_DROPPED'])
  const isDropped = ticket.status === 'DROPPED'
  const droppedFromStatus = droppedEvent?.metadata?.previousStatus
  const droppedBranchIndex = droppedFromStatus === 'PENDING' ? 1 : 0
  const currentIndex = isDropped
    ? droppedBranchIndex
    : Math.max(
        lifecycleSteps.findIndex((step) => step.status === ticket.status),
        0,
      )

  return (
    <div>
      <ol aria-label="Ticket lifecycle">
        {lifecycleSteps.map((step, index) => {
          const Icon = step.icon
          const event = getLatestStepEvent(ticket.history, step.eventTypes)
          const completed = isDropped
            ? index <= droppedBranchIndex
            : index < currentIndex
          const current = !isDropped && index === currentIndex
          const future = isDropped
            ? index > droppedBranchIndex
            : index > currentIndex

          return (
            <li
              key={step.status}
              className="relative grid grid-cols-[2.75rem_minmax(0,1fr)] gap-3 pb-6 last:pb-0"
            >
              {index < lifecycleSteps.length - 1 && (
                <span
                  className={cn(
                    'absolute top-10 bottom-0 left-[1.34rem] w-px',
                    index < currentIndex && !isDropped
                      ? step.lineClass
                      : 'bg-border',
                  )}
                  aria-hidden="true"
                />
              )}
              <span
                className={cn(
                  'relative z-10 flex size-11 items-center justify-center rounded-full border-2 transition-colors',
                  step.iconClass,
                  future && 'border-border bg-background/80 text-muted-foreground opacity-55',
                  current && 'ring-4 ring-current/10',
                )}
                aria-hidden="true"
              >
                <Icon className="size-5" />
                {completed && (
                  <span className="absolute -right-1 -bottom-1 flex size-4 items-center justify-center rounded-full border border-background bg-foreground text-background">
                    <CheckIcon className="size-2.5" />
                  </span>
                )}
              </span>

              <div
                className={cn(
                  'min-w-0 rounded-xl px-3 py-2.5',
                  current && `border-2 shadow-sm ${step.currentClass}`,
                  future && 'opacity-55',
                )}
                aria-current={current ? 'step' : undefined}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className={cn('text-sm font-semibold', current && 'text-base')}>
                    {step.label}
                  </h3>
                  {current && (
                    <Badge variant="outline" className="bg-background/75 text-[10px] uppercase tracking-wide">
                      Current status
                    </Badge>
                  )}
                </div>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {getStepDescription(step, ticket)}
                </p>
                {event && (
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    {event.actor?.name && (
                      <span className="inline-flex items-center gap-1">
                        <UserRoundIcon className="size-3" aria-hidden="true" />
                        {event.actor.name}
                      </span>
                    )}
                    {event.createdAt && (
                      <time dateTime={event.createdAt}>
                        {formatTicketDateTime(event.createdAt)}
                      </time>
                    )}
                  </div>
                )}
              </div>
            </li>
          )
        })}
      </ol>

      {isDropped ? (
        <DroppedTerminalState ticket={ticket} event={droppedEvent} />
      ) : (
        <CurrentStatusContext ticket={ticket} />
      )}
    </div>
  )
}

export default TicketProgressTimeline
