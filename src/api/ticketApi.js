import {
  getGroupById,
  getGroupMembers,
  getGroups,
  getUserGroups,
} from './groupApi.js'
import {
  getActiveTicketCategories,
  getTicketCategories,
} from './ticketCategoryApi.js'
import {
  mockTicketComments,
  mockTicketHistory,
  mockTickets,
} from '../data/mock/tickets.js'
import { mockUsers } from '../data/mock/users.js'

let tickets = mockTickets.map((ticket) => ({
  ...ticket,
  attachments: (ticket.attachments ?? []).map((attachment) => ({
    ...attachment,
  })),
  solution: ticket.solution ? { ...ticket.solution } : null,
}))
let comments = mockTicketComments.map((comment) => ({ ...comment }))
let history = mockTicketHistory.map((event) => ({
  ...event,
  metadata: { ...(event.metadata ?? {}) },
}))
let nextTicketNumber = getNextNumber(tickets, 'ticket-')
let nextCommentNumber = getNextNumber(comments, 'ticket-comment-')
let nextHistoryNumber = getNextNumber(history, 'ticket-history-')

export const ticketIssueTypes = [
  'INCIDENT',
  'ENHANCEMENT',
  'NEW_REQUEST',
]

function getNextNumber(records, prefix) {
  return (
    records.reduce((highest, record) => {
      const idNumber = Number.parseInt(record.id.replace(prefix, ''), 10)
      return Number.isNaN(idNumber) ? highest : Math.max(highest, idNumber)
    }, 0) + 1
  )
}

function copyTicket(ticket) {
  return ticket
    ? {
        ...ticket,
        attachments: (ticket.attachments ?? []).map((attachment) => ({
          ...attachment,
        })),
        solution: ticket.solution ? { ...ticket.solution } : null,
        group: ticket.group ? { ...ticket.group } : null,
        category: ticket.category ? { ...ticket.category } : null,
        assignee: ticket.assignee ? { ...ticket.assignee } : null,
        requester: ticket.requester ? { ...ticket.requester } : null,
        comments: ticket.comments?.map((comment) => ({
          ...comment,
          author: comment.author ? { ...comment.author } : null,
        })),
        history: ticket.history?.map((event) => ({
          ...event,
          actor: event.actor ? { ...event.actor } : null,
          metadata: { ...(event.metadata ?? {}) },
        })),
        viewerActions: ticket.viewerActions
          ? { ...ticket.viewerActions }
          : undefined,
      }
    : null
}

function requireSupportUser(userId) {
  const user = mockUsers.find(
    (candidate) => candidate.id === userId && candidate.organisationId,
  )
  if (!user || !user.active) throw new Error('Support user not found')
  return user
}

function requireHelpDesk(userId) {
  const user = requireSupportUser(userId)
  if (user.role !== 'HELP_DESK') {
    throw new Error('Help Desk access is required')
  }
  return user
}

function requireScopedTicket(ticketId, user) {
  const ticket = tickets.find(
    (candidate) =>
      candidate.id === ticketId &&
      candidate.organisationId === user.organisationId,
  )
  if (!ticket) throw new Error('Ticket not found')
  return ticket
}

function normalizeRequired(value, label) {
  const normalizedValue = String(value ?? '').trim()
  if (!normalizedValue) throw new Error(`${label} is required`)
  return normalizedValue
}

function normalizeAttachments(attachments, ticketNumber) {
  if (!Array.isArray(attachments)) return []
  return attachments.map((attachment, index) => ({
    id: `attachment-${ticketNumber}-${index + 1}`,
    name: normalizeRequired(attachment.name, 'Attachment name'),
    size: Number.isFinite(Number(attachment.size))
      ? Number(attachment.size)
      : 0,
    type: String(attachment.type ?? 'application/octet-stream'),
  }))
}

function matchesFilters(ticket, filters) {
  const search = String(filters.search ?? '').trim().toLowerCase()
  const matchesSearch =
    !search ||
    [
      ticket.reference,
      ticket.title,
      ticket.description,
      ticket.requester?.name,
      ticket.assignee?.name,
    ].some((value) => String(value ?? '').toLowerCase().includes(search))
  const matchesStatus =
    !filters.status ||
    filters.status === 'ALL' ||
    ticket.status === filters.status
  const matchesGroup =
    !filters.groupId ||
    filters.groupId === 'ALL' ||
    ticket.groupId === filters.groupId
  const matchesCategory =
    !filters.categoryId ||
    filters.categoryId === 'ALL' ||
    ticket.categoryId === filters.categoryId
  return matchesSearch && matchesStatus && matchesGroup && matchesCategory
}

