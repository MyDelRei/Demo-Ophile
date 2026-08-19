import { mockTicketCategories } from '../data/mock/ticketCategories.js'

let categories = mockTicketCategories.map((category) => ({ ...category }))
let nextCategoryNumber =
  categories.reduce((highest, category) => {
    const idNumber = Number.parseInt(
      category.id.replace('ticket-category-', ''),
      10,
    )
    return Number.isNaN(idNumber) ? highest : Math.max(highest, idNumber)
  }, 0) + 1

function requireOrganisationId(organisationId) {
  if (!organisationId) throw new Error('Organisation is required')
}

function isOtherCategory(category) {
  return category.systemType === 'OTHER'
}

function copyCategory(category) {
  return category
    ? { ...category, system: isOtherCategory(category) }
    : null
}

function ensureOtherCategoryRecord(organisationId) {
  requireOrganisationId(organisationId)
  const existing = categories.find(
    (category) =>
      category.organisationId === organisationId &&
      isOtherCategory(category),
  )
  const now = new Date().toISOString()

  if (existing) {
    const normalized = {
      ...existing,
      name: 'Other',
      status: 'ACTIVE',
      systemType: 'OTHER',
      updatedAt:
        existing.name === 'Other' && existing.status === 'ACTIVE'
          ? existing.updatedAt
          : now,
    }
    categories = categories.map((category) =>
      category.id === existing.id ? normalized : category,
    )
    return normalized
  }

  const category = {
    id: `ticket-category-${String(nextCategoryNumber).padStart(4, '0')}`,
    organisationId,
    name: 'Other',
    status: 'ACTIVE',
    systemType: 'OTHER',
    createdAt: now,
    updatedAt: now,
  }
  nextCategoryNumber += 1
  categories = [...categories, category]
  return category
}

function requireScopedCategory(categoryId, organisationId) {
  requireOrganisationId(organisationId)
  const category = categories.find(
    (candidate) =>
      candidate.id === categoryId &&
      candidate.organisationId === organisationId,
  )

  if (!category) throw new Error('Ticket Category not found')
  return category
}

function normalizeName(name) {
  const value = String(name ?? '').trim()
  if (!value) throw new Error('Category Name is required')
  return value
}

function requireUniqueName(name, organisationId, excludedCategoryId) {
  const normalizedName = name.toLowerCase()
  const exists = categories.some(
    (category) =>
      category.organisationId === organisationId &&
      category.id !== excludedCategoryId &&
      category.name.toLowerCase() === normalizedName,
  )

  if (exists) throw new Error('A Ticket Category with this name already exists')
}

export async function ensureOtherTicketCategory(organisationId) {
  return copyCategory(ensureOtherCategoryRecord(organisationId))
}

export async function getTicketCategories(organisationId) {
  ensureOtherCategoryRecord(organisationId)
  return categories
    .filter((category) => category.organisationId === organisationId)
    .map(copyCategory)
}

export async function getActiveTicketCategories(organisationId) {
  const companyCategories = await getTicketCategories(organisationId)
  return companyCategories.filter((category) => category.status === 'ACTIVE')
}

export async function getTicketCategoryById(categoryId, organisationId) {
  ensureOtherCategoryRecord(organisationId)
  return copyCategory(
    categories.find(
      (category) =>
        category.id === categoryId &&
        category.organisationId === organisationId,
    ),
  )
}

export async function createTicketCategory(organisationId, data) {
  requireOrganisationId(organisationId)
  ensureOtherCategoryRecord(organisationId)
  const name = normalizeName(data.name)
  requireUniqueName(name, organisationId)
  const now = new Date().toISOString()
  const category = {
    id: `ticket-category-${String(nextCategoryNumber).padStart(4, '0')}`,
    organisationId,
    name,
    status: 'ACTIVE',
    createdAt: now,
    updatedAt: now,
  }

  nextCategoryNumber += 1
  categories = [...categories, category]
  return copyCategory(category)
}

export async function updateTicketCategory(
  categoryId,
  data,
  organisationId,
) {
  const category = requireScopedCategory(categoryId, organisationId)
  if (isOtherCategory(category)) {
    throw new Error('The default Other Category cannot be renamed')
  }
  const name = normalizeName(data.name)
  requireUniqueName(name, organisationId, categoryId)
  const updated = {
    ...category,
    name,
    updatedAt: new Date().toISOString(),
  }
  categories = categories.map((candidate) =>
    candidate.id === categoryId ? updated : candidate,
  )
  return copyCategory(updated)
}

export async function activateTicketCategory(categoryId, organisationId) {
  const category = requireScopedCategory(categoryId, organisationId)
  if (category.status === 'ACTIVE') return copyCategory(category)
  const updated = {
    ...category,
    status: 'ACTIVE',
    updatedAt: new Date().toISOString(),
  }
  categories = categories.map((candidate) =>
    candidate.id === categoryId ? updated : candidate,
  )
  return copyCategory(updated)
}

export async function deactivateTicketCategory(categoryId, organisationId) {
  const category = requireScopedCategory(categoryId, organisationId)
  if (isOtherCategory(category)) {
    throw new Error('The default Other Category cannot be deactivated')
  }
  if (category.status === 'INACTIVE') return copyCategory(category)
  const updated = {
    ...category,
    status: 'INACTIVE',
    updatedAt: new Date().toISOString(),
  }
  categories = categories.map((candidate) =>
    candidate.id === categoryId ? updated : candidate,
  )
  return copyCategory(updated)
}
