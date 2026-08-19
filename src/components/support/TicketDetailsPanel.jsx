import {
  DownloadIcon,
  ExternalLinkIcon,
  FileIcon,
  PaperclipIcon,
} from 'lucide-react'

import GlassPanel from '@/components/glass/GlassPanel'
import TicketStatusBadge from '@/components/support/TicketStatusBadge'
import TicketIssueTypeBadge from '@/components/support/TicketIssueTypeBadge'
import { buttonVariants } from '@/components/ui/button'
import { formatTicketDateTime } from '@/lib/supportTicketUtils'
import { cn } from '@/lib/utils'

function DetailItem({ label, children, className }) {
  return (
    <div className={className}>
      <dt className="text-xs font-medium tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1.5 break-words text-sm font-medium text-foreground">
        {children}
      </dd>
    </div>
  )
}

function formatFileSize(size) {
  const bytes = Number(size)
  if (!Number.isFinite(bytes) || bytes < 0) return 'Unknown size'
  if (bytes === 0) return '0 B'

  const units = ['B', 'KB', 'MB', 'GB']
  const unitIndex = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  )
  const value = bytes / 1024 ** unitIndex
  return `${value >= 10 || unitIndex === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[unitIndex]}`
}

function formatFileType(type, name) {
  if (type && type !== 'application/octet-stream') return type
  const extension = name?.split('.').pop()
  return extension && extension !== name ? extension.toUpperCase() : 'File'
}

function getLatestHistoryEvent(history, types) {
  const eventTypes = Array.isArray(types) ? types : [types]
  return [...(history ?? [])]
    .reverse()
    .find((event) => eventTypes.includes(event.type))
}

function AttachmentRow({ attachment }) {
  const viewUrl = attachment.viewUrl ?? attachment.url
  const downloadUrl = attachment.downloadUrl

  return (
    <li className="rounded-xl border border-border/60 bg-background/55 p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/70 text-muted-foreground">
            <FileIcon className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="break-all text-sm font-medium">{attachment.name}</p>
            <dl className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
              <div className="flex gap-1.5">
                <dt>Type</dt>
                <dd className="font-medium text-foreground/80">
                  {formatFileType(attachment.type, attachment.name)}
                </dd>
              </div>
              <div className="flex gap-1.5">
                <dt>Size</dt>
                <dd className="font-medium text-foreground/80">
                  {formatFileSize(attachment.size)}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {(viewUrl || downloadUrl) && (
          <div className="flex shrink-0 flex-wrap gap-2">
            {viewUrl && (
              <a
                className={buttonVariants({ variant: 'outline', size: 'sm' })}
                href={viewUrl}
                target="_blank"
                rel="noreferrer"
              >
                <ExternalLinkIcon aria-hidden="true" />
                View
              </a>
            )}
            {downloadUrl && (
              <a
                className={buttonVariants({ variant: 'outline', size: 'sm' })}
                href={downloadUrl}
                download
              >
                <DownloadIcon aria-hidden="true" />
                Download
              </a>
            )}
          </div>
        )}
      </div>
    </li>
  )
}

function TicketDetailsPanel({ ticket, className }) {
  const closedEvent = getLatestHistoryEvent(ticket.history, [
    'TICKET_CLOSED',
    'REQUESTER_CONFIRMED',
    'HELP_DESK_CLOSED_FOR_USER',
  ])
  const droppedEvent = getLatestHistoryEvent(ticket.history, 'TICKET_DROPPED')
  const resolvedAt = ticket.solution?.resolvedAt

  return (
    <GlassPanel className={cn('min-w-0', className)}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-5">
        <div>
          <h2 className="text-lg font-semibold">Ticket Details</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Request information and supporting files.
          </p>
        </div>
        <TicketStatusBadge status={ticket.status} />
      </div>

      <dl className="mt-6 grid gap-x-8 gap-y-5 sm:grid-cols-2">
        <DetailItem label="Ticket Reference">
          <span className="font-mono">{ticket.reference}</span>
        </DetailItem>
        <DetailItem label="Title">{ticket.title}</DetailItem>
        <DetailItem label="Issue Type">
          <TicketIssueTypeBadge issueType={ticket.issueType} />
        </DetailItem>
        <DetailItem label="Category">{ticket.categoryLabel ?? '—'}</DetailItem>
        <DetailItem label="Status">
          <TicketStatusBadge status={ticket.status} />
        </DetailItem>
        <DetailItem label="Requester">{ticket.requester?.name ?? '—'}</DetailItem>
        {ticket.requester?.email && (
          <DetailItem label="Requester Email">
            <a
              className="break-all underline decoration-border underline-offset-4 hover:decoration-foreground"
              href={`mailto:${ticket.requester.email}`}
            >
              {ticket.requester.email}
            </a>
          </DetailItem>
        )}
        <DetailItem label="Routed Group">
          {ticket.group?.name ?? 'Not routed'}
        </DetailItem>
        <DetailItem label="Assigned Supporter">
          {ticket.assignee?.name ?? 'Unassigned'}
        </DetailItem>
        <DetailItem label="Created Date">
          {formatTicketDateTime(ticket.createdAt)}
        </DetailItem>
        <DetailItem label="Updated Date">
          {formatTicketDateTime(ticket.updatedAt)}
        </DetailItem>
        {resolvedAt && (
          <DetailItem label="Resolved Date">
            {formatTicketDateTime(resolvedAt)}
          </DetailItem>
        )}
        {closedEvent?.createdAt && (
          <DetailItem label="Closed Date">
            {formatTicketDateTime(closedEvent.createdAt)}
          </DetailItem>
        )}
        {ticket.closeMethod === 'HELP_DESK_OVERRIDE' && (
          <DetailItem label="Close Method">Help Desk Override</DetailItem>
        )}
        {ticket.closeReason && (
          <DetailItem label="Close Reason">{ticket.closeReason}</DetailItem>
        )}
        {droppedEvent?.createdAt && (
          <DetailItem label="Dropped Date">
            {formatTicketDateTime(droppedEvent.createdAt)}
          </DetailItem>
        )}
        {ticket.dropReason && (
          <DetailItem label="Drop Reason">{ticket.dropReason}</DetailItem>
        )}
      </dl>

      <section className="mt-7 border-t border-border/60 pt-6">
        <h3 className="text-sm font-semibold">Description</h3>
        <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-muted-foreground">
          {ticket.description}
        </p>
      </section>

      <section className="mt-7 border-t border-border/60 pt-6">
        <div className="flex items-center gap-2">
          <PaperclipIcon className="size-4 text-muted-foreground" aria-hidden="true" />
          <h3 className="text-sm font-semibold">Attachments</h3>
          <span className="text-xs text-muted-foreground">
            ({ticket.attachments?.length ?? 0})
          </span>
        </div>
        {ticket.attachments?.length ? (
          <ul className="mt-4 space-y-3">
            {ticket.attachments.map((attachment) => (
              <AttachmentRow key={attachment.id} attachment={attachment} />
            ))}
          </ul>
        ) : (
          <p className="mt-3 rounded-xl border border-dashed border-border/70 bg-background/35 px-4 py-5 text-center text-sm text-muted-foreground">
            No attachments.
          </p>
        )}
      </section>
    </GlassPanel>
  )
}

export default TicketDetailsPanel
