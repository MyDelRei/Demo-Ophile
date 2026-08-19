import { useEffect, useState } from 'react'
import { EyeIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { getOrganisations } from '@/api/organisationApi'
import { getCompanySubscriptions } from '@/api/subscriptionApi'
import IconActionButton from '@/components/common/IconActionButton'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

function CompanySubscriptionsPage() {
  const [rows, setRows] = useState(undefined)
  const navigate = useNavigate()

  useEffect(() => {
    let isActive = true

    async function loadSubscriptions() {
      const [companies, subscriptions] = await Promise.all([
        getOrganisations(),
        getCompanySubscriptions(),
      ])

      if (isActive) {
        setRows(
          companies.map((company) => ({
            company,
            subscription: subscriptions.find(
              (item) => item.companyId === company.id,
            ),
          })),
        )
      }
    }

    loadSubscriptions()
    return () => {
      isActive = false
    }
  }, [])

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Company Subscriptions</h1>
        <p className="text-muted-foreground">
          View and manage each Company&apos;s subscription agreement.
        </p>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Current Price</TableHead>
              <TableHead>Subscription Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!rows ? (
              <TableRow>
                <TableCell colSpan={6}>Loading subscriptions...</TableCell>
              </TableRow>
            ) : (
              rows.map(({ company, subscription }) => (
                <TableRow key={company.id}>
                  <TableCell className="font-medium">{company.name}</TableCell>
                  <TableCell>
                    <Badge>{subscription?.plan ?? '—'}</Badge>
                  </TableCell>
                  <TableCell>{subscription?.priceDisplay ?? '—'}</TableCell>
                  <TableCell>
                    {subscription?.subscriptionType ?? '—'}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        subscription?.status === 'ACTIVE'
                          ? 'default'
                          : 'secondary'
                      }
                    >
                      {subscription?.status ?? 'UNASSIGNED'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <IconActionButton
                      icon={EyeIcon}
                      variant="outline"
                      title={`View or edit ${company.name} subscription`}
                      onClick={() =>
                        navigate(`/admin/subscriptions/companies/${company.id}`)
                      }
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  )
}

export default CompanySubscriptionsPage
