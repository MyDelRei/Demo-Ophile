import { mockGroupMemberships, mockGroups } from './groups.js'
import { mockTicketCategories } from './ticketCategories.js'
import { mockUsers } from './users.js'

const ticketStatuses = [
  'OPEN',
  'PENDING',
  'IMPLEMENTATION',
  'RESOLVED',
  'CLOSED',
  'DROPPED',
]

const ticketIssueTypes = [null, 'INCIDENT', 'ENHANCEMENT', 'NEW_REQUEST']

const ticketSubjects = [
  'Unable to access the support portal',
  'Password reset assistance',
  'Account permission review',
  'Ticket assignment question',
  'User profile update request',
  'Support access problem',
  'Notification settings question',
  'Company account support request',
  'Login troubleshooting',
  'General technical assistance',
]

const ticketDescriptions = [
  'The problem started this morning and is preventing normal work. Please review the account and advise on the next step.',
  'I have tried the usual troubleshooting steps but the problem is still occurring. Assistance would be appreciated.',
  'The current access does not match what is needed for the daily workflow. Please check the account configuration.',
  'This request affects the team. The details above describe the current behaviour.',
]

function getLocalDateStamp(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getCompanyUsers(companyId) {
  return mockUsers.filter((user) => user.organisationId === companyId)
}

function getCompanyGroups(companyId) {
  return mockGroups.filter(
    (group) =>
      group.organisationId === companyId &&
      group.status === 'ACTIVE' &&
      group.systemType !== 'HELP_DESK',
  )
}

function getCompanyCategories(companyId) {
  return mockTicketCategories.filter(
    (category) => category.organisationId === companyId,
  )
}

function getActiveGroupMember(groupId, companyUsers) {
  const memberIds = new Set(
    mockGroupMemberships
      .filter((membership) => membership.groupId === groupId)
      .map((membership) => membership.userId),
  )
  return companyUsers.find((user) => user.active && memberIds.has(user.id))
}

function getCompanyOneParticipants(ticketIndex) {
  const records = [
    { requesterId: 'user-004', groupId: null, assigneeId: null, status: 'OPEN' },
    { requesterId: 'user-002', groupId: 'group-003', assigneeId: null, status: 'PENDING' },
    { requesterId: 'user-002', groupId: 'group-004', assigneeId: 'user-004', status: 'IMPLEMENTATION' },
    { requesterId: 'user-004', groupId: 'group-004', assigneeId: 'user-002', status: 'RESOLVED' },
    { requesterId: 'user-002', groupId: 'group-004', assigneeId: 'user-004', status: 'CLOSED' },
    { requesterId: 'user-003', groupId: 'group-001', assigneeId: null, status: 'PENDING' },
    { requesterId: 'user-006', groupId: 'group-002', assigneeId: 'user-005', status: 'IMPLEMENTATION' },
    { requesterId: 'user-006', groupId: 'group-001', assigneeId: null, status: 'DROPPED' },
  ]
  return records[ticketIndex]
}

function getParticipants(companyNumber, ticketIndex, companyUsers, companyGroups) {
  if (companyNumber === 1) return getCompanyOneParticipants(ticketIndex)

  const requester = companyUsers[ticketIndex % Math.max(companyUsers.length, 1)]
  const group = companyGroups[ticketIndex % Math.max(companyGroups.length, 1)]
  if (!group) {
    return {
      requesterId: requester?.id,
      groupId: null,
      assigneeId: null,
      status: 'OPEN',
    }
  }

  const status = ticketStatuses[ticketIndex % ticketStatuses.length]
  const needsAssignee = ['IMPLEMENTATION', 'RESOLVED', 'CLOSED'].includes(status)
  const assignee = needsAssignee
    ? getActiveGroupMember(group.id, companyUsers)
    : null

  return {
    requesterId: requester?.id,
    groupId: status === 'OPEN' ? null : group.id,
    assigneeId: assignee?.id ?? null,
    status: needsAssignee && !assignee ? 'PENDING' : status,
  }
}

function createTickets() {
  const records = []
  const today = getLocalDateStamp()
  let sequence = 1

  for (let companyNumber = 1; companyNumber <= 24; companyNumber += 1) {
    const organisationId = `organisation-${String(companyNumber).padStart(3, '0')}`
    const companyUsers = getCompanyUsers(organisationId)
    const companyGroups = getCompanyGroups(organisationId)
    const companyCategories = getCompanyCategories(organisationId)

    for (let ticketIndex = 0; ticketIndex < 8; ticketIndex += 1) {
      const month = String(((companyNumber + ticketIndex) % 8) + 1).padStart(2, '0')
      const day = String(3 + ((companyNumber * 2 + ticketIndex * 3) % 23)).padStart(2, '0')
      const createdDate = ticketIndex === 0 ? today : `2026-${month}-${day}`
      const participants = getParticipants(
        companyNumber,
        ticketIndex,
        companyUsers,
        companyGroups,
      )
      const title = ticketSubjects[(companyNumber + ticketIndex) % ticketSubjects.length]
      const timestamp = `${createdDate}T${String(8 + (ticketIndex % 9)).padStart(2, '0')}:15:00.000Z`
      const resolved = ['RESOLVED', 'CLOSED'].includes(participants.status)
      const dropped = participants.status === 'DROPPED'
      const helpDesk = companyUsers.find(
        (candidate) => candidate.active && candidate.role === 'HELP_DESK',
      )
      const issueType = ticketIssueTypes[ticketIndex % ticketIssueTypes.length]

      records.push({
        id: `ticket-${String(sequence).padStart(4, '0')}`,
        reference: `OPH-2026-${String(sequence).padStart(4, '0')}`,
        organisationId,
        title,
        subject: title,
        description: ticketDescriptions[(companyNumber + ticketIndex) % ticketDescriptions.length],
        categoryId: companyCategories[(companyNumber + ticketIndex) % companyCategories.length].id,
        issueType,
        issueTypeClassifiedById: issueType ? helpDesk?.id : null,
        issueTypeClassifiedAt: issueType ? timestamp : null,
        attachments: [],
        groupId: participants.groupId,
        requesterId: participants.requesterId,
        status: participants.status,
        assigneeId: participants.assigneeId,
        routedById: participants.groupId ? helpDesk?.id : null,
        routedAt: participants.groupId ? timestamp : null,
        solution: resolved
          ? {
              text: 'The account configuration was corrected and verified with the affected workflow.',
              resolvedById: participants.assigneeId,
              resolvedAt: timestamp,
            }
          : null,
        droppedById: dropped ? helpDesk?.id : null,
        droppedAt: dropped ? timestamp : null,
        dropReason: dropped
          ? 'This request is a duplicate of an existing support ticket.'
          : '',
        createdAt: timestamp,
        updatedAt: timestamp,
      })

      sequence += 1
    }
  }

  return records
}

export const mockTickets = createTickets()

export const mockTicketComments = [
  {
    id: 'ticket-comment-0001',
    ticketId: 'ticket-0003',
    authorId: 'user-002',
    comment: 'The access problem affects the monthly reporting workflow.',
    createdAt: '2026-04-11T09:20:00.000Z',
  },
  {
    id: 'ticket-comment-0002',
    ticketId: 'ticket-0003',
    authorId: 'user-004',
    comment: 'I am reviewing the account configuration now.',
    createdAt: '2026-04-11T09:35:00.000Z',
  },
  {
    id: 'ticket-comment-0003',
    ticketId: 'ticket-0004',
    authorId: 'user-002',
    comment: 'The requested update has been completed and is ready for confirmation.',
    createdAt: '2026-05-14T11:10:00.000Z',
  },
]

function createHistory() {
  const history = []
  let sequence = 1

  function add(ticket, type, actorId, createdAt, metadata = {}) {
    history.push({
      id: `ticket-history-${String(sequence).padStart(4, '0')}`,
      ticketId: ticket.id,
      type,
      actorId,
      metadata,
      createdAt,
    })
    sequence += 1
  }

  mockTickets.forEach((ticket) => {
    add(ticket, 'TICKET_CREATED', ticket.requesterId, ticket.createdAt)
    if (ticket.issueType) {
      add(
        ticket,
        'ISSUE_TYPE_CLASSIFIED',
        ticket.issueTypeClassifiedById,
        ticket.issueTypeClassifiedAt,
        { previousIssueType: null, newIssueType: ticket.issueType },
      )
    }
    if (ticket.groupId) {
      add(ticket, 'TICKET_ROUTED', ticket.routedById ?? ticket.requesterId, ticket.createdAt, {
        groupId: ticket.groupId,
        groupName: mockGroups.find((group) => group.id === ticket.groupId)?.name,
      })
    }
    if (ticket.assigneeId) {
      add(ticket, 'ASSIGNED_TO_SUPPORTER', ticket.assigneeId, ticket.createdAt, {
        assigneeId: ticket.assigneeId,
        assigneeName: mockUsers.find((user) => user.id === ticket.assigneeId)?.name,
      })
      add(ticket, 'IMPLEMENTATION_STARTED', ticket.assigneeId, ticket.createdAt)
    }
    if (ticket.solution) {
      add(ticket, 'MARKED_RESOLVED', ticket.assigneeId, ticket.solution.resolvedAt)
    }
    if (ticket.status === 'CLOSED') {
      add(ticket, 'TICKET_CLOSED', ticket.requesterId, ticket.updatedAt)
    }
    if (ticket.status === 'DROPPED') {
      add(ticket, 'TICKET_DROPPED', ticket.droppedById, ticket.droppedAt, {
        reason: ticket.dropReason,
        previousStatus: ticket.groupId ? 'PENDING' : 'OPEN',
      })
    }
  })

  return history
}

export const mockTicketHistory = createHistory()
