const subscriptionSeeds = [
  { plan: 'ENTERPRISE', customPrice: 120, negotiationId: 'negotiation-001', hostingDeployment: 'CLOUD' },
  { plan: 'FREE' },
  { plan: 'TEAM' },
  {
    plan: 'TEAM',
    customPrice: 12.99,
    negotiationId: 'negotiation-002',
    overrides: { helpDeskLimit: 10, userLimit: 50, dailyTicketLimit: 500 },
  },
  { plan: 'TEAM' },
  { plan: 'ENTERPRISE', customPrice: 250, negotiationId: 'negotiation-004', hostingDeployment: 'ON_PREMISE' },
  { plan: 'FREE' },
  {
    plan: 'TEAM',
    customPrice: 19.99,
    negotiationId: 'negotiation-005',
    overrides: { helpDeskLimit: 12, userLimit: 75, dailyTicketLimit: 750 },
  },
  { plan: 'TEAM' },
  { plan: 'ENTERPRISE', customPrice: 99, negotiationId: 'negotiation-006', hostingDeployment: 'CLOUD' },
  { plan: 'FREE' },
  { plan: 'TEAM' },
  { plan: 'ENTERPRISE', customPrice: 150, negotiationId: 'negotiation-007', hostingDeployment: 'ON_PREMISE' },
  {
    plan: 'TEAM',
    customPrice: 9.99,
    negotiationId: 'negotiation-008',
    overrides: { helpDeskLimit: 7, userLimit: 35, dailyTicketLimit: 350 },
  },
  { plan: 'FREE' },
  { plan: 'TEAM' },
  { plan: 'ENTERPRISE', customPrice: 250, negotiationId: 'negotiation-009', hostingDeployment: 'CLOUD' },
  {
    plan: 'TEAM',
    customPrice: 12.99,
    negotiationId: 'negotiation-010',
    overrides: { helpDeskLimit: 9, userLimit: 60, dailyTicketLimit: 600 },
  },
  { plan: 'FREE' },
  { plan: 'TEAM' },
  { plan: 'ENTERPRISE', customPrice: 120, negotiationId: 'negotiation-011', hostingDeployment: 'ON_PREMISE' },
  { plan: 'FREE' },
  {
    plan: 'TEAM',
    customPrice: 19.99,
    negotiationId: 'negotiation-012',
    overrides: { helpDeskLimit: 15, userLimit: 100, dailyTicketLimit: 1000 },
  },
  { plan: 'ENTERPRISE', customPrice: 250, negotiationId: 'negotiation-013', hostingDeployment: 'CLOUD' },
]

function buildEnterpriseOverrides(companyNumber) {
  return {
    organizationAdminLimit: 4 + (companyNumber % 4),
    helpDeskLimit: 20 + companyNumber,
    userLimit: 180 + companyNumber * 10,
    dailyTicketLimit: 1200 + companyNumber * 50,
    unlimitedOrganizationAdmins: false,
    unlimitedHelpDesk: false,
    unlimitedUsers: false,
    unlimitedDailyTickets: false,
  }
}

export const mockCompanySubscriptions = subscriptionSeeds.map((seed, index) => {
  const companyNumber = index + 1
  const negotiated = Boolean(seed.negotiationId)

  return {
    id: `subscription-${String(companyNumber).padStart(3, '0')}`,
    companyId: `organisation-${String(companyNumber).padStart(3, '0')}`,
    plan: seed.plan,
    customPrice: seed.customPrice ?? null,
    overrides:
      seed.plan === 'ENTERPRISE'
        ? buildEnterpriseOverrides(companyNumber)
        : seed.overrides ?? null,
    hostingDeployment: seed.hostingDeployment ?? null,
    negotiationId: seed.negotiationId ?? null,
    negotiated,
    status: 'ACTIVE',
  }
})
