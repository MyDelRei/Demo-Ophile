import { mockUsers } from '../data/mock/users.js'
import { getEffectiveAdditionalPermissionKeys } from './permissionApi.js'

const sessionKey = 'ophile-current-user'
let currentUser = null

function withoutPassword({ password: _password, ...user }) {
  return user
}

function getSessionStorage() {
  return typeof window === 'undefined' ? null : window.sessionStorage
}

function restoreStoredUser() {
  const storedUser = getSessionStorage()?.getItem(sessionKey)
  return storedUser ? JSON.parse(storedUser) : null
}

async function hydrateUser(user) {
  const sourceUser =
    mockUsers.find((candidate) => candidate.id === user?.id) ?? user

  if (!sourceUser) return null

  const permissions = sourceUser.organisationId
    ? await getEffectiveAdditionalPermissionKeys(
        sourceUser.id,
        sourceUser.organisationId,
      )
    : []

  return withoutPassword({ ...sourceUser, permissions })
}

function storeCurrentUser(user) {
  if (user) {
    getSessionStorage()?.setItem(sessionKey, JSON.stringify(user))
  }
}

export async function login(loginId, password) {
  const normalizedLoginId = String(loginId ?? '').trim().toLowerCase()
  const user = mockUsers.find(
    (candidate) =>
      candidate.loginId.toLowerCase() === normalizedLoginId &&
      candidate.password === password,
  )

  if (!user || !user.active) {
    throw new Error('Invalid login ID or password')
  }

  currentUser = await hydrateUser(user)
  storeCurrentUser(currentUser)
  return { ...currentUser }
}

export async function logout() {
  currentUser = null
  getSessionStorage()?.removeItem(sessionKey)
}

export async function getCurrentUser() {
  currentUser ??= restoreStoredUser()
  currentUser = await hydrateUser(currentUser)
  storeCurrentUser(currentUser)
  return currentUser ? { ...currentUser } : null
}

export async function refreshCurrentUser() {
  return getCurrentUser()
}