function getUserSummary(user) {
  return user ? { id: user.id, name: user.name, email: user.email } : null
}

async function decorateTickets(scopedTickets, organisationId) {
  const [groups, categories] = await Promise.all([
    getGroups(organisationId),
    getTicketCategories(organisationId),
  ])
  const groupById = new Map(groups.map((group) => [group.id, group]))
  const categoryById = new Map(
    categories.map((category) => [category.id, category]),
  )
  const userById = new Map(
    mockUsers
      .filter((user) => user.organisationId === organisationId)
      .map((user) => [user.id, user]),
  )

  return scopedTickets.map((ticket) =>
    copyTicket({
      ...ticket,
      group: groupById.get(ticket.groupId) ?? null,
      category: categoryById.get(ticket.categoryId) ?? null,
      categoryLabel:
        categoryById.get(ticket.categoryId)?.name ?? 'Unavailable Category',
      assignee: getUserSummary(userById.get(ticket.assigneeId)),
      requester: getUserSummary(userById.get(ticket.requesterId)),
      solution: ticket.solution
        ? {
            ...ticket.solution,
            resolvedBy: getUserSummary(
              userById.get(ticket.solution.resolvedById),
            ),
          }
        : null,
    }),
  )
}

async function getActiveGroupIds(user) {
  const groups = await getUserGroups(user.id, user.organisationId)
  return new Set(
    groups
      .filter((group) => group.status === 'ACTIVE')
      .map((group) => group.id),
  )
}

async function canViewTicket(user, ticket) {
  if (user.role === 'HELP_DESK') return true
  const groupIds = await getActiveGroupIds(user)
  return (
    ticket.requesterId === user.id ||
    groupIds.has(ticket.groupId) ||
    ticket.assigneeId === user.id
  )
}

async function requireTicketVisibility(user, ticket) {
  if (!(await canViewTicket(user, ticket))) {
    throw new Error('You do not have access to this ticket')
  }
}

async function isActiveGroupMember(user, groupId) {
  if (!groupId) return false
  const groupIds = await getActiveGroupIds(user)
  return groupIds.has(groupId)
}

function sortNewestFirst(ticketList) {
  return [...ticketList].sort(
    (first, second) => new Date(second.createdAt) - new Date(first.createdAt),
  )
}

async function filterAndDecorate(user, scopedTickets, filters) {
  const decoratedTickets = await decorateTickets(
    scopedTickets,
    user.organisationId,
  )
  return sortNewestFirst(
    decoratedTickets.filter((ticket) => matchesFilters(ticket, filters)),
  )
}

function updateTicketRecord(ticket, changes) {
  const updatedTicket = {
    ...ticket,
    ...changes,
    updatedAt: new Date().toISOString(),
  }
  tickets = tickets.map((candidate) =>
    candidate.id === ticket.id ? updatedTicket : candidate,
  )
  return updatedTicket
}

function recordHistory(ticketId, type, actorId, metadata = {}) {
  const event = {
    id: `ticket-history-${String(nextHistoryNumber).padStart(4, '0')}`,
    ticketId,
    type,
    actorId,
    metadata: { ...metadata },
    createdAt: new Date().toISOString(),
  }
  nextHistoryNumber += 1
  history = [...history, event]
  return event
}

async function decorateActivity(ticket, organisationId) {
  const userById = new Map(
    mockUsers
      .filter((user) => user.organisationId === organisationId)
      .map((user) => [user.id, user]),
  )
  return {
    comments: comments
      .filter((comment) => comment.ticketId === ticket.id)
      .sort((first, second) => new Date(first.createdAt) - new Date(second.createdAt))
      .map((comment) => ({
        ...comment,
        author: getUserSummary(userById.get(comment.authorId)),
      })),
    history: history
      .filter((event) => event.ticketId === ticket.id)
      .sort((first, second) => new Date(first.createdAt) - new Date(second.createdAt))
      .map((event) => ({
        ...event,
        metadata: { ...(event.metadata ?? {}) },
        actor: getUserSummary(userById.get(event.actorId)),
      })),
  }
}

