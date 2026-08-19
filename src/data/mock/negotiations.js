import { mockCompanySubscriptions } from './companySubscriptions.js'
import { mockSubscriptionPlans } from './subscriptionPlans.js'

function getPlan(planValue) {
  return mockSubscriptionPlans.find((plan) => plan.value === planValue)
}

function buildFeatures(subscription) {
  const plan = getPlan(subscription.plan)
  return {
    organizationAdminLimit:
      subscription.overrides?.organizationAdminLimit ??
      plan.organizationAdminLimit,
    helpDeskLimit:
      subscription.overrides?.helpDeskLimit ?? plan.helpDeskLimit,
    userLimit: subscription.overrides?.userLimit ?? plan.userLimit,
    dailyTicketLimit:
      subscription.overrides?.dailyTicketLimit ?? plan.dailyTicketLimit,
    unlimitedOrganizationAdmins:
      subscription.overrides?.unlimitedOrganizationAdmins ?? false,
    unlimitedHelpDesk: subscription.overrides?.unlimitedHelpDesk ?? false,
    unlimitedUsers: subscription.overrides?.unlimitedUsers ?? false,
    unlimitedDailyTickets:
      subscription.overrides?.unlimitedDailyTickets ?? false,
    reportsAccess: plan.reportsAccess,
    advancedPermissionMatrix: plan.advancedPermissionMatrix,
  }
}

const activeNegotiations = mockCompanySubscriptions
  .filter((subscription) => subscription.negotiationId)
  .map((subscription) => {
    const companyNumber = Number(subscription.companyId.slice(-3))
    const negotiationNumber = Number(subscription.negotiationId.slice(-3))
    const month = String(Math.ceil(companyNumber / 3)).padStart(2, '0')

    return {
      id: subscription.negotiationId,
      reference: `NEG-2026-${String(negotiationNumber).padStart(4, '0')}`,
      companyId: subscription.companyId,
      plan: subscription.plan,
      startDate: `2026-${month}-20`,
      periodValue: 12,
      periodUnit: 'MONTHS',
      negotiatedAmount: subscription.customPrice,
      billingFrequency: 'MONTHLY',
      features: buildFeatures(subscription),
      hostingDeployment: subscription.hostingDeployment,
      status: 'ACTIVE',
      createdAt: `2026-${month}-15T08:30:00.000Z`,
    }
  })

const draftTeamNegotiation = {
  id: 'negotiation-003',
  reference: 'NEG-2026-0003',
  companyId: 'organisation-003',
  plan: 'TEAM',
  startDate: '2026-09-01',
  periodValue: 1,
  periodUnit: 'YEARS',
  negotiatedAmount: 9.99,
  billingFrequency: 'MONTHLY',
  features: {
    organizationAdminLimit: 1,
    helpDeskLimit: 8,
    userLimit: 35,
    dailyTicketLimit: 300,
    unlimitedOrganizationAdmins: false,
    unlimitedHelpDesk: false,
    unlimitedUsers: false,
    unlimitedDailyTickets: false,
    reportsAccess: true,
    advancedPermissionMatrix: false,
  },
  hostingDeployment: null,
  status: 'DRAFT',
  createdAt: '2026-08-11T09:00:00.000Z',
}

export const mockNegotiations = [
  ...activeNegotiations,
  draftTeamNegotiation,
].sort((first, second) => first.id.localeCompare(second.id))
