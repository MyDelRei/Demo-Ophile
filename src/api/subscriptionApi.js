import { mockCompanySubscriptions } from '../data/mock/companySubscriptions.js'
import { mockSubscriptionPlans } from '../data/mock/subscriptionPlans.js'

let companySubscriptions = mockCompanySubscriptions.map(copySubscription)
let nextSubscriptionId = companySubscriptions.length + 1

const limitKeys = [
  'organizationAdminLimit',
  'helpDeskLimit',
  'userLimit',
  'dailyTicketLimit',
]

const unlimitedKeys = [
  'unlimitedOrganizationAdmins',
  'unlimitedHelpDesk',
  'unlimitedUsers',
  'unlimitedDailyTickets',
]

function copySubscription(subscription) {
  return subscription
    ? {
        ...subscription,
        overrides: subscription.overrides
          ? { ...subscription.overrides }
          : null,
      }
    : null
}

function getPlan(planValue) {
  return mockSubscriptionPlans.find((plan) => plan.value === planValue)
}

function formatPrice(price) {
  if (price === null || price === undefined) return 'Negotiated'
  if (price === 0) return '$0/month'
  return `$${Number(price).toFixed(2)}/month`
}

function resolveSubscription(subscription) {
  if (!subscription) return null

  const plan = getPlan(subscription.plan)
  const defaultLimits =
    plan.pricingType === 'FIXED'
      ? Object.fromEntries(limitKeys.map((key) => [key, plan[key]]))
      : null
  const effectiveLimits =
    defaultLimits || subscription.overrides
      ? { ...defaultLimits, ...subscription.overrides }
      : null
  const effectivePrice = subscription.customPrice ?? plan.price

  return {
    ...copySubscription(subscription),
    planDefinition: { ...plan },
    effectiveLimits,
    effectivePrice,
    priceDisplay: formatPrice(effectivePrice),
    subscriptionType:
      subscription.plan === 'TEAM'
        ? subscription.negotiated
          ? 'Negotiated TEAM'
          : 'Standard TEAM'
        : subscription.plan === 'ENTERPRISE'
          ? 'Negotiated'
          : 'Standard',
  }
}

function buildTeamOverrides(data, plan) {
  return Object.fromEntries(
    limitKeys
      .filter((key) => Number(data.overrides[key]) !== plan[key])
      .map((key) => [key, Number(data.overrides[key])]),
  )
}

function buildEnterpriseOverrides(overrides) {
  return Object.fromEntries([
    ...limitKeys.map((key) => [key, overrides[key] ?? null]),
    ...unlimitedKeys.map((key) => [key, Boolean(overrides[key])]),
  ])
}

export async function getSubscriptionPlans() {
  return mockSubscriptionPlans.map((plan) => ({ ...plan }))
}

export async function getCompanySubscriptions() {
  return companySubscriptions.map(resolveSubscription)
}

export async function getCompanySubscriptionByCompanyId(companyId) {
  return resolveSubscription(
    companySubscriptions.find(
      (subscription) => subscription.companyId === companyId,
    ),
  )
}

export async function createCompanySubscription(companyId, plan = 'FREE') {
  const subscription = {
    id: `subscription-${String(nextSubscriptionId).padStart(3, '0')}`,
    companyId,
    plan,
    customPrice: null,
    overrides: null,
    hostingDeployment: null,
    negotiationId: null,
    negotiated: plan === 'ENTERPRISE',
    status: 'ACTIVE',
  }

  nextSubscriptionId += 1
  companySubscriptions = [...companySubscriptions, subscription]
  return resolveSubscription(subscription)
}

export async function updateCompanySubscription(companyId, data) {
  const index = companySubscriptions.findIndex(
    (subscription) => subscription.companyId === companyId,
  )

  if (index === -1) throw new Error('Company subscription not found')

  const current = companySubscriptions[index]
  const plan = getPlan(data.plan)
  let subscriptionData

  if (data.plan === 'FREE') {
    subscriptionData = {
      customPrice: null,
      overrides: null,
      hostingDeployment: null,
      negotiationId: null,
      negotiated: false,
    }
  } else if (data.plan === 'TEAM') {
    const overrides = buildTeamOverrides(data, plan)
    const customPrice = Number(data.customPrice)
    const hasCustomPrice = customPrice !== plan.price
    const negotiated = hasCustomPrice || Object.keys(overrides).length > 0

    subscriptionData = {
      customPrice: hasCustomPrice ? customPrice : null,
      overrides: Object.keys(overrides).length > 0 ? overrides : null,
      hostingDeployment: null,
      negotiationId: negotiated ? current.negotiationId ?? null : null,
      negotiated,
    }
  } else {
    subscriptionData = {
      customPrice: Number(data.customPrice),
      overrides: buildEnterpriseOverrides(data.overrides),
      hostingDeployment: data.hostingDeployment,
      negotiationId:
        current.plan === 'ENTERPRISE' ? current.negotiationId ?? null : null,
      negotiated: true,
    }
  }

  const updated = {
    ...current,
    plan: data.plan,
    ...subscriptionData,
  }

  companySubscriptions = companySubscriptions.map((subscription, itemIndex) =>
    itemIndex === index ? updated : subscription,
  )

  return resolveSubscription(updated)
}