async function requirePendingGroupMember(user, ticket) {
  if (ticket.status !== 'PENDING' || !ticket.groupId) {
    throw new Error('Only pending routed tickets can be assigned')
  }
  const group = await getGroupById(ticket.groupId, user.organisationId)
  if (!group || group.status !== 'ACTIVE') {
    throw new Error('The routed Group is not active')
  }
  if (!(await isActiveGroupMember(user, ticket.groupId))) {
    throw new Error('Only active members of the routed Group can assign this ticket')
  }
}

async function requirePendingAssignmentOperator(user, ticket) {
  if (ticket.status !== 'PENDING' || !ticket.groupId) {
    throw new Error('Only pending routed tickets can be assigned')
  }
  const group = await getGroupById(ticket.groupId, user.organisationId)
  if (!group || group.status !== 'ACTIVE') {
    throw new Error('The routed Group is not active')
  }
  if (
    user.role !== 'HELP_DESK' &&
    !(await isActiveGroupMember(user, ticket.groupId))
  ) {
    throw new Error('Only active members of the routed Group or Help Desk can assign this ticket')
  }
}

async function requireActiveScopedGroup(groupId, organisationId) {
  const group = await getGroupById(groupId, organisationId)
  if (!group || group.status !== 'ACTIVE') {
    throw new Error('Select an active Group from your Company')
  }
  return group
}

async function requireActiveScopedCategory(categoryId, organisationId) {
  const categories = await getActiveTicketCategories(organisationId)
  const category = categories.find((candidate) => candidate.id === categoryId)
  if (!category) {
    throw new Error('Select an active Category from your Company')
  }
  return category
}

async function getEligibleMembers(ticket, organisationId) {
  const members = await getGroupMembers(ticket.groupId, organisationId)
  return members
    .filter((member) => member.active)
    .map((member) => getUserSummary(member))
}

async function assigneeRemainsEligible(ticket, organisationId) {
  if (!ticket.assigneeId || !ticket.groupId) return false
  const members = await getEligibleMembers(ticket, organisationId)
  return members.some((member) => member.id === ticket.assigneeId)
}

export async function getTickets() {
  return tickets.map(copyTicket)
}

export async function getMyTickets(userId, filters = {}) {
  const user = requireSupportUser(userId)
  return filterAndDecorate(
    user,
    tickets.filter(
      (ticket) =>
        ticket.organisationId === user.organisationId &&
        ticket.requesterId === user.id,
    ),
    filters,
  )
}

export async function getMyGroupTickets(userId, filters = {}) {
  const user = requireSupportUser(userId)
  const groupIds = await getActiveGroupIds(user)
  return filterAndDecorate(
    user,
    tickets.filter(
      (ticket) =>
        ticket.organisationId === user.organisationId &&
        groupIds.has(ticket.groupId),
    ),
    filters,
  )
}

export async function getVisibleTicketsForUser(userId, filters = {}) {
  const user = requireSupportUser(userId)
  const groupIds = await getActiveGroupIds(user)
  return filterAndDecorate(
    user,
    tickets.filter(
      (ticket) =>
        ticket.organisationId === user.organisationId &&
        (ticket.requesterId === user.id ||
          groupIds.has(ticket.groupId) ||
          ticket.assigneeId === user.id),
    ),
    filters,
  )
}

export async function getMySupportTickets(userId, filters = {}) {
  const user = requireSupportUser(userId)
  return filterAndDecorate(
    user,
    tickets.filter(
      (ticket) =>
        ticket.organisationId === user.organisationId &&
        ticket.assigneeId === user.id,
    ),
    filters,
  )
}

export async function getHelpDeskTickets(userId, filters = {}) {
  const user = requireHelpDesk(userId)
  return filterAndDecorate(
    user,
    tickets.filter(
      (ticket) => ticket.organisationId === user.organisationId,
    ),
    filters,
  )
}

