import {
  mockAccessChanges,
  mockPredefinedPermissions,
  mockRoleCapabilityGroups,
  mockRoleDefinitions,
  mockUserPermissions,
} from '../data/mock/permissions.js'
import { mockUsers } from '../data/mock/users.js'

let userPermissions = mockUserPermissions.map((item) => ({ ...item }))
let accessChanges = mockAccessChanges.map((item) => ({ ...item }))
let nextAccessChangeId = accessChanges.length + 1

function copyItem(item) {
  return item ? { ...item } : null
}

function requireOrganisationId(organisationId) {
  if (!organisationId) throw new Error('Organisation is required')
}

function requireScopedUser(userId, organisationId) {
  requireOrganisationId(organisationId)

  const user = mockUsers.find(
    (candidate) =>
      candidate.id === userId &&
      candidate.organisationId === organisationId,
  )

  if (!user) throw new Error('User not found')
  return user
}

export function requireOrganisationAccessManager(
  actingUserId,
  organisationId,
) {
  const actingUser = requireScopedUser(actingUserId, organisationId)

  if (actingUser.role !== 'ORGANISATION_ADMIN') {
    throw new Error('Organisation Admin access is required')
  }

  return actingUser
}

function normalizePermissionKeys(permissions) {
  const validKeys = new Set(mockPredefinedPermissions.map((item) => item.key))
  const uniqueKeys = [...new Set(permissions ?? [])]

  if (uniqueKeys.some((key) => !validKeys.has(key))) {
    throw new Error('Select only predefined permissions')
  }

  for (const definition of mockPredefinedPermissions) {
    if (!uniqueKeys.includes(definition.key)) continue

    const missingDependency = definition.requires.find(
      (requiredKey) => !uniqueKeys.includes(requiredKey),
    )

    if (missingDependency) {
      const dependency = mockPredefinedPermissions.find(
        (item) => item.key === missingDependency,
      )
      throw new Error(
        `${definition.label} requires ${dependency?.label ?? missingDependency}`,
      )
    }
  }

  return uniqueKeys
}

function addAccessChange({
  actingUser,
  changeType,
  newValue,
  permission,
  previousValue,
  user,
}) {
  const change = {
    id: `access-change-${String(nextAccessChangeId).padStart(3, '0')}`,
    organisationId: user.organisationId,
    userId: user.id,
    userName: user.name,
    changedByUserId: actingUser.id,
    changedByName: actingUser.name,
    changeType,
    permission: permission ?? '',
    previousValue,
    newValue,
    createdAt: new Date().toISOString(),
  }

  nextAccessChangeId += 1
  accessChanges = [change, ...accessChanges]
  return copyItem(change)
}

export async function getPredefinedPermissions() {
  return mockPredefinedPermissions.map((item) => ({
    ...item,
    requires: [...item.requires],
  }))
}

export async function getAssignableRoleDefinitions() {
  return mockRoleDefinitions.map(copyItem)
}

export async function getRoleCapabilityGroups() {
  return mockRoleCapabilityGroups.map((group) => ({
    ...group,
    roles: [...group.roles],
    capabilities: [...group.capabilities],
  }))
}

export async function getUserPermissions(userId, organisationId) {
  requireScopedUser(userId, organisationId)

  return userPermissions
    .filter((item) => item.userId === userId && item.enabled)
    .map(copyItem)
}

export async function getEffectiveAdditionalPermissionKeys(
  userId,
  organisationId,
) {
  return (await getUserPermissions(userId, organisationId)).map(
    (item) => item.permission,
  )
}

export async function getEffectivePermissions(userId, organisationId) {
  const user = requireScopedUser(userId, organisationId)
  const additionalPermissionKeys =
    await getEffectiveAdditionalPermissionKeys(userId, organisationId)
  const inheritedGroups = mockRoleCapabilityGroups.filter((group) =>
    group.roles.includes(user.role),
  )

  return {
    userId,
    role: user.role,
    inheritedCapabilityGroups: inheritedGroups.map((group) => ({
      key: group.key,
      label: group.label,
      capabilities: [...group.capabilities],
    })),
    additionalPermissions: mockPredefinedPermissions
      .filter((item) => additionalPermissionKeys.includes(item.key))
      .map(copyItem),
    portalAccess:
      user.role === 'ORGANISATION_ADMIN'
        ? ['ADMIN', 'SUPPORT']
        : ['SUPPORT'],
  }
}

export async function updateUserPermissions(
  userId,
  permissions,
  organisationId,
  actingUserId,
) {
  const user = requireScopedUser(userId, organisationId)
  const actingUser = requireOrganisationAccessManager(
    actingUserId,
    organisationId,
  )
  const permissionKeys = normalizePermissionKeys(permissions)
  const previousKeys = new Set(
    userPermissions
      .filter((item) => item.userId === userId && item.enabled)
      .map((item) => item.permission),
  )
  const nextKeys = new Set(permissionKeys)

  userPermissions = [
    ...userPermissions.filter((item) => item.userId !== userId),
    ...permissionKeys.map((permission) => ({
      userId,
      permission,
      enabled: true,
    })),
  ]

  for (const definition of mockPredefinedPermissions) {
    const wasEnabled = previousKeys.has(definition.key)
    const isEnabled = nextKeys.has(definition.key)

    if (wasEnabled === isEnabled) continue

    addAccessChange({
      actingUser,
      changeType: isEnabled
        ? 'PERMISSION_ENABLED'
        : 'PERMISSION_DISABLED',
      previousValue: isEnabled ? 'No' : 'Yes',
      newValue: isEnabled ? 'Yes' : 'No',
      permission: definition.key,
      user,
    })
  }

  return getUserPermissions(userId, organisationId)
}

export async function recordRoleChange(
  userId,
  previousRole,
  newRole,
  organisationId,
  actingUserId,
) {
  const user = requireScopedUser(userId, organisationId)

  if (previousRole === newRole) return null

  const actingUser = requireOrganisationAccessManager(
    actingUserId,
    organisationId,
  )

  return addAccessChange({
    actingUser,
    changeType: 'ROLE_CHANGED',
    previousValue: previousRole,
    newValue: newRole,
    user,
  })
}

export async function getAccessChanges(
  organisationId,
  { limit = 10, userId } = {},
) {
  requireOrganisationId(organisationId)
  if (userId) requireScopedUser(userId, organisationId)

  return accessChanges
    .filter(
      (change) =>
        change.organisationId === organisationId &&
        (!userId || change.userId === userId),
    )
    .sort((first, second) =>
      second.createdAt.localeCompare(first.createdAt),
    )
    .slice(0, limit)
    .map(copyItem)
}

export async function getUsersWithAdditionalPermissionsCount(
  organisationId,
) {
  requireOrganisationId(organisationId)
  const organisationUserIds = new Set(
    mockUsers
      .filter((user) => user.organisationId === organisationId)
      .map((user) => user.id),
  )

  return new Set(
    userPermissions
      .filter(
        (item) => item.enabled && organisationUserIds.has(item.userId),
      )
      .map((item) => item.userId),
  ).size
}
