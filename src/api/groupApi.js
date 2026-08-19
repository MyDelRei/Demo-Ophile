import {
  mockGroupMemberships,
  mockGroups,
} from '../data/mock/groups.js'
import { mockUsers } from '../data/mock/users.js'

let groups = mockGroups.map((group) => ({ ...group }))
let groupMemberships = mockGroupMemberships.map((membership) => ({
  ...membership,
}))
let nextGroupId =
  groups.reduce((highest, group) => {
    const idNumber = Number.parseInt(group.id.replace('group-', ''), 10)
    return Number.isNaN(idNumber) ? highest : Math.max(highest, idNumber)
  }, 0) + 1

export const helpDeskGroupCode = 'HELPDESK'

function isHelpDeskSystemGroupRecord(group) {
  return (
    group.systemType === 'HELP_DESK' ||
    String(group.departmentCode ?? '').trim().toUpperCase() ===
      helpDeskGroupCode
  )
}

function requireOrganisationId(organisationId) {
  if (!organisationId) {
    throw new Error('Organisation is required')
  }
}

function copyGroup(group) {
  if (!group) return null

  return {
    ...group,
    departmentCode: group.departmentCode ?? '',
    headlinePhone: group.headlinePhone ?? '',
    headlineEmail: group.headlineEmail ?? '',
    system: isHelpDeskSystemGroupRecord(group),
    memberCount: groupMemberships.filter(
      (membership) => membership.groupId === group.id,
    ).length,
  }
}

function ensureHelpDeskGroupRecord(organisationId) {
  requireOrganisationId(organisationId)

  const existingGroup = groups.find(
    (group) =>
      group.organisationId === organisationId &&
      isHelpDeskSystemGroupRecord(group),
  )
  const now = new Date().toISOString()

  if (existingGroup) {
    const normalizedGroup = {
      ...existingGroup,
      name: 'Help Desk',
      departmentCode: helpDeskGroupCode,
      status: 'ACTIVE',
      systemType: 'HELP_DESK',
      updatedAt:
        existingGroup.name === 'Help Desk' &&
        existingGroup.departmentCode === helpDeskGroupCode &&
        existingGroup.status === 'ACTIVE' &&
        existingGroup.systemType === 'HELP_DESK'
          ? existingGroup.updatedAt
          : now,
    }

    groups = groups.map((group) =>
      group.id === existingGroup.id ? normalizedGroup : group,
    )
    return normalizedGroup
  }

  const group = {
    id: `group-${String(nextGroupId).padStart(3, '0')}`,
    organisationId,
    name: 'Help Desk',
    departmentCode: helpDeskGroupCode,
    headlinePhone: '',
    headlineEmail: '',
    status: 'ACTIVE',
    systemType: 'HELP_DESK',
    createdAt: now,
    updatedAt: now,
  }

  nextGroupId += 1
  groups = [...groups, group]
  return group
}

function synchronizeOrganisationHelpDeskMemberships(organisationId) {
  const helpDeskGroup = ensureHelpDeskGroupRecord(organisationId)
  const organisationUserIds = new Set(
    mockUsers
      .filter((user) => user.organisationId === organisationId)
      .map((user) => user.id),
  )
  const helpDeskUserIds = mockUsers
    .filter(
      (user) =>
        user.organisationId === organisationId && user.role === 'HELP_DESK',
    )
    .map((user) => user.id)
  const systemGroupIds = new Set(
    groups
      .filter(
        (group) =>
          group.organisationId === organisationId &&
          isHelpDeskSystemGroupRecord(group),
      )
      .map((group) => group.id),
  )

  groupMemberships = [
    ...groupMemberships.filter(
      (membership) =>
        !organisationUserIds.has(membership.userId) ||
        !systemGroupIds.has(membership.groupId),
    ),
    ...helpDeskUserIds.map((userId) => ({
      userId,
      groupId: helpDeskGroup.id,
    })),
  ]

  return helpDeskGroup
}

export async function ensureHelpDeskGroup(organisationId) {
  return copyGroup(synchronizeOrganisationHelpDeskMemberships(organisationId))
}