export async function getTicketByIdForUser(userId, ticketId) {
  const user = requireSupportUser(userId)
  const ticket = tickets.find(
    (candidate) =>
      candidate.id === ticketId &&
      candidate.organisationId === user.organisationId,
  )
  if (!ticket) return null
  await requireTicketVisibility(user, ticket)
  const [decoratedTicket] = await decorateTickets(
    [ticket],
    user.organisationId,
  )
  const activity = await decorateActivity(ticket, user.organisationId)
  const groupMember = await isActiveGroupMember(user, ticket.groupId)
  const helpDesk = user.role === 'HELP_DESK'

  return copyTicket({
    ...decoratedTicket,
    ...activity,
    viewerActions: {
      canAssign:
        ticket.status === 'PENDING' && (groupMember || helpDesk),
      canAssignToSelf: ticket.status === 'PENDING' && groupMember,
      canAssignTeammate:
        ticket.status === 'PENDING' && (groupMember || helpDesk),
      canResolve:
        ticket.status === 'IMPLEMENTATION' && ticket.assigneeId === user.id,
      canConfirmResolution:
        ticket.status === 'RESOLVED' && ticket.requesterId === user.id,
      canRejectResolution:
        ticket.status === 'RESOLVED' && ticket.requesterId === user.id,
      canComment: true,
      canClassify: helpDesk,
      canClassifyIssueType: helpDesk,
      canRoute: helpDesk && ticket.status === 'OPEN',
      canReroute: helpDesk && ticket.status === 'PENDING',
      canDrop:
        helpDesk && ['OPEN', 'PENDING'].includes(ticket.status),
      canCloseForRequester: helpDesk && ticket.status === 'RESOLVED',
    },
  })
}

export async function createTicket(userId, data) {
  const user = requireSupportUser(userId)
  const title = normalizeRequired(data.title, 'Ticket Title')
  const description = normalizeRequired(data.description, 'Description')
  const activeCategories = await getActiveTicketCategories(user.organisationId)
  const category = activeCategories.find(
    (candidate) => candidate.id === data.categoryId,
  )
  if (!category) throw new Error('Select an active Category')

  const now = new Date().toISOString()
  const year = new Date().getFullYear()
  const ticketNumber = nextTicketNumber
  const ticket = {
    id: `ticket-${String(ticketNumber).padStart(4, '0')}`,
    reference: `OPH-${year}-${String(ticketNumber).padStart(4, '0')}`,
    organisationId: user.organisationId,
    title,
    subject: title,
    description,
    categoryId: category.id,
    issueType: null,
    attachments: normalizeAttachments(data.attachments, ticketNumber),
    groupId: null,
    requesterId: user.id,
    status: 'OPEN',
    assigneeId: null,
    solution: null,
    createdAt: now,
    updatedAt: now,
  }
  nextTicketNumber += 1
  tickets = [...tickets, ticket]
  recordHistory(ticket.id, 'TICKET_CREATED', user.id)
  const [decoratedTicket] = await decorateTickets(
    [ticket],
    user.organisationId,
  )
  return decoratedTicket
}

export async function classifyTicket(ticketId, categoryId, userId) {
  const user = requireHelpDesk(userId)
  const ticket = requireScopedTicket(ticketId, user)
  const [category, categories] = await Promise.all([
    requireActiveScopedCategory(categoryId, user.organisationId),
    getTicketCategories(user.organisationId),
  ])
  const previousCategory = categories.find(
    (candidate) => candidate.id === ticket.categoryId,
  )

  if (ticket.classifiedAt && ticket.categoryId === category.id) {
    throw new Error('The ticket already uses this Category')
  }

  const classifiedAt = new Date().toISOString()
  const eventType = ticket.classifiedAt
    ? 'CATEGORY_CHANGED'
    : 'CATEGORY_CLASSIFIED'
  const updated = updateTicketRecord(ticket, {
    categoryId: category.id,
    classifiedById: user.id,
    classifiedAt,
  })
  recordHistory(ticket.id, eventType, user.id, {
    previousCategoryId: ticket.categoryId,
    previousCategoryName: previousCategory?.name ?? 'Unavailable Category',
    newCategoryId: category.id,
    newCategoryName: category.name,
  })
  return getTicketByIdForUser(user.id, updated.id)
}

export async function classifyIssueType(ticketId, issueTypeValue, userId) {
  const user = requireHelpDesk(userId)
  const ticket = requireScopedTicket(ticketId, user)
  const issueType = String(issueTypeValue ?? '').trim().toUpperCase()

  if (!ticketIssueTypes.includes(issueType)) {
    throw new Error('Select a valid Issue Type')
  }
  if (ticket.issueType === issueType) {
    throw new Error('The ticket already uses this Issue Type')
  }

  const previousIssueType = ticket.issueType ?? null
  const classifiedAt = new Date().toISOString()
  const updated = updateTicketRecord(ticket, {
    issueType,
    issueTypeClassifiedById: user.id,
    issueTypeClassifiedAt: classifiedAt,
  })
  recordHistory(
    ticket.id,
    previousIssueType
      ? 'ISSUE_TYPE_CHANGED'
      : 'ISSUE_TYPE_CLASSIFIED',
    user.id,
    { previousIssueType, newIssueType: issueType },
  )
  return getTicketByIdForUser(user.id, updated.id)
}

