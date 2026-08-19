import { EyeIcon, InboxIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

import TicketStatusBadge from '@/components/support/TicketStatusBadge'
import TicketIssueTypeBadge from '@/components/support/TicketIssueTypeBadge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatTicketDate } from '@/lib/supportTicketUtils'

function ViewTicketButton({ ticketId, iconOnly = false }) {
  return (
    <Button
      render={<Link to={`/support/tickets/${ticketId}`} />}
      nativeButton={false}
      variant="outline"
      size={iconOnly ? 'icon-sm' : 'sm'}
      aria-label={iconOnly ? 'View ticket' : undefined}
    >
      <EyeIcon />
      {!iconOnly && 'View'}
    </Button>
  )
}

function EmptyTickets() {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
        <InboxIcon className="size-6" />
      </span>
      <h2 className="mt-4 font-medium">No tickets found</h2>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Try changing your search or selected tab, or log a new ticket when you need help.
      </p>
    </div>
  )
}

function TicketList({ tickets, isLoading }) {
  if (isLoading) {
    return (
      <div className="flex min-h-64 items-center justify-center text-sm text-muted-foreground">
        Loading tickets...
      </div>
    )
  }

  if (!tickets.length) return <EmptyTickets />

  return (
    <>
      <div className="hidden xl:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ticket Reference</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Requester</TableHead>
              <TableHead>Issue Type</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Group</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Supporter</TableHead>
              <TableHead>Created Date</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.map((ticket) => (
              <TableRow key={ticket.id}>
                <TableCell className="font-mono text-xs font-medium">
                  {ticket.reference}
                </TableCell>
                <TableCell className="max-w-56 whitespace-normal">
                  <span className="line-clamp-2 font-medium">{ticket.title}</span>
                </TableCell>
                <TableCell>{ticket.requester?.name ?? '—'}</TableCell>
                <TableCell>
                  <TicketIssueTypeBadge issueType={ticket.issueType} />
                </TableCell>
                <TableCell>{ticket.categoryLabel ?? '—'}</TableCell>
                <TableCell>{ticket.group?.name ?? 'Not routed'}</TableCell>
                <TableCell>
                  <TicketStatusBadge status={ticket.status} />
                </TableCell>
                <TableCell>{ticket.assignee?.name ?? 'Unassigned'}</TableCell>
                <TableCell>{formatTicketDate(ticket.createdAt)}</TableCell>
                <TableCell className="text-right">
                  <ViewTicketButton ticketId={ticket.id} iconOnly />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="divide-y divide-border/60 xl:hidden">
        {tickets.map((ticket) => (
          <article key={ticket.id} className="space-y-4 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-mono text-xs text-muted-foreground">
                  {ticket.reference}
                </p>
                <h2 className="mt-1 font-medium leading-6">{ticket.title}</h2>
              </div>
              <TicketStatusBadge status={ticket.status} />
            </div>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Issue Type</dt>
                <dd className="mt-1">
                  <TicketIssueTypeBadge issueType={ticket.issueType} />
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Requester</dt>
                <dd className="mt-1">{ticket.requester?.name ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Created</dt>
                <dd className="mt-1">{formatTicketDate(ticket.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Group</dt>
                <dd className="mt-1">{ticket.group?.name ?? 'Not routed'}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Category</dt>
                <dd className="mt-1">{ticket.categoryLabel ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Supporter</dt>
                <dd className="mt-1">{ticket.assignee?.name ?? 'Unassigned'}</dd>
              </div>
            </dl>
            <ViewTicketButton ticketId={ticket.id} />
          </article>
        ))}
      </div>
    </>
  )
}

export default TicketList
