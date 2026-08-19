import {
  ensureHelpDeskGroup,
  getUserGroups,
  setUserGroups,
  syncHelpDeskGroupMembership,
} from './groupApi.js'
import { getOrganisationById } from './organisationApi.js'
import {
  recordRoleChange,
  requireOrganisationAccessManager,
} from './permissionApi.js'
import { mockUsers } from '../data/mock/users.js'

const assignableRoles = ['USER', 'HELP_DESK', 'ORGANISATION_ADMIN']
const identityTypes = ['', 'NATIONAL_ID', 'PASSPORT']

function copyUser({ password: _password, ...user }) {
  const nameParts = String(user.name ?? '').trim().split(/\s+/)

  return {
    ...user,
    firstName: user.firstName ?? nameParts[0] ?? '',
    lastName: user.lastName ?? nameParts.slice(1).join(' '),
    telephone: user.telephone ?? '',
    updatedAt: user.updatedAt ?? user.createdAt,
  }
}

function requireOrganisationId(organisationId) {
  if (!organisationId) {
    throw new Error('Organisation is required')
  }
}

function findScopedUser(userId, organisationId) {
  requireOrganisationId(organisationId)

  return mockUsers.find(
    (user) =>
      user.id === userId && user.organisationId === organisationId,
  )
}

function requireScopedUser(userId, organisationId) {
  const user = findScopedUser(userId, organisationId)

  if (!user) {
    throw new Error('User not found')
  }

  return user
}

function requireScopedHelpDeskUser(userId, organisationId) {
  const user = requireScopedUser(userId, organisationId)

  if (user.role !== 'HELP_DESK') {
    throw new Error('Help Desk user not found')
  }

  return user
}

function normalizeRequired(value, label) {
  const normalizedValue = String(value ?? '').trim()

  if (!normalizedValue) {
    throw new Error(`${label} is required`)
  }

  return normalizedValue
}

function normalizeOptional(value) {
  return String(value ?? '').trim()
}

function normalizeLoginId(loginId) {
  return normalizeRequired(loginId, 'Login ID').toLowerCase()
}

function requireUniqueLoginId(loginId, excludedUserId) {
  const exists = mockUsers.some(
    (user) =>
      user.id !== excludedUserId &&
      user.loginId.toLowerCase() === loginId.toLowerCase(),
  )

  if (exists) {
    throw new Error('This Login ID is already in use')
  }
}

function normalizeRole(role) {
  if (!assignableRoles.includes(role)) {
    throw new Error('Select a valid user role')
  }

  return role
}

function normalizeIdentityType(identityType) {
  const value = identityType ?? ''

  if (!identityTypes.includes(value)) {
    throw new Error('Select a valid ID Type')
  }

  return value
}

function generateUserId() {
  const highestUserId = mockUsers.reduce((highest, user) => {
    const idNumber = Number.parseInt(user.id.replace('user-', ''), 10)
    return Number.isNaN(idNumber) ? highest : Math.max(highest, idNumber)
  }, 0)

  return `user-${String(highestUserId + 1).padStart(3, '0')}`
}

async function withGroups(user, organisationId) {
  return {
    ...copyUser(user),
    groups: await getUserGroups(user.id, organisationId),
  }
}

export async function getUsers() {
  return mockUsers.map(copyUser)
}

export async function getOrganisationUsers(organisationId, filters = {}) {
  requireOrganisationId(organisationId)
  await ensureHelpDeskGroup(organisationId)

  const organisationUsers = await Promise.all(
    mockUsers
      .filter((user) => user.organisationId === organisationId)
      .map((user) => withGroups(user, organisationId)),
  )
  const search = String(filters.search ?? '').trim().toLowerCase()

  return organisationUsers.filter((user) => {
    const matchesSearch =
      !search ||
      [
        user.firstName,
        user.lastName,
        user.name,
        user.loginId,
        user.email,
        user.telephone,
        user.position,
      ].some((value) => String(value ?? '').toLowerCase().includes(search))
    const matchesRole = !filters.role || user.role === filters.role
    const matchesStatus =
      !filters.status ||
      (filters.status === 'ACTIVE' ? user.active : !user.active)
    const matchesGroup =
      !filters.groupId ||
      user.groups.some((group) => group.id === filters.groupId)

    return matchesSearch && matchesRole && matchesStatus && matchesGroup
  })
}

