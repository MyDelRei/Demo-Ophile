import { mockOrganisations } from '../data/mock/organisations.js'
import {
  defaultOrganisationBackgroundId,
  organisationBackgroundIds,
} from '../lib/organisationBackgroundOptions.js'

let organisations = mockOrganisations.map((organisation) => ({
  ...organisation,
}))
let nextOrganisationId = organisations.length + 1
const organisationAppearances = new Map()
const appearanceStoragePrefix = 'ophile-organisation-appearance-'

function requireOrganisation(id) {
  const organisation = organisations.find((candidate) => candidate.id === id)

  if (!organisation) {
    throw new Error('Company not found')
  }

  return organisation
}

function getAppearanceStorage() {
  return typeof window === 'undefined' ? null : window.localStorage
}

function getAppearanceStorageKey(organisationId) {
  return `${appearanceStoragePrefix}${organisationId}`
}

function isSupportedBackground(backgroundId) {
  return organisationBackgroundIds.includes(backgroundId)
}

function copyOrganisation(organisation) {
  return organisation ? { ...organisation } : null
}

export async function getOrganisations() {
  return organisations.map(copyOrganisation)
}

export async function getOrganisationById(id) {
  return copyOrganisation(
    organisations.find((organisation) => organisation.id === id),
  )
}

export async function getOrganisationAppearance(organisationId) {
  requireOrganisation(organisationId)

  const storedBackgroundId = getAppearanceStorage()?.getItem(
    getAppearanceStorageKey(organisationId),
  )
  const backgroundId =
    organisationAppearances.get(organisationId) ??
    (isSupportedBackground(storedBackgroundId)
      ? storedBackgroundId
      : defaultOrganisationBackgroundId)

  organisationAppearances.set(organisationId, backgroundId)
  return { organisationId, backgroundId }
}

export async function updateOrganisationAppearance(
  organisationId,
  data,
) {
  requireOrganisation(organisationId)

  if (!isSupportedBackground(data.backgroundId)) {
    throw new Error('Select a valid Organisation background')
  }

  organisationAppearances.set(organisationId, data.backgroundId)
  getAppearanceStorage()?.setItem(
    getAppearanceStorageKey(organisationId),
    data.backgroundId,
  )

  return { organisationId, backgroundId: data.backgroundId }
}

export async function createOrganisation(data) {
  const organisation = {
    id: `organisation-${String(nextOrganisationId).padStart(3, '0')}`,
    name: data.name,
    legalName: data.legalName ?? '',
    code: data.code,
    email: data.email,
    phone: data.phone ?? '',
    address: data.address ?? '',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
  }

  nextOrganisationId += 1
  organisations = [...organisations, organisation]
  return copyOrganisation(organisation)
}

export async function updateOrganisation(id, data) {
  const organisationIndex = organisations.findIndex(
    (organisation) => organisation.id === id,
  )

  if (organisationIndex === -1) {
    throw new Error('Company not found')
  }

  const currentOrganisation = organisations[organisationIndex]
  const updatedOrganisation = {
    id: currentOrganisation.id,
    name: data.name,
    legalName: data.legalName ?? '',
    code: data.code,
    email: data.email,
    phone: data.phone ?? '',
    address: data.address ?? '',
    status: currentOrganisation.status,
    createdAt: currentOrganisation.createdAt,
    totalUsers: currentOrganisation.totalUsers,
    activeUsers: currentOrganisation.activeUsers,
    inactiveUsers: currentOrganisation.inactiveUsers,
  }

  organisations = organisations.map((organisation, index) =>
    index === organisationIndex ? updatedOrganisation : organisation,
  )

  return copyOrganisation(updatedOrganisation)
}

export async function updateOrganisationStatus(id, status) {
  if (!['ACTIVE', 'SUSPENDED'].includes(status)) {
    throw new Error('Invalid company status')
  }

  const organisation = await getOrganisationById(id)

  if (!organisation) {
    throw new Error('Company not found')
  }

  const updatedOrganisation = { ...organisation, status }
  organisations = organisations.map((candidate) =>
    candidate.id === id ? updatedOrganisation : candidate,
  )

  return copyOrganisation(updatedOrganisation)
}