export async function syncHelpDeskGroupMembership(
  userId,
  organisationId,
  shouldBeMember,
) {
  requireScopedUser(userId, organisationId)
  const helpDeskGroup = ensureHelpDeskGroupRecord(organisationId)
  const systemGroupIds = new Set(
    groups
      .filter(
        (group) =>
          group.organisationId === organisationId &&
          isHelpDeskSystemGroupRecord(group),
      )
      .map((group) => group.id),
  )

  groupMemberships = [
    ...groupMemberships.filter(
      (membership) =>
        membership.userId !== userId ||
        !systemGroupIds.has(membership.groupId),
    ),
    ...(shouldBeMember ? [{ userId, groupId: helpDeskGroup.id }] : []),
  ]

  return getUserGroups(userId, organisationId)
}

function withoutPassword({ password: _password, ...user }) {
  return { ...user }
}

function findScopedGroup(groupId, organisationId) {
  requireOrganisationId(organisationId)

  return groups.find(
    (group) =>
      group.id === groupId && group.organisationId === organisationId,
  )
}

function requireScopedGroup(groupId, organisationId) {
  const group = findScopedGroup(groupId, organisationId)

  if (!group) {
    throw new Error('Group not found')
  }

  return group
}

function requireScopedUser(userId, organisationId) {
  requireOrganisationId(organisationId)

  const user = mockUsers.find(
    (candidate) =>
      candidate.id === userId &&
      candidate.organisationId === organisationId,
  )

  if (!user) {
    throw new Error('User not found')
  }

  return user
}

function requireSupportDirectoryUser(userId) {
  const user = mockUsers.find(
    (candidate) => candidate.id === userId && candidate.organisationId,
  )

  if (
    !user ||
    !user.active ||
    !['USER', 'HELP_DESK'].includes(user.role)
  ) {
    throw new Error('Support Group List access is required')
  }
  return user
}

function normalizeName(name) {
  const normalizedName = String(name ?? '').trim()

  if (!normalizedName) {
    throw new Error('Group Name is required')
  }

  return normalizedName
}

function normalizeDepartmentCode(departmentCode) {
  const normalizedCode = String(departmentCode ?? '').trim().toUpperCase()

  if (!normalizedCode) {
    throw new Error('Department Code is required')
  }

  return normalizedCode
}

function normalizeOptionalField(value) {
  return String(value ?? '').trim()
}

function departmentCodeExists(
  departmentCode,
  organisationId,
  excludedGroupId,
) {
  const normalizedCode = departmentCode.toLowerCase()

  return groups.some(
    (group) =>
      group.organisationId === organisationId &&
      group.id !== excludedGroupId &&
      group.status === 'ACTIVE' &&
      String(group.departmentCode ?? '').trim().toLowerCase() ===
        normalizedCode,
  )
}

function requireUniqueActiveDepartmentCode(
  departmentCode,
  organisationId,
  excludedGroupId,
) {
  if (departmentCodeExists(departmentCode, organisationId, excludedGroupId)) {
    throw new Error(
      'An active Group with this Department Code already exists in this Company',
    )
  }
}

export async function getGroups(organisationId) {
  requireOrganisationId(organisationId)
  synchronizeOrganisationHelpDeskMemberships(organisationId)

  return groups
    .filter((group) => group.organisationId === organisationId)
    .map(copyGroup)
}

export async function getGroupById(groupId, organisationId) {
  synchronizeOrganisationHelpDeskMemberships(organisationId)
  return copyGroup(findScopedGroup(groupId, organisationId))
}

export async function createGroup(organisationId, data) {
  requireOrganisationId(organisationId)

  const now = new Date().toISOString()
  const departmentCode = normalizeDepartmentCode(data.departmentCode)

  if (departmentCode === helpDeskGroupCode) {
    throw new Error('HELPDESK is reserved for the system Help Desk Group')
  }

  requireUniqueActiveDepartmentCode(departmentCode, organisationId)

  const group = {
    id: `group-${String(nextGroupId).padStart(3, '0')}`,
    organisationId,
    name: normalizeName(data.name),
    departmentCode,
    headlinePhone: normalizeOptionalField(data.headlinePhone),
    headlineEmail: normalizeOptionalField(data.headlineEmail),
    status: 'ACTIVE',
    createdAt: now,
    updatedAt: now,
  }

  nextGroupId += 1
  groups = [...groups, group]
  return copyGroup(group)
}