export async function routeTicket(ticketId, groupId, userId) {
  const user = requireHelpDesk(userId)
  const ticket = requireScopedTicket(ticketId, user)
  if (ticket.status !== 'OPEN') {
    throw new Error('Only OPEN tickets can be routed')
  }
  const group = await requireActiveScopedGroup(
    groupId,
    user.organisationId,
  )
  const routedAt = new Date().toISOString()
  const updated = updateTicketRecord(ticket, {
    groupId: group.id,
    status: 'PENDING',
    routedById: user.id,
    routedAt,
  })
  recordHistory(ticket.id, 'TICKET_ROUTED', user.id, {
    groupId: group.id,
    groupName: group.name,
  })
  return getTicketByIdForUser(user.id, updated.id)
}

export async function rerouteTicket(
  ticketId,
  groupId,
  reasonValue,
  userId,
) {
  const user = requireHelpDesk(userId)
  const ticket = requireScopedTicket(ticketId, user)
  if (ticket.status !== 'PENDING') {
    throw new Error('Only PENDING tickets can be re-routed')
  }
  const reason = normalizeRequired(reasonValue, 'Re-route Reason')
  const [previousGroup, nextGroup] = await Promise.all([
    getGroupById(ticket.groupId, user.organisationId),
    requireActiveScopedGroup(groupId, user.organisationId),
  ])
  if (ticket.groupId === nextGroup.id) {
    throw new Error('Select a different Group for re-routing')
  }
  const routedAt = new Date().toISOString()
  const updated = updateTicketRecord(ticket, {
    groupId: nextGroup.id,
    routedById: user.id,
    routedAt,
  })
  recordHistory(ticket.id, 'TICKET_REROUTED', user.id, {
    previousGroupId: ticket.groupId,
    previousGroupName: previousGroup?.name ?? 'Unavailable Group',
    newGroupId: nextGroup.id,
    newGroupName: nextGroup.name,
    reason,
  })
  return getTicketByIdForUser(user.id, updated.id)
}

export async function dropTicket(ticketId, reasonValue, userId) {
  const user = requireHelpDesk(userId)
  const ticket = requireScopedTicket(ticketId, user)
  if (!['OPEN', 'PENDING'].includes(ticket.status)) {
    throw new Error('Only OPEN or PENDING tickets can be dropped')
  }
  const reason = normalizeRequired(reasonValue, 'Drop Reason')
  const droppedAt = new Date().toISOString()
  const previousStatus = ticket.status
  const updated = updateTicketRecord(ticket, {
    status: 'DROPPED',
    droppedById: user.id,
    droppedAt,
    dropReason: reason,
  })
  recordHistory(ticket.id, 'TICKET_DROPPED', user.id, {
    reason,
    previousStatus,
  })
  return getTicketByIdForUser(user.id, updated.id)
}

export async function closeTicketForRequester(
  ticketId,
  reasonValue,
  userId,
) {
  const user = requireHelpDesk(userId)
  const ticket = requireScopedTicket(ticketId, user)
  if (ticket.status !== 'RESOLVED') {
    throw new Error('Only RESOLVED tickets can be closed for the requester')
  }
  const reason = normalizeRequired(reasonValue, 'Close Reason')
  const closedAt = new Date().toISOString()
  const updated = updateTicketRecord(ticket, {
    status: 'CLOSED',
    closedById: user.id,
    closedAt,
    closeReason: reason,
    closeMethod: 'HELP_DESK_OVERRIDE',
  })
  recordHistory(ticket.id, 'HELP_DESK_CLOSED_FOR_USER', user.id, {
    reason,
    closeMethod: 'HELP_DESK_OVERRIDE',
  })
  return getTicketByIdForUser(user.id, updated.id)
}

export async function getEligibleTicketAssignees(ticketId, userId) {
  const user = requireSupportUser(userId)
  const ticket = requireScopedTicket(ticketId, user)
  await requirePendingAssignmentOperator(user, ticket)
  return getEligibleMembers(ticket, user.organisationId)
}

export async function assignTicketToSelf(ticketId, userId) {
  const user = requireSupportUser(userId)
  const ticket = requireScopedTicket(ticketId, user)
  await requirePendingGroupMember(user, ticket)
  const updated = updateTicketRecord(ticket, {
    assigneeId: user.id,
    status: 'IMPLEMENTATION',
  })
  recordHistory(ticket.id, 'ASSIGNED_TO_SUPPORTER', user.id, {
    assigneeId: user.id,
    assigneeName: user.name,
  })
  recordHistory(ticket.id, 'IMPLEMENTATION_STARTED', user.id)
  return getTicketByIdForUser(user.id, updated.id)
}