export async function getUserById(userId, organisationId) {
  const user = findScopedUser(userId, organisationId)

  if (!user) return null

  await syncHelpDeskGroupMembership(
    userId,
    organisationId,
    user.role === 'HELP_DESK',
  )
  return withGroups(user, organisationId)
}

export async function getHelpDeskUsers(organisationId, filters = {}) {
  return getOrganisationUsers(organisationId, {
    ...filters,
    role: 'HELP_DESK',
  })
}

export async function getHelpDeskUserById(userId, organisationId) {
  const user = findScopedUser(userId, organisationId)

  if (!user || user.role !== 'HELP_DESK') return null

  return getUserById(userId, organisationId)
}

export async function createUser(organisationId, data) {
  requireOrganisationId(organisationId)

  if (!(await getOrganisationById(organisationId))) {
    throw new Error('Company not found')
  }

  const loginId = normalizeLoginId(data.loginId)
  requireUniqueLoginId(loginId)

  const firstName = normalizeRequired(data.firstName, 'First Name')
  const lastName = normalizeRequired(data.lastName, 'Last Name')
  const now = new Date().toISOString()
  const user = {
    id: generateUserId(),
    organisationId,
    loginId,
    firstName,
    lastName,
    name: `${firstName} ${lastName}`,
    birthDate: normalizeOptional(data.birthDate),
    currentAddress: normalizeOptional(data.currentAddress),
    identityType: normalizeIdentityType(data.identityType),
    telephone: normalizeRequired(data.telephone, 'Telephone'),
    email: normalizeRequired(data.email, 'Email').toLowerCase(),
    position: normalizeOptional(data.position),
    role: normalizeRole(data.role),
    active: data.active ?? true,
    password: 'demo123',
    photo: '',
    createdAt: now,
    updatedAt: now,
  }

  mockUsers.push(user)

  try {
    await setUserGroups(
      user.id,
      data.groupIds ?? [],
      organisationId,
    )
    await syncHelpDeskGroupMembership(
      user.id,
      organisationId,
      user.role === 'HELP_DESK',
    )
  } catch (error) {
    mockUsers.splice(mockUsers.indexOf(user), 1)
    throw error
  }

  return getUserById(user.id, organisationId)
}

export async function createHelpDeskUser(organisationId, data) {
  const { groupIds: _groupIds, ...helpDeskData } = data

  return createUser(organisationId, {
    ...helpDeskData,
    role: 'HELP_DESK',
  })
}

export async function updateUser(
  userId,
  data,
  organisationId,
  actingUserId,
) {
  const user = requireScopedUser(userId, organisationId)
  const loginId = normalizeLoginId(data.loginId)
  const role = normalizeRole(data.role)
  requireUniqueLoginId(loginId, userId)

  if (userId === actingUserId && role !== user.role) {
    throw new Error('You cannot change your own system role')
  }

  if (role !== user.role) {
    requireOrganisationAccessManager(actingUserId, organisationId)
  }

  const firstName = normalizeRequired(data.firstName, 'First Name')
  const lastName = normalizeRequired(data.lastName, 'Last Name')
  const updatedUser = {
    ...user,
    loginId,
    firstName,
    lastName,
    name: `${firstName} ${lastName}`,
    birthDate: normalizeOptional(data.birthDate),
    currentAddress: normalizeOptional(data.currentAddress),
    identityType: normalizeIdentityType(data.identityType),
    telephone: normalizeRequired(data.telephone, 'Telephone'),
    email: normalizeRequired(data.email, 'Email').toLowerCase(),
    position: normalizeOptional(data.position),
    role,
    active: data.active ?? user.active,
    updatedAt: new Date().toISOString(),
  }

  if (Object.hasOwn(data, 'groupIds')) {
    await setUserGroups(userId, data.groupIds, organisationId)
  }

  const userIndex = mockUsers.indexOf(user)
  mockUsers[userIndex] = updatedUser
  await syncHelpDeskGroupMembership(
    userId,
    organisationId,
    role === 'HELP_DESK',
  )
  await recordRoleChange(
    userId,
    user.role,
    role,
    organisationId,
    actingUserId,
  )
  return getUserById(userId, organisationId)
}

