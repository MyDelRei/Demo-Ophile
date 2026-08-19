import { useEffect, useState } from 'react'
import {
  ArrowLeftIcon,
  CheckCircle2Icon,
  CircleOffIcon,
  LockIcon,
  RouteIcon,
  ShieldAlertIcon,
  TagIcon,
  TagsIcon,
  UserRoundPlusIcon,
  UsersRoundIcon,
} from 'lucide-react'
import { Link, useParams } from 'react-router-dom'

import {
  addTicketComment,
  assignTicketToSelf,
  assignTicketToTeammate,
  classifyIssueType,
  classifyTicket,
  closeTicketForRequester,
  confirmTicketResolution,
  dropTicket,
  getEligibleTicketAssignees,
  getTicketByIdForUser,
  markTicketResolved,
  rejectTicketResolution,
  rerouteTicket,
  routeTicket,
} from '@/api/ticketApi'
import { getGroups } from '@/api/groupApi'
import { getActiveTicketCategories } from '@/api/ticketCategoryApi'
import GlassPanel from '@/components/glass/GlassPanel'
import SupportPageShell from '@/components/support/SupportPageShell'
import TicketContentTabs from '@/components/support/TicketContentTabs'
import TicketDetailsPanel from '@/components/support/TicketDetailsPanel'
import TicketProgressTimeline from '@/components/support/TicketProgressTimeline'
import TicketStatusBadge from '@/components/support/TicketStatusBadge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/hooks/useAuth'
import { useAppFeedback } from '@/hooks/useAppFeedback'

function TicketUnavailable({ message }) {
  return (
    <GlassPanel className="mx-auto max-w-xl py-12 text-center">
      <ShieldAlertIcon className="mx-auto size-10 text-muted-foreground" />
      <h1 className="mt-4 text-xl font-semibold">Ticket unavailable</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {message || 'This ticket could not be found or is not available to you.'}
      </p>
      <Button
        render={<Link to="/support/tickets" />}
        nativeButton={false}
        variant="outline"
        className="mt-6"
      >
        <ArrowLeftIcon />
        Back to Tickets
      </Button>
    </GlassPanel>
  )
}

