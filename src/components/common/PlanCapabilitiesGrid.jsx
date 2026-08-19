import { Badge } from '@/components/ui/badge'

function formatUserLimit(limit, unlimited) {
  if (unlimited) return 'Unlimited'
  if (limit === null || limit === undefined) return 'Not configured'
  return `${limit} ${limit === 1 ? 'user' : 'users'}`
}

function formatTicketLimit(limit, unlimited) {
  if (unlimited) return 'Unlimited'
  if (limit === null || limit === undefined) return 'Not configured'
  return `${limit} tickets/day`
}

function AvailabilityBadge({
  available,
  availableLabel = 'Available',
  unavailableLabel = 'Not Available',
}) {
  return (
    <Badge variant={available ? 'default' : 'secondary'}>
      {available ? availableLabel : unavailableLabel}
    </Badge>
  )
}

function PlanCapabilitiesGrid({ plan, limits, showLimits = true }) {
  const capabilities = []
  const displayedLimits =
    limits ?? (plan.pricingType === 'FIXED' ? plan : null)

  if (showLimits && displayedLimits) {
    capabilities.push(
      {
        label: 'Organization Admin Limit',
        value: formatUserLimit(
          displayedLimits.organizationAdminLimit,
          displayedLimits.unlimitedOrganizationAdmins,
        ),
      },
      {
        label: 'Help Desk User Limit',
        value: formatUserLimit(
          displayedLimits.helpDeskLimit,
          displayedLimits.unlimitedHelpDesk,
        ),
      },
      {
        label: 'Standard User Limit',
        value: formatUserLimit(
          displayedLimits.userLimit,
          displayedLimits.unlimitedUsers,
        ),
      },
      {
        label: 'Daily Ticket Limit',
        value: formatTicketLimit(
          displayedLimits.dailyTicketLimit,
          displayedLimits.unlimitedDailyTickets,
        ),
      },
    )
  }

  capabilities.push(
    {
      label: 'Advanced Permission Matrix',
      value: (
        <AvailabilityBadge available={plan.advancedPermissionMatrix} />
      ),
    },
    {
      label: 'Reports Access',
      value: (
        <AvailabilityBadge
          available={plan.reportsAccess}
          availableLabel="Yes"
          unavailableLabel="No"
        />
      ),
    },
  )

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {capabilities.map((capability) => (
        <div key={capability.label} className="space-y-1 rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">{capability.label}</p>
          <div className="text-sm font-medium">{capability.value}</div>
        </div>
      ))}
    </div>
  )
}

export default PlanCapabilitiesGrid