export async function updateGroup(groupId, data, organisationId) {
  const group = requireScopedGroup(groupId, organisationId)

  if (isHelpDeskSystemGroupRecord(group)) {
    throw new Error('The system Help Desk Group cannot be edited')
  }

  const departmentCode = normalizeDepartmentCode(data.departmentCode)

  if (departmentCode === helpDeskGroupCode) {
    throw new Error('HELPDESK is reserved for the system Help Desk Group')
  }

  if (group.status === 'ACTIVE') {
    requireUniqueActiveDepartmentCode(
      departmentCode,
      organisationId,
      groupId,
    )
  }

  const updatedGroup = {
    ...group,
    name: normalizeName(data.name),
    departmentCode,
    headlinePhone: normalizeOptionalField(data.headlinePhone),
    headlineEmail: normalizeOptionalField(data.headlineEmail),
    updatedAt: new Date().toISOString(),
  }

  groups = groups.map((candidate) =>
    candidate.id === groupId ? updatedGroup : candidate,
  )

  return copyGroup(updatedGroup)
}

export async function deactivateGroup(groupId, organisationId) {
  const group = requireScopedGroup(groupId, organisationId)

  if (isHelpDeskSystemGroupRecord(group)) {
    throw new Error('The system Help Desk Group cannot be deactivated')
  }

  if (group.status === 'INACTIVE') {
    return copyGroup(group)
  }

  const updatedGroup = {
    ...group,
    status: 'INACTIVE',
    updatedAt: new Date().toISOString(),
  }

  groups = groups.map((candidate) =>
    candidate.id === groupId ? updatedGroup : candidate,
  )

  return copyGroup(updatedGroup)
}

export async function activateGroup(groupId, organisationId) {
  const group = requireScopedGroup(groupId, organisationId)

  if (group.status === 'ACTIVE') {
    return copyGroup(group)
  }

  const departmentCode = String(group.departmentCode ?? '').trim()

  if (departmentCode) {
    requireUniqueActiveDepartmentCode(
      departmentCode,
      organisationId,
      groupId,
    )
  }

  const updatedGroup = {
    ...group,
    status: 'ACTIVE',
    updatedAt: new Date().toISOString(),
  }

  groups = groups.map((candidate) =>
    candidate.id === groupId ? updatedGroup : candidate,
  )

  return copyGroup(updatedGroup)
}

export async function getGroupMembers(groupId, organisationId) {
  synchronizeOrganisationHelpDeskMemberships(organisationId)
  requireScopedGroup(groupId, organisationId)

  const memberIds = new Set(
    groupMemberships
      .filter((membership) => membership.groupId === groupId)
      .map((membership) => membership.userId),
  )

  return mockUsers
    .filter(
      (user) =>
        memberIds.has(user.id) && user.organisationId === organisationId,
    )
    .map(withoutPassword)
}

export async function getUserGroups(userId, organisationId) {
  requireScopedUser(userId, organisationId)
  synchronizeOrganisationHelpDeskMemberships(organisationId)

  const userGroupIds = new Set(
    groupMemberships
      .filter((membership) => membership.userId === userId)
      .map((membership) => membership.groupId),
  )

  return groups
    .filter(
      (group) =>
        group.organisationId === organisationId && userGroupIds.has(group.id),
    )
    .sort(
      (firstGroup, secondGroup) =>
        Number(isHelpDeskSystemGroupRecord(secondGroup)) -
        Number(isHelpDeskSystemGroupRecord(firstGroup)),
    )
    .map(copyGroup)
}