function TicketDetailPage() {
  const { ticketId } = useParams()
  const { user } = useAuth()
  const { hideLoading, showLoading, showNotification } = useAppFeedback()
  const [ticket, setTicket] = useState(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('comments')
  const [comment, setComment] = useState('')
  const [teammateDialogOpen, setTeammateDialogOpen] = useState(false)
  const [teammates, setTeammates] = useState([])
  const [teammateId, setTeammateId] = useState('')
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false)
  const [solution, setSolution] = useState('')
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [classifyDialogOpen, setClassifyDialogOpen] = useState(false)
  const [categories, setCategories] = useState([])
  const [categoryId, setCategoryId] = useState('')
  const [issueTypeDialogOpen, setIssueTypeDialogOpen] = useState(false)
  const [issueType, setIssueType] = useState('')
  const [routeDialogOpen, setRouteDialogOpen] = useState(false)
  const [isRerouting, setIsRerouting] = useState(false)
  const [groups, setGroups] = useState([])
  const [groupId, setGroupId] = useState('')
  const [rerouteReason, setRerouteReason] = useState('')
  const [dropDialogOpen, setDropDialogOpen] = useState(false)
  const [dropReason, setDropReason] = useState('')
  const [closeForUserDialogOpen, setCloseForUserDialogOpen] = useState(false)
  const [closeReason, setCloseReason] = useState('')

  useEffect(() => {
    let isActive = true
    getTicketByIdForUser(user.id, ticketId)
      .then((result) => {
        if (!isActive) return
        if (!result) {
          setError('This ticket could not be found or is not available to you.')
        } else {
          setTicket(result)
        }
      })
      .catch((requestError) => {
        if (isActive) {
          setError(requestError.message || 'This ticket is not available to you.')
        }
      })
      .finally(() => {
        if (isActive) setIsLoading(false)
      })
    return () => {
      isActive = false
    }
  }, [ticketId, user.id])

  async function handleAssignToMe() {
    showLoading('Assigning ticket...')
    try {
      setTicket(await assignTicketToSelf(ticket.id, user.id))
      showNotification('Ticket assigned to you successfully.')
    } catch (requestError) {
      showNotification(requestError.message || 'Unable to assign ticket.', 'error')
    } finally {
      hideLoading()
    }
  }

  async function openTeammateDialog() {
    showLoading('Loading eligible teammates...')
    try {
      const eligible = await getEligibleTicketAssignees(ticket.id, user.id)
      setTeammates(eligible.filter((teammate) => teammate.id !== user.id))
      setTeammateId('')
      setTeammateDialogOpen(true)
    } catch (requestError) {
      showNotification(requestError.message || 'Unable to load teammates.', 'error')
    } finally {
      hideLoading()
    }
  }

  async function handleAssignTeammate(event) {
    event.preventDefault()
    showLoading('Assigning ticket...')
    try {
      setTicket(
        await assignTicketToTeammate(ticket.id, teammateId, user.id),
      )
      setTeammateDialogOpen(false)
      showNotification('Ticket assigned to teammate successfully.')
    } catch (requestError) {
      showNotification(requestError.message || 'Unable to assign ticket.', 'error')
    } finally {
      hideLoading()
    }
  }

  async function handleResolve(event) {
    event.preventDefault()
    showLoading('Marking ticket resolved...')
    try {
      setTicket(await markTicketResolved(ticket.id, user.id, solution))
      setResolveDialogOpen(false)
      setSolution('')
      setActiveTab('solution')
      showNotification('Ticket marked as resolved successfully.')
    } catch (requestError) {
      showNotification(requestError.message || 'Unable to resolve ticket.', 'error')
    } finally {
      hideLoading()
    }
  }

  async function handleConfirmResolution() {
    showLoading('Closing ticket...')
    try {
      setTicket(await confirmTicketResolution(ticket.id, user.id))
      setConfirmDialogOpen(false)
      showNotification('Resolution confirmed. Ticket closed successfully.')
    } catch (requestError) {
      showNotification(requestError.message || 'Unable to close ticket.', 'error')
    } finally {
      hideLoading()
    }
  }

  async function handleRejectResolution(event) {
    event.preventDefault()
    showLoading('Returning ticket to implementation...')
    try {
      setTicket(
        await rejectTicketResolution(
          ticket.id,
          user.id,
          rejectionReason,
        ),
      )
      setRejectDialogOpen(false)
      setRejectionReason('')
      showNotification('Resolution rejected. Ticket returned to implementation.')
    } catch (requestError) {
      showNotification(
        requestError.message || 'Unable to reject resolution.',
        'error',
      )
    } finally {
      hideLoading()
    }
  }

  async function handleComment(event) {
    event.preventDefault()
    showLoading('Adding comment...')
    try {
      setTicket(await addTicketComment(ticket.id, user.id, comment))
      setComment('')
      showNotification('Comment added successfully.')
    } catch (requestError) {
      showNotification(requestError.message || 'Unable to add comment.', 'error')
    } finally {
      hideLoading()
    }
  }

  async function openClassifyDialog() {
    showLoading('Loading active categories...')
    try {
      const activeCategories = await getActiveTicketCategories(
        user.organisationId,
      )
      setCategories(activeCategories)
      setCategoryId(ticket.categoryId ?? '')
      setClassifyDialogOpen(true)
    } catch (requestError) {
      showNotification(
        requestError.message || 'Unable to load Categories.',
        'error',
      )
    } finally {
      hideLoading()
    }
  }

  async function handleClassify(event) {
    event.preventDefault()
    showLoading('Classifying ticket...')
    try {
      setTicket(await classifyTicket(ticket.id, categoryId, user.id))
      setClassifyDialogOpen(false)
      showNotification('Ticket category updated successfully.')
    } catch (requestError) {
      showNotification(
        requestError.message || 'Unable to classify ticket.',
        'error',
      )
    } finally {
      hideLoading()
    }
  }

  async function handleClassifyIssueType(event) {
    event.preventDefault()
    showLoading('Classifying Issue Type...')
    try {
      setTicket(await classifyIssueType(ticket.id, issueType, user.id))
      setIssueTypeDialogOpen(false)
      showNotification('Issue Type classified successfully.')
    } catch (requestError) {
      showNotification(
        requestError.message || 'Unable to classify Issue Type.',
        'error',
      )
    } finally {
      hideLoading()
    }
  }

  async function openRouteDialog(rerouting) {
    showLoading('Loading active Groups...')
    try {
      const companyGroups = await getGroups(user.organisationId)
      setGroups(companyGroups.filter((group) => group.status === 'ACTIVE'))
      setGroupId('')
      setRerouteReason('')
      setIsRerouting(rerouting)
      setRouteDialogOpen(true)
    } catch (requestError) {
      showNotification(
        requestError.message || 'Unable to load Groups.',
        'error',
      )
    } finally {
      hideLoading()
    }
  }

  async function handleRoute(event) {
    event.preventDefault()
    showLoading(isRerouting ? 'Re-routing ticket...' : 'Routing ticket...')
    try {
      const updatedTicket = isRerouting
        ? await rerouteTicket(
            ticket.id,
            groupId,
            rerouteReason,
            user.id,
          )
        : await routeTicket(ticket.id, groupId, user.id)
      setTicket(updatedTicket)
      setRouteDialogOpen(false)
      showNotification(
        isRerouting
          ? 'Ticket re-routed successfully.'
          : 'Ticket routed successfully.',
      )
    } catch (requestError) {
      showNotification(
        requestError.message || 'Unable to route ticket.',
        'error',
      )
    } finally {
      hideLoading()
    }
  }

  async function handleDrop(event) {
    event.preventDefault()
    showLoading('Dropping ticket...')
    try {
      setTicket(await dropTicket(ticket.id, dropReason, user.id))
      setDropDialogOpen(false)
      setDropReason('')
      showNotification('Ticket dropped. Its history has been preserved.')
    } catch (requestError) {
      showNotification(
        requestError.message || 'Unable to drop ticket.',
        'error',
      )
    } finally {
      hideLoading()
    }
  }

  async function handleCloseForUser(event) {
    event.preventDefault()
    showLoading('Closing ticket for requester...')
    try {
      setTicket(
        await closeTicketForRequester(ticket.id, closeReason, user.id),
      )
      setCloseForUserDialogOpen(false)
      setCloseReason('')
      showNotification('Ticket closed with a Help Desk override.')
    } catch (requestError) {
      showNotification(
        requestError.message || 'Unable to close ticket for requester.',
        'error',
      )
    } finally {
      hideLoading()
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-80 items-center justify-center text-sm text-muted-foreground">
        Loading ticket...
      </div>
    )
  }
  if (!ticket || error) return <TicketUnavailable message={error} />

  const hasTicketActions =
    ticket.viewerActions.canAssign ||
    ticket.viewerActions.canResolve ||
    ticket.viewerActions.canConfirmResolution ||
    ticket.viewerActions.canRejectResolution ||
    ticket.viewerActions.canClassify ||
    ticket.viewerActions.canClassifyIssueType ||
    ticket.viewerActions.canRoute ||
    ticket.viewerActions.canReroute ||
    ticket.viewerActions.canDrop ||
    ticket.viewerActions.canCloseForRequester

  return (
    <SupportPageShell
      title="Ticket Detail"
      description={ticket.reference}
      action={
        <Button
          render={<Link to="/support/tickets" />}
          nativeButton={false}
          variant="outline"
        >
          <ArrowLeftIcon />
          Tickets
        </Button>
      }
    >
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(20rem,2fr)]">
        <TicketDetailsPanel ticket={ticket} />

        <GlassPanel className="min-w-0 lg:sticky lg:top-6">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/60 pb-5">
            <div>
              <h2 className="text-lg font-semibold">Progress Details</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Lifecycle summary and current ownership.
              </p>
            </div>
            <TicketStatusBadge status={ticket.status} />
          </div>

          <div className="mt-6">
            <TicketProgressTimeline ticket={ticket} />
          </div>

          {hasTicketActions && (
            <section className="mt-7 border-t border-border/60 pt-6">
              <h3 className="text-sm font-semibold">Ticket Actions</h3>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Available actions are based on your access and the current status.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {ticket.viewerActions.canClassify && (
                  <Button variant="outline" onClick={openClassifyDialog}>
                    <TagIcon />
                    Classify Ticket
                  </Button>
                )}
                {ticket.viewerActions.canClassifyIssueType && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIssueType(ticket.issueType ?? '')
                      setIssueTypeDialogOpen(true)
                    }}
                  >
                    <TagsIcon />
                    Classify Issue Type
                  </Button>
                )}
                {ticket.viewerActions.canRoute && (
                  <Button onClick={() => openRouteDialog(false)}>
                    <RouteIcon />
                    Route Ticket
                  </Button>
                )}
                {ticket.viewerActions.canReroute && (
                  <Button variant="outline" onClick={() => openRouteDialog(true)}>
                    <RouteIcon />
                    Re-route Ticket
                  </Button>
                )}
                {ticket.viewerActions.canAssignToSelf && (
                  <Button onClick={handleAssignToMe}>
                    <UserRoundPlusIcon />
                    Assign to Me
                  </Button>
                )}
                {ticket.viewerActions.canAssignTeammate && (
                  <Button variant="outline" onClick={openTeammateDialog}>
                    <UsersRoundIcon />
                    Assign Teammate
                  </Button>
                )}
                {ticket.viewerActions.canResolve && (
                  <Button onClick={() => setResolveDialogOpen(true)}>
                    <CheckCircle2Icon />
                    Mark Resolved
                  </Button>
                )}
                {ticket.viewerActions.canConfirmResolution && (
                  <Button onClick={() => setConfirmDialogOpen(true)}>
                    <CheckCircle2Icon />
                    Confirm Resolved
                  </Button>
                )}
                {ticket.viewerActions.canRejectResolution && (
                  <Button variant="outline" onClick={() => setRejectDialogOpen(true)}>
                    Still Not Resolved
                  </Button>
                )}
                {ticket.viewerActions.canCloseForRequester && (
                  <Button
                    variant="outline"
                    onClick={() => setCloseForUserDialogOpen(true)}
                  >
                    <LockIcon />
                    Close for User
                  </Button>
                )}
                {ticket.viewerActions.canDrop && (
                  <Button
                    variant="destructive"
                    onClick={() => setDropDialogOpen(true)}
                  >
                    <CircleOffIcon />
                    Drop Ticket
                  </Button>
                )}
              </div>
            </section>
          )}
        </GlassPanel>
      </div>

      <TicketContentTabs
        ticket={ticket}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        comment={comment}
        onCommentChange={setComment}
        onCommentSubmit={handleComment}
      />

      <Dialog open={classifyDialogOpen} onOpenChange={setClassifyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Classify Ticket</DialogTitle>
            <DialogDescription>
              Select an active Category from this Company. Categories are managed by Organisation Admins.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleClassify}>
            <div className="space-y-2">
              <Label htmlFor="ticket-classification">Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId} required>
                <SelectTrigger
                  id="ticket-classification"
                  className="w-full"
                  aria-label="Select ticket Category"
                >
                  <SelectValue>
                    {categoryId
                      ? categories.find((category) => category.id === categoryId)?.name
                      : 'Select Category'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setClassifyDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!categoryId}>
                Save Classification
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={issueTypeDialogOpen} onOpenChange={setIssueTypeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Classify Issue Type</DialogTitle>
            <DialogDescription>
              Issue Type describes whether this ticket is an incident, an improvement, or a request for something new.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleClassifyIssueType}>
            <div className="space-y-2">
              <Label htmlFor="ticket-issue-type">Issue Type</Label>
              <Select value={issueType} onValueChange={setIssueType} required>
                <SelectTrigger
                  id="ticket-issue-type"
                  className="w-full"
                  aria-label="Select Issue Type"
                >
                  <SelectValue>
                    {{
                      INCIDENT: 'Incident',
                      ENHANCEMENT: 'Enhancement',
                      NEW_REQUEST: 'New Request',
                    }[issueType] ?? 'Select Issue Type'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INCIDENT">
                    Incident — something is broken
                  </SelectItem>
                  <SelectItem value="ENHANCEMENT">
                    Enhancement — improve something existing
                  </SelectItem>
                  <SelectItem value="NEW_REQUEST">
                    New Request — request something new
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIssueTypeDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!issueType}>
                Save Issue Type
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={routeDialogOpen} onOpenChange={setRouteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isRerouting ? 'Re-route Ticket' : 'Route Ticket'}</DialogTitle>
            <DialogDescription>
              {isRerouting
                ? 'Move this pending ticket to a different active Company Group.'
                : 'Route this open ticket to an active Company Group. The ticket will become pending.'}
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleRoute}>
            <div className="space-y-2">
              <Label htmlFor="ticket-route-group">Group</Label>
              <Select value={groupId} onValueChange={setGroupId} required>
                <SelectTrigger
                  id="ticket-route-group"
                  className="w-full"
                  aria-label="Select routed Group"
                >
                  <SelectValue>
                    {groupId
                      ? groups.find((group) => group.id === groupId)?.name
                      : 'Select Group'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {groups
                    .filter(
                      (group) => !isRerouting || group.id !== ticket.groupId,
                    )
                    .map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            {isRerouting && (
              <div className="space-y-2">
                <Label htmlFor="ticket-reroute-reason">Re-route Reason</Label>
                <Textarea
                  id="ticket-reroute-reason"
                  className="min-h-28"
                  value={rerouteReason}
                  onChange={(event) => setRerouteReason(event.target.value)}
                  placeholder="Explain why this ticket needs a different Group..."
                  required
                />
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRouteDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!groupId}>
                {isRerouting ? 'Re-route Ticket' : 'Route Ticket'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={dropDialogOpen} onOpenChange={setDropDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Drop Ticket</DialogTitle>
            <DialogDescription>
              This does not delete the ticket. It will remain visible with its reason and complete history.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleDrop}>
            <div className="space-y-2">
              <Label htmlFor="ticket-drop-reason">Drop Reason</Label>
              <Textarea
                id="ticket-drop-reason"
                className="min-h-28"
                value={dropReason}
                onChange={(event) => setDropReason(event.target.value)}
                placeholder="For example: duplicate request or request withdrawn..."
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDropDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="destructive">
                Drop Ticket
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={closeForUserDialogOpen}
        onOpenChange={setCloseForUserDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Close for User</DialogTitle>
            <DialogDescription>
              This Help Desk override closes a resolved ticket without requester confirmation and will be recorded distinctly.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleCloseForUser}>
            <div className="space-y-2">
              <Label htmlFor="ticket-close-reason">Close Reason</Label>
              <Textarea
                id="ticket-close-reason"
                className="min-h-28"
                value={closeReason}
                onChange={(event) => setCloseReason(event.target.value)}
                placeholder="Explain why Help Desk is closing this ticket for the requester..."
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCloseForUserDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Close for User</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={teammateDialogOpen} onOpenChange={setTeammateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Teammate</DialogTitle>
            <DialogDescription>
              Select an active member of {ticket.group?.name}.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleAssignTeammate}>
            <div className="space-y-2">
              <Label htmlFor="ticket-teammate">Teammate</Label>
              <Select value={teammateId} onValueChange={setTeammateId} required>
                <SelectTrigger id="ticket-teammate" className="w-full" aria-label="Select teammate">
                  <SelectValue>
                    {teammateId
                      ? teammates.find((teammate) => teammate.id === teammateId)?.name
                      : 'Select teammate'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {teammates.map((teammate) => (
                    <SelectItem key={teammate.id} value={teammate.id}>{teammate.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {teammates.length === 0 && (
                <p className="text-xs text-muted-foreground">No other active teammates are available.</p>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setTeammateDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={!teammateId}>Assign Ticket</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Ticket Resolved</DialogTitle>
            <DialogDescription>Provide the solution for the requester to review.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleResolve}>
            <div className="space-y-2">
              <Label htmlFor="ticket-solution">Solution</Label>
              <Textarea id="ticket-solution" className="min-h-32" value={solution} onChange={(event) => setSolution(event.target.value)} placeholder="Explain how the problem was solved..." required />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setResolveDialogOpen(false)}>Cancel</Button>
              <Button type="submit">Mark Resolved</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Resolution</DialogTitle>
            <DialogDescription>Confirm that the solution resolved your problem. This will close the ticket.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleConfirmResolution}>Confirm and Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Still Not Resolved</DialogTitle>
            <DialogDescription>Explain what is still not working. The ticket will return to implementation.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleRejectResolution}>
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Reason</Label>
              <Textarea id="rejection-reason" className="min-h-28" value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} placeholder="Describe what still needs attention..." required />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
              <Button type="submit">Return to Implementation</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </SupportPageShell>
  )
}

export default TicketDetailPage
