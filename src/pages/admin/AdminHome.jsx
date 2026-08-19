import { useEffect, useState } from 'react'
import {
  Building2Icon,
  BuildingIcon,
  DollarSignIcon,
  ShieldCheckIcon,
  TicketIcon,
  UsersIcon,
  UserXIcon,
} from 'lucide-react'

import { getSuperAdminOverview } from '@/api/reportApi'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'

const numberFormatter = new Intl.NumberFormat('en')
const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

const overviewItems = [
  { key: 'activeCompanies', label: 'Active Companies', icon: Building2Icon },
  {
    key: 'inactiveCompanies',
    label: 'Inactive Companies',
    icon: BuildingIcon,
  },
  { key: 'activeUsers', label: 'Active Users', icon: UsersIcon },
  { key: 'inactiveUsers', label: 'Inactive Users', icon: UserXIcon },
  { key: 'totalAdmins', label: 'Total Admins', icon: ShieldCheckIcon },
  { key: 'ticketsToday', label: 'Tickets Today', icon: TicketIcon },
  {
    key: 'totalRevenue',
    label: 'Total Revenue',
    icon: DollarSignIcon,
    currency: true,
  },
]

function SuperAdminOverview() {
  const [overview, setOverview] = useState(undefined)

  useEffect(() => {
    let isActive = true

    getSuperAdminOverview().then((data) => {
      if (isActive) setOverview(data)
    })

    return () => {
      isActive = false
    }
  }, [])

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Overview</h1>
        <p className="text-muted-foreground">
          Review current platform activity and subscription revenue.
        </p>
      </div>

      {!overview ? (
        <p className="text-sm text-muted-foreground">Loading overview...</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {overviewItems.map((item) => {
            const Icon = item.icon
            const value = item.currency
              ? currencyFormatter.format(overview[item.key])
              : numberFormatter.format(overview[item.key])

            return (
              <Card key={item.key} size="sm">
                <CardContent className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {item.label}
                    </p>
                    <p className="mt-2 text-2xl font-semibold">{value}</p>
                  </div>
                  <Icon
                    className="size-5 text-muted-foreground"
                    aria-hidden="true"
                  />
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </section>
  )
}

function AdminHome() {
  const { user } = useAuth()

  if (user.role === 'SUPER_ADMIN') return <SuperAdminOverview />

  return (
    <section className="space-y-2">
      <h1 className="text-2xl font-semibold">Overview</h1>
      <p className="text-muted-foreground">
        View the current Ophile admin portal overview.
      </p>
    </section>
  )
}

export default AdminHome
