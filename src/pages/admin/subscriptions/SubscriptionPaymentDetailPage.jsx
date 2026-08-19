import { useEffect, useState } from 'react'
import { EyeIcon } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'

import { getOrganisationById } from '@/api/organisationApi'
import { getSubscriptionPaymentsByCompanyId } from '@/api/paymentApi'
import { getCompanySubscriptionByCompanyId } from '@/api/subscriptionApi'
import IconActionButton from '@/components/common/IconActionButton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

function formatDate(value) {
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(
    new Date(value),
  )
}

function formatAmount(value) {
  return `$${Number(value).toFixed(2)}`
}

function SubscriptionPaymentDetailPage() {
  const [company, setCompany] = useState(undefined)
  const [subscription, setSubscription] = useState(undefined)
  const [payments, setPayments] = useState(undefined)
  const { companyId } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    let isActive = true

    async function loadPaymentHistory() {
      const [companyItem, subscriptionItem, paymentItems] = await Promise.all([
        getOrganisationById(companyId),
        getCompanySubscriptionByCompanyId(companyId),
        getSubscriptionPaymentsByCompanyId(companyId),
      ])

      if (isActive) {
        setCompany(companyItem)
        setSubscription(subscriptionItem)
        setPayments(
          paymentItems.sort(
            (first, second) =>
              new Date(second.paymentDate) - new Date(first.paymentDate),
          ),
        )
      }
    }

    loadPaymentHistory()
    return () => {
      isActive = false
    }
  }, [companyId])

  if (
    company === undefined ||
    subscription === undefined ||
    payments === undefined
  ) {
    return <p>Loading payment history...</p>
  }

  if (!company || !subscription) {
    return (
      <section className="space-y-4">
        <h1 className="text-2xl font-semibold">Payment history not found</h1>
        <Button
          variant="outline"
          onClick={() => navigate('/admin/subscriptions/payments')}
        >
          Back to Subscription Payments
        </Button>
      </section>
    )
  }

  return (
    <section className="space-y-6">
      <div className="space-y-4">
        <Button
          variant="outline"
          onClick={() => navigate('/admin/subscriptions/payments')}
        >
          Back to Subscription Payments
        </Button>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">
            Subscription Payment Detail
          </h1>
          <p className="text-muted-foreground">
            View this Company&apos;s static demo payment history.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Subscription Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-sm text-muted-foreground">Company Name</p>
            <p className="font-medium">{company.name}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Current Plan</p>
            <p className="font-medium">
              {subscription.planDefinition.displayName}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              Current Subscription Price
            </p>
            <p className="font-medium">{subscription.priceDisplay}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payment Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Payment Reference</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6}>No payment history.</TableCell>
                  </TableRow>
                ) : (
                  payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                      <TableCell>{formatAmount(payment.amount)}</TableCell>
                      <TableCell>{payment.paymentReference}</TableCell>
                      <TableCell>{payment.billingPeriod}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            payment.status === 'PAID'
                              ? 'default'
                              : 'secondary'
                          }
                        >
                          {payment.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <IconActionButton
                          icon={EyeIcon}
                          variant="outline"
                          title={`View transaction ${payment.transactionId}`}
                          onClick={() =>
                            navigate(
                              `/admin/subscriptions/payments/${companyId}/transactions/${payment.transactionId}`,
                            )
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}

export default SubscriptionPaymentDetailPage