export async function getSupportGroupDirectory(userId) {
  const user = requireSupportDirectoryUser(userId)
  synchronizeOrganisationHelpDeskMemberships(user.organisationId)

  return groups
    .filter(
      (group) =>
        group.organisationId === user.organisationId &&
        group.status === 'ACTIVE',
    )
    .sort((first, second) => first.name.localeCompare(second.name))
    .map((group) => {
      const memberIds = new Set(
        groupMemberships
          .filter((membership) => membership.groupId === group.id)
          .map((membership) => membership.userId),
      )
      const members = mockUsers
        .filter(
          (member) =>
            member.organisationId === user.organisationId &&
            member.active &&
            memberIds.has(member.id),
        )
        .sort((first, second) => first.name.localeCompare(second.name))
        .map((member) => ({
          id: member.id,
          name: member.name,
          position: member.position ?? '',
          telephone: member.telephone ?? '',
          email: member.email ?? '',
        }))

      return {
        id: group.id,
        name: group.name,
        departmentCode: group.departmentCode ?? '',
        headlinePhone: group.headlinePhone ?? '',
        headlineEmail: group.headlineEmail ?? '',
        system: isHelpDeskSystemGroupRecord(group),
        memberCount: members.length,
        members,
      }
    })
}

export async function setUserGroups(userId, groupIds, organisationId) {
  requireScopedUser(userId, organisationId)

  const uniqueGroupIds = [...new Set(groupIds ?? [])].filter((groupId) => {
    const group = findScopedGroup(groupId, organisationId)
    return !group || !isHelpDeskSystemGroupRecord(group)
  })
  const selectedGroups = uniqueGroupIds.map((groupId) =>
    requireScopedGroup(groupId, organisationId),
  )
  const existingGroupIds = new Set(
    groupMemberships
      .filter((membership) => membership.userId === userId)
      .map((membership) => membership.groupId),
  )

  if (
    selectedGroups.some(
      (group) =>
        !existingGroupIds.has(group.id) && group.status !== 'ACTIVE',
    )
  ) {
    throw new Error('Only active Groups can receive new members')
  }

  const scopedGroupIds = new Set(
    groups
      .filter(
        (group) =>
          group.organisationId === organisationId &&
          !isHelpDeskSystemGroupRecord(group),
      )
      .map((group) => group.id),
  )

  groupMemberships = [
    ...groupMemberships.filter(
      (membership) =>
        membership.userId !== userId ||
        !scopedGroupIds.has(membership.groupId),
    ),
    ...uniqueGroupIds.map((groupId) => ({ userId, groupId })),
  ]

  return getUserGroups(userId, organisationId)
}

export async function addUsersToGroup(
  groupId,
  userIds,
  organisationId,
) {
  const group = requireScopedGroup(groupId, organisationId)

  if (isHelpDeskSystemGroupRecord(group)) {
    throw new Error('Membership in the system Help Desk Group is role-managed')
  }

  if (group.status !== 'ACTIVE') {
    throw new Error('Inactive groups cannot receive new members')
  }

  const uniqueUserIds = [...new Set(userIds)]

  if (uniqueUserIds.length === 0) {
    throw new Error('Select at least one user')
  }

  const organisationUserIds = new Set(
    mockUsers
      .filter((user) => user.organisationId === organisationId)
      .map((user) => user.id),
  )

  if (uniqueUserIds.some((userId) => !organisationUserIds.has(userId))) {
    throw new Error('Users must belong to the same Company as the group')
  }

  const existingMemberIds = new Set(
    groupMemberships
      .filter((membership) => membership.groupId === groupId)
      .map((membership) => membership.userId),
  )
  const newMemberships = uniqueUserIds
    .filter((userId) => !existingMemberIds.has(userId))
    .map((userId) => ({ userId, groupId }))

  groupMemberships = [...groupMemberships, ...newMemberships]
  return getGroupMembers(groupId, organisationId)
}

export async function removeUserFromGroup(
  groupId,
  userId,
  organisationId,
) {
  const group = requireScopedGroup(groupId, organisationId)

  if (isHelpDeskSystemGroupRecord(group)) {
    throw new Error('Membership in the system Help Desk Group is role-managed')
  }

  const user = mockUsers.find(
    (candidate) =>
      candidate.id === userId &&
      candidate.organisationId === organisationId,
  )

  if (!user) {
    throw new Error('User not found')
  }

  groupMemberships = groupMemberships.filter(
    (membership) =>
      membership.groupId !== groupId || membership.userId !== userId,
  )

  return getGroupMembers(groupId, organisationId)
}