export async function updateUserRole(
  userId,
  roleValue,
  organisationId,
  actingUserId,
) {
  const user = requireScopedUser(userId, organisationId)
  const role = normalizeRole(roleValue)

  if (userId === actingUserId && role !== user.role) {
    throw new Error('You cannot change your own system role')
  }

  requireOrganisationAccessManager(actingUserId, organisationId)

  if (role === user.role) return getUserById(userId, organisationId)

  const previousRole = user.role
  const updatedUser = {
    ...user,
    role,
    updatedAt: new Date().toISOString(),
  }

  mockUsers[mockUsers.indexOf(user)] = updatedUser
  await syncHelpDeskGroupMembership(
    userId,
    organisationId,
    role === 'HELP_DESK',
  )
  await recordRoleChange(
    userId,
    previousRole,
    role,
    organisationId,
    actingUserId,
  )
  return getUserById(userId, organisationId)
}

export async function updateHelpDeskUser(userId, data, organisationId) {
  requireScopedHelpDeskUser(userId, organisationId)
  const { groupIds: _groupIds, ...helpDeskData } = data

  return updateUser(
    userId,
    {
      ...helpDeskData,
      role: 'HELP_DESK',
    },
    organisationId,
  )
}

async function updateUserStatus(userId, active, organisationId) {
  const user = requireScopedUser(userId, organisationId)

  if (user.active === active) {
    return getUserById(userId, organisationId)
  }

  const updatedUser = {
    ...user,
    active,
    updatedAt: new Date().toISOString(),
  }
  mockUsers[mockUsers.indexOf(user)] = updatedUser
  return getUserById(userId, organisationId)
}

export async function activateUser(userId, organisationId) {
  return updateUserStatus(userId, true, organisationId)
}

export async function deactivateUser(userId, organisationId) {
  return updateUserStatus(userId, false, organisationId)
}

export async function activateHelpDeskUser(userId, organisationId) {
  requireScopedHelpDeskUser(userId, organisationId)
  return activateUser(userId, organisationId)
}

export async function deactivateHelpDeskUser(userId, organisationId) {
  requireScopedHelpDeskUser(userId, organisationId)
  return deactivateUser(userId, organisationId)
}

export async function getOrganisationAdmins(organisationId) {
  return mockUsers
    .filter(
      (user) =>
        user.organisationId === organisationId &&
        user.role === 'ORGANISATION_ADMIN',
    )
    .map(copyUser)
}

export async function getOrganisationAdminById(organisationId, userId) {
  const user = mockUsers.find(
    (candidate) =>
      candidate.id === userId &&
      candidate.organisationId === organisationId &&
      candidate.role === 'ORGANISATION_ADMIN',
  )

  return user ? copyUser(user) : null
}

export async function createOrganisationAdmin(organisationId, data) {
  const loginId = normalizeLoginId(data.loginId)
  requireUniqueLoginId(loginId)

  const firstName = normalizeRequired(data.firstName, 'First Name')
  const lastName = normalizeRequired(data.lastName, 'Last Name')
  const now = new Date().toISOString()
  const user = {
    id: generateUserId(),
    name: `${firstName} ${lastName}`,
    firstName,
    lastName,
    loginId,
    email: normalizeRequired(data.email, 'Email').toLowerCase(),
    telephone: normalizeOptional(data.telephone),
    password: data.password,
    birthDate: data.birthDate || '',
    currentAddress: normalizeOptional(data.currentAddress),
    position: normalizeOptional(data.position),
    identityType: data.identityType,
    photo: data.photo || '',
    role: 'ORGANISATION_ADMIN',
    organisationId,
    active: data.active ?? true,
    createdAt: now,
    updatedAt: now,
  }

  mockUsers.push(user)
  return copyUser(user)
}
