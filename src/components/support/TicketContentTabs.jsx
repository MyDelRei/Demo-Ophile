import {
  HistoryIcon,
  LightbulbIcon,
  MessageSquareIcon,
  SendIcon,
} from 'lucide-react'

import GlassPanel from '@/components/glass/GlassPanel'
import TicketHistoryList from '@/components/support/TicketHistoryList'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { formatTicketDateTime } from '@/lib/supportTicketUtils'
import { cn } from '@/lib/utils'

const contentTabs = [
  { value: 'comments', label: 'Comments', icon: MessageSquareIcon },
  { value: 'solution', label: 'Solution', icon: LightbulbIcon },
  { value: 'history', label: 'Ticket History', icon: HistoryIcon },
]

function CommentsContent({ ticket, comment, onCommentChange, onCommentSubmit }) {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        {ticket.comments.length === 0 ? (
          <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            No comments have been added yet.
          </p>
        ) : (
          ticket.comments.map((entry) => (
            <article
              key={entry.id}
              className="rounded-xl border border-border/60 bg-background/55 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium">
                  {entry.author?.name ?? 'Unknown User'}
                </p>
                <time
                  className="text-xs text-muted-foreground"
                  dateTime={entry.createdAt}
                >
                  {formatTicketDateTime(entry.createdAt)}
                </time>
              </div>
              <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-muted-foreground">
                {entry.comment}
              </p>
            </article>
          ))
        )}
      </div>

      {ticket.viewerActions.canComment && (
        <form
          className="space-y-3 border-t border-border/60 pt-5"
          onSubmit={onCommentSubmit}
        >
          <Label htmlFor="ticket-comment">Add Comment</Label>
          <Textarea
            id="ticket-comment"
            className="min-h-28 bg-background/80"
            placeholder="Write a comment..."
            value={comment}
            onChange={(event) => onCommentChange(event.target.value)}
            required
          />
          <Button type="submit">
            <SendIcon aria-hidden="true" />
            Add Comment
          </Button>
        </form>
      )}
    </div>
  )
}

function SolutionContent({ solution }) {
  if (!solution) {
    return (
      <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
        No solution has been provided yet.
      </p>
    )
  }

  return (
    <section className="rounded-xl border border-emerald-200/80 bg-emerald-50/55 p-5 dark:border-emerald-800/70 dark:bg-emerald-950/25">
      <div className="flex items-center gap-2 font-semibold">
        <LightbulbIcon className="size-5 text-emerald-700 dark:text-emerald-300" aria-hidden="true" />
        <h3>Solution</h3>
      </div>
      <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7 text-foreground/85">
        {solution.text}
      </p>
      <dl className="mt-5 grid gap-4 border-t border-emerald-200/70 pt-4 sm:grid-cols-2 dark:border-emerald-800/70">
        {solution.resolvedBy?.name && (
          <div>
            <dt className="text-xs text-muted-foreground">Resolved By</dt>
            <dd className="mt-1 text-sm font-medium">{solution.resolvedBy.name}</dd>
          </div>
        )}
        {solution.resolvedAt && (
          <div>
            <dt className="text-xs text-muted-foreground">Resolved Date</dt>
            <dd className="mt-1 text-sm font-medium">
              {formatTicketDateTime(solution.resolvedAt)}
            </dd>
          </div>
        )}
      </dl>
    </section>
  )
}

function TicketContentTabs({
  ticket,
  activeTab,
  onTabChange,
  comment,
  onCommentChange,
  onCommentSubmit,
}) {
  return (
    <GlassPanel className="overflow-hidden p-0">
      <nav className="border-b border-border/60 p-3" aria-label="Ticket content">
        <div className="grid grid-cols-3 gap-1" role="tablist">
          {contentTabs.map((tab) => {
            const Icon = tab.icon
            const selected = activeTab === tab.value
            return (
              <button
                key={tab.value}
                id={`ticket-tab-${tab.value}`}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls={`ticket-panel-${tab.value}`}
                className={cn(
                  'flex min-w-0 items-center justify-center gap-2 rounded-lg px-2 py-2.5 text-center text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 sm:px-3 sm:text-sm',
                  selected
                    ? 'bg-foreground text-background'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
                onClick={() => onTabChange(tab.value)}
              >
                <Icon className="hidden size-4 sm:block" aria-hidden="true" />
                <span className="break-words">{tab.label}</span>
              </button>
            )
          })}
        </div>
      </nav>

      <div
        id={`ticket-panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`ticket-tab-${activeTab}`}
        className="p-5 sm:p-6"
      >
        {activeTab === 'comments' && (
          <CommentsContent
            ticket={ticket}
            comment={comment}
            onCommentChange={onCommentChange}
            onCommentSubmit={onCommentSubmit}
          />
        )}
        {activeTab === 'solution' && <SolutionContent solution={ticket.solution} />}
        {activeTab === 'history' && (
          <TicketHistoryList history={ticket.history} ticket={ticket} />
        )}
      </div>
    </GlassPanel>
  )
}

export default TicketContentTabs
