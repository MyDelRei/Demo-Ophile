import { useEffect, useState } from 'react'
import { EyeIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { getOrganisations } from '@/api/organisationApi'
import { getSubscriptionPayments } from '@/api/paymentApi'
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

function formatDate(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(
    new Date(value),
  )
}

function SubscriptionPaymentsPage() {
  const [rows, setRows] = useState(undefined)
  const navigate = useNavigate()

  useEffect(() => {
    let isActive = true

    async function loadPayments() {
      const [companies, subscriptions, payments] = await Promise.all([
        getOrganisations(),
        getCompanySubscriptions(),
        getSubscriptionPayments(),
      ])

      if (isActive) {
        setRows(
          companies.map((company) => {
            const subscription = subscriptions.find(
              (item) => item.companyId === company.id,
            )
            const latestPayment = payments
              .filter((payment) => payment.companyId === company.id)
              .sort(
                (first, second) =>
                  new Date(second.paymentDate) - new Date(first.paymentDate),
              )[0]

            return { company, subscription, latestPayment }
          }),
        )
      }
    }

    loadPayments()
    return () => {
      isActive = false
    }
  }, [])

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Subscription Payments</h1>
        <p className="text-muted-foreground">
          View static demo payment information for Company subscriptions.
        </p>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Current Subscription Price</TableHead>
              <TableHead>Last Payment</TableHead>
              <TableHead>Payment Status</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!rows ? (
              <TableRow>
                <TableCell colSpan={6}>Loading payments...</TableCell>
              </TableRow>
            ) : (
              rows.map(({ company, subscription, latestPayment }) => (
                <TableRow key={company.id}>
                  <TableCell className="font-medium">{company.name}</TableCell>
                  <TableCell>
                    <Badge>{subscription?.plan ?? '—'}</Badge>
                  </TableCell>
                  <TableCell>{subscription?.priceDisplay ?? '—'}</TableCell>
                  <TableCell>
                    {formatDate(latestPayment?.paymentDate)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        latestPayment?.status === 'PAID'
                          ? 'default'
                          : 'secondary'
                      }
                    >
                      {latestPayment?.status ?? 'NO PAYMENTS'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <IconActionButton
                      icon={EyeIcon}
                      variant="outline"
                      title={`View ${company.name} payment history`}
                      onClick={() =>
                        navigate(`/admin/subscriptions/payments/${company.id}`)
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

export default SubscriptionPaymentsPage