export async function assignTicketToTeammate(
  ticketId,
  teammateId,
  userId,
) {
  const user = requireSupportUser(userId)
  const ticket = requireScopedTicket(ticketId, user)
  await requirePendingAssignmentOperator(user, ticket)
  if (teammateId === user.id) {
    throw new Error('Use Assign to Me for your own assignment')
  }
  const members = await getEligibleMembers(ticket, user.organisationId)
  const teammate = members.find((member) => member.id === teammateId)
  if (!teammate) {
    throw new Error('Select an active teammate from the routed Group')
  }
  const updated = updateTicketRecord(ticket, {
    assigneeId: teammate.id,
    status: 'IMPLEMENTATION',
  })
  recordHistory(ticket.id, 'ASSIGNED_TO_TEAMMATE', user.id, {
    assigneeId: teammate.id,
    assigneeName: teammate.name,
  })
  recordHistory(ticket.id, 'IMPLEMENTATION_STARTED', teammate.id)
  return getTicketByIdForUser(user.id, updated.id)
}

export async function markTicketResolved(ticketId, userId, solutionText) {
  const user = requireSupportUser(userId)
  const ticket = requireScopedTicket(ticketId, user)
  if (ticket.status !== 'IMPLEMENTATION' || ticket.assigneeId !== user.id) {
    throw new Error('Only the assigned supporter can resolve this ticket')
  }
  const solution = normalizeRequired(solutionText, 'Solution')
  const resolvedAt = new Date().toISOString()
  const updated = updateTicketRecord(ticket, {
    status: 'RESOLVED',
    solution: {
      text: solution,
      resolvedById: user.id,
      resolvedAt,
    },
  })
  recordHistory(ticket.id, 'MARKED_RESOLVED', user.id)
  return getTicketByIdForUser(user.id, updated.id)
}

export async function confirmTicketResolution(ticketId, userId) {
  const user = requireSupportUser(userId)
  const ticket = requireScopedTicket(ticketId, user)
  if (ticket.status !== 'RESOLVED' || ticket.requesterId !== user.id) {
    throw new Error('Only the requester can confirm this resolution')
  }
  const closedAt = new Date().toISOString()
  const updated = updateTicketRecord(ticket, {
    status: 'CLOSED',
    closedById: user.id,
    closedAt,
    closeMethod: 'REQUESTER_CONFIRMATION',
  })
  recordHistory(ticket.id, 'REQUESTER_CONFIRMED', user.id, {
    closeMethod: 'REQUESTER_CONFIRMATION',
  })
  return getTicketByIdForUser(user.id, updated.id)
}

export async function rejectTicketResolution(ticketId, userId, reasonValue) {
  const user = requireSupportUser(userId)
  const ticket = requireScopedTicket(ticketId, user)
  if (ticket.status !== 'RESOLVED' || ticket.requesterId !== user.id) {
    throw new Error('Only the requester can reject this resolution')
  }
  if (!(await assigneeRemainsEligible(ticket, user.organisationId))) {
    throw new Error('The assigned supporter is no longer eligible for this Group')
  }
  const reason = normalizeRequired(reasonValue, 'Reason')
  const updated = updateTicketRecord(ticket, {
    status: 'IMPLEMENTATION',
    solution: null,
  })
  recordHistory(ticket.id, 'RESOLUTION_REJECTED', user.id, { reason })
  recordHistory(ticket.id, 'IMPLEMENTATION_STARTED', ticket.assigneeId)
  return getTicketByIdForUser(user.id, updated.id)
}

export async function addTicketComment(ticketId, userId, commentValue) {
  const user = requireSupportUser(userId)
  const ticket = requireScopedTicket(ticketId, user)
  await requireTicketVisibility(user, ticket)
  const commentText = normalizeRequired(commentValue, 'Comment')
  const comment = {
    id: `ticket-comment-${String(nextCommentNumber).padStart(4, '0')}`,
    ticketId,
    authorId: user.id,
    comment: commentText,
    createdAt: new Date().toISOString(),
  }
  nextCommentNumber += 1
  comments = [...comments, comment]
  recordHistory(ticketId, 'COMMENT_ADDED', user.id)
  return getTicketByIdForUser(user.id, ticketId)
}
