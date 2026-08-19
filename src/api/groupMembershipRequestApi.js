import {
  addUsersToGroup,
  getGroupById,
  getGroupMembers,
} from './groupApi.js'
import { mockGroupMembershipRequests } from '../data/mock/groupMembershipRequests.js'
import { mockUsers } from '../data/mock/users.js'

let membershipRequests = mockGroupMembershipRequests.map((request) => ({
  ...request,
}))
let nextRequestNumber =
  membershipRequests.reduce((highest, request) => {
    const value = Number.parseInt(
      request.id.replace('group-membership-request-', ''),
      10,
    )
    return Number.isNaN(value) ? highest : Math.max(highest, value)
  }, 0) + 1

function getUser(userId) {
  return mockUsers.find((candidate) => candidate.id === userId)
}

function requireActiveUser(userId) {
  const user = getUser(userId)
  if (!user || !user.active || !user.organisationId) {
    throw new Error('Active Company user not found')
  }
  return user
}

function requireHelpDesk(userId) {
  const user = requireActiveUser(userId)
  if (user.role !== 'HELP_DESK') {
    throw new Error('Help Desk access is required')
  }
  return user
}

function requireOrganisationAdmin(userId) {
  const user = requireActiveUser(userId)
  if (user.role !== 'ORGANISATION_ADMIN') {
    throw new Error('Organisation Admin access is required')
  }
  return user
}

function requireRequestViewer(userId) {
  const user = requireActiveUser(userId)
  if (!['HELP_DESK', 'ORGANISATION_ADMIN'].includes(user.role)) {
    throw new Error('Membership request access is required')
  }
  return user
}

function getSafeUser(user) {
  return user
    ? {
        id: user.id,
        name: user.name,
        position: user.position ?? '',
        telephone: user.telephone ?? '',
        email: user.email ?? '',
      }
    : null
}

async function requireActiveScopedGroup(groupId, organisationId) {
  const group = await getGroupById(groupId, organisationId)
  if (!group || group.status !== 'ACTIVE') {
    throw new Error('Select an active Group from your Company')
  }
  if (group.system) {
    throw new Error('System Help Desk Group membership is role-managed')
  }
  return group
}

function requireScopedRequest(requestId, organisationId) {
  const request = membershipRequests.find(
    (candidate) =>
      candidate.id === requestId &&
      candidate.organisationId === organisationId,
  )
  if (!request) throw new Error('Membership request not found')
  return request
}

async function decorateRequest(request) {
  const group = await getGroupById(request.groupId, request.organisationId)
  return {
    ...request,
    group: group
      ? {
          id: group.id,
          name: group.name,
          departmentCode: group.departmentCode,
        }
      : null,
    user: getSafeUser(getUser(request.userId)),
    requester: getSafeUser(getUser(request.requestedBy)),
    reviewer: getSafeUser(getUser(request.reviewedBy)),
  }
}

async function decorateRequests(requests) {
  return Promise.all(requests.map(decorateRequest))
}

export async function getMembershipRequestCandidates(
  groupId,
  actingUserId,
  filters = {},
) {
  const actingUser = requireHelpDesk(actingUserId)
  await requireActiveScopedGroup(groupId, actingUser.organisationId)
  const members = await getGroupMembers(groupId, actingUser.organisationId)
  const memberIds = new Set(members.map((member) => member.id))
  const pendingUserIds = new Set(
    membershipRequests
      .filter(
        (request) =>
          request.organisationId === actingUser.organisationId &&
          request.groupId === groupId &&
          request.status === 'PENDING_APPROVAL',
      )
      .map((request) => request.userId),
  )
  const search = String(filters.search ?? '').trim().toLowerCase()

  return mockUsers
    .filter(
      (user) =>
        user.organisationId === actingUser.organisationId &&
        user.active &&
        !memberIds.has(user.id) &&
        !pendingUserIds.has(user.id),
    )
    .filter(
      (user) =>
        !search ||
        [user.name, user.email, user.position].some((value) =>
          String(value ?? '').toLowerCase().includes(search),
        ),
    )
    .sort((first, second) => first.name.localeCompare(second.name))
    .map(getSafeUser)
}

