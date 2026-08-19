import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { getNegotiationById } from '@/api/negotiationApi'
import { getOrganisationById } from '@/api/organisationApi'
import { getPaymentTransaction } from '@/api/paymentApi'
import { getCompanySubscriptionByCompanyId } from '@/api/subscriptionApi'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function formatDate(value) {
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function formatAmount(amount, currency) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount)
}

function formatStatus(value) {
  return value.charAt(0) + value.slice(1).toLowerCase()
}

function PaymentTransactionDetailPage() {
  const [transaction, setTransaction] = useState(undefined)
  const [company, setCompany] = useState(undefined)
  const [subscription, setSubscription] = useState(undefined)
  const [negotiation, setNegotiation] = useState(undefined)
  const { companyId, transactionId } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    let isActive = true

    async function loadTransaction() {
      const payment = await getPaymentTransaction(companyId, transactionId)

      if (!payment) {
        if (isActive) {
          setTransaction(null)
          setCompany(null)
          setSubscription(null)
          setNegotiation(null)
        }
        return
      }

      const [companyItem, subscriptionItem, negotiationItem] =
        await Promise.all([
          getOrganisationById(payment.companyId),
          getCompanySubscriptionByCompanyId(payment.companyId),
          payment.negotiationId
            ? getNegotiationById(payment.negotiationId)
            : Promise.resolve(null),
        ])

      if (isActive) {
        setTransaction(payment)
        setCompany(companyItem)
        setSubscription(subscriptionItem)
        setNegotiation(negotiationItem)
      }
    }

    loadTransaction()
    return () => {
      isActive = false
    }
  }, [companyId, transactionId])

  if (
    transaction === undefined ||
    company === undefined ||
    subscription === undefined ||
    negotiation === undefined
  ) {
    return <p>Loading transaction...</p>
  }

  if (!transaction || !company || !subscription) {
    return (
      <section className="space-y-4">
        <h1 className="text-2xl font-semibold">Transaction not found</h1>
        <Button
          variant="outline"
          onClick={() =>
            navigate(`/admin/subscriptions/payments/${companyId}`)
          }
        >
          Back to Payment History
        </Button>
      </section>
    )
  }

  return (
    <section className="space-y-6">
      <div className="space-y-4">
        <Button
          variant="outline"
          onClick={() =>
            navigate(`/admin/subscriptions/payments/${companyId}`)
          }
        >
          Back to Payment History
        </Button>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Payment Transaction</h1>
          <p className="text-muted-foreground">
            View the card transaction and its subscription references.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaction Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-sm text-muted-foreground">Transaction ID</p>
            <p className="font-medium">{transaction.transactionId}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Payment Reference</p>
            <p className="font-medium">{transaction.paymentReference}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Payment Date</p>
            <p className="font-medium">
              {formatDate(transaction.paymentDate)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Amount</p>
            <p className="font-medium">
              {formatAmount(transaction.amount, transaction.currency)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Currency</p>
            <p className="font-medium">{transaction.currency}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <Badge className="mt-1">{formatStatus(transaction.status)}</Badge>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Payment Method</p>
            <p className="font-medium">
              {formatStatus(transaction.paymentMethod)}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Card Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-sm text-muted-foreground">Card Brand</p>
            <p className="font-medium">{transaction.cardBrand}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Cardholder Name</p>
            <p className="font-medium">{transaction.cardholderName}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Card Number</p>
            <p className="font-medium">
              •••• •••• •••• {transaction.cardLast4}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Subscription Reference</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-sm text-muted-foreground">Company</p>
            <p className="font-medium">{company.name}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              Subscription Plan
            </p>
            <p className="font-medium">{subscription.plan}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Subscription ID</p>
            <p className="font-medium">{transaction.subscriptionId}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Billing Period</p>
            <p className="font-medium">{transaction.billingPeriod}</p>
          </div>
          {negotiation && (
            <>
              <div>
                <p className="text-sm text-muted-foreground">
                  Negotiation ID
                </p>
                <p className="font-medium">{negotiation.id}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Negotiation Reference
                </p>
                <Button
                  className="h-auto p-0"
                  variant="link"
                  onClick={() =>
                    navigate(
                      `/admin/subscriptions/negotiations/${negotiation.id}`,
                    )
                  }
                >
                  {negotiation.reference}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </section>
  )
}

export default PaymentTransactionDetailPage