export async function createMembershipRequest(
  groupId,
  userId,
  actingUserId,
) {
  const actingUser = requireHelpDesk(actingUserId)
  const group = await requireActiveScopedGroup(
    groupId,
    actingUser.organisationId,
  )
  const requestedUser = requireActiveUser(userId)
  if (requestedUser.organisationId !== actingUser.organisationId) {
    throw new Error('Select an active user from your Company')
  }

  const members = await getGroupMembers(group.id, actingUser.organisationId)
  if (members.some((member) => member.id === requestedUser.id)) {
    throw new Error('User is already a member of this Group')
  }
  const duplicatePending = membershipRequests.some(
    (request) =>
      request.organisationId === actingUser.organisationId &&
      request.groupId === group.id &&
      request.userId === requestedUser.id &&
      request.status === 'PENDING_APPROVAL',
  )
  if (duplicatePending) {
    throw new Error('Membership request already pending.')
  }

  const request = {
    id: `group-membership-request-${String(nextRequestNumber).padStart(4, '0')}`,
    organisationId: actingUser.organisationId,
    groupId: group.id,
    userId: requestedUser.id,
    requestedBy: actingUser.id,
    status: 'PENDING_APPROVAL',
    requestedAt: new Date().toISOString(),
    reviewedBy: null,
    reviewedAt: null,
    rejectionReason: '',
  }
  nextRequestNumber += 1
  membershipRequests = [...membershipRequests, request]
  return decorateRequest(request)
}

export async function getPendingMembershipRequests(actingUserId) {
  const actingUser = requireRequestViewer(actingUserId)
  return decorateRequests(
    membershipRequests
      .filter(
        (request) =>
          request.organisationId === actingUser.organisationId &&
          request.status === 'PENDING_APPROVAL',
      )
      .sort(
        (first, second) =>
          new Date(first.requestedAt) - new Date(second.requestedAt),
      ),
  )
}

export async function approveMembershipRequest(requestId, actingUserId) {
  const actingUser = requireOrganisationAdmin(actingUserId)
  const request = requireScopedRequest(requestId, actingUser.organisationId)
  if (request.status !== 'PENDING_APPROVAL') {
    throw new Error('Only pending membership requests can be approved')
  }
  await requireActiveScopedGroup(request.groupId, actingUser.organisationId)
  const requestedUser = requireActiveUser(request.userId)
  if (requestedUser.organisationId !== actingUser.organisationId) {
    throw new Error('Requested user does not belong to your Company')
  }

  await addUsersToGroup(
    request.groupId,
    [requestedUser.id],
    actingUser.organisationId,
  )
  const updated = {
    ...request,
    status: 'APPROVED',
    reviewedBy: actingUser.id,
    reviewedAt: new Date().toISOString(),
    rejectionReason: '',
  }
  membershipRequests = membershipRequests.map((candidate) =>
    candidate.id === request.id ? updated : candidate,
  )
  return decorateRequest(updated)
}

export async function rejectMembershipRequest(
  requestId,
  rejectionReasonValue,
  actingUserId,
) {
  const actingUser = requireOrganisationAdmin(actingUserId)
  const request = requireScopedRequest(requestId, actingUser.organisationId)
  if (request.status !== 'PENDING_APPROVAL') {
    throw new Error('Only pending membership requests can be rejected')
  }
  const rejectionReason = String(rejectionReasonValue ?? '').trim()
  if (!rejectionReason) throw new Error('Rejection Reason is required')

  const updated = {
    ...request,
    status: 'REJECTED',
    reviewedBy: actingUser.id,
    reviewedAt: new Date().toISOString(),
    rejectionReason,
  }
  membershipRequests = membershipRequests.map((candidate) =>
    candidate.id === request.id ? updated : candidate,
  )
  return decorateRequest(updated)
}
