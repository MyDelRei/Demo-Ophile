import { useEffect, useState } from 'react'
import { EyeIcon, SendIcon } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'

import {
  getNegotiationById,
  sendPaymentRequest,
} from '@/api/negotiationApi'
import { getOrganisationById } from '@/api/organisationApi'
import { getSubscriptionPaymentsByNegotiationId } from '@/api/paymentApi'
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
import { useAppFeedback } from '@/hooks/useAppFeedback'
import {
  downloadDocxFile,
  generateBlankContract,
  generateNegotiationContract,
} from '@/lib/contractGenerator'

const limitItems = [
  {
    limitKey: 'organizationAdminLimit',
    unlimitedKey: 'unlimitedOrganizationAdmins',
    label: 'Organization Admin Limit',
  },
  {
    limitKey: 'helpDeskLimit',
    unlimitedKey: 'unlimitedHelpDesk',
    label: 'Help Desk User Limit',
  },
  {
    limitKey: 'userLimit',
    unlimitedKey: 'unlimitedUsers',
    label: 'Standard User Limit',
  },
  {
    limitKey: 'dailyTicketLimit',
    unlimitedKey: 'unlimitedDailyTickets',
    label: 'Daily Ticket Limit',
  },
]

function formatDate(value) {
  return new Intl.DateTimeFormat('en', { dateStyle: 'long' }).format(
    new Date(value),
  )
}

function formatPeriod(value, unit) {
  const singular = Number(value) === 1
  const label =
    unit === 'YEARS' ? (singular ? 'Year' : 'Years') : singular ? 'Month' : 'Months'
  return `${value} ${label}`
}

function formatFrequency(value) {
  return {
    MONTHLY: 'Monthly',
    QUARTERLY: 'Quarterly',
    YEARLY: 'Yearly',
    ONE_TIME: 'One-Time',
  }[value]
}

function formatHosting(value) {
  if (value === 'CLOUD') return 'Cloud Hosted'
  if (value === 'ON_PREMISE') return 'On-Premise'
  return 'Not Applicable'
}

function formatLimit(features, item) {
  if (features[item.unlimitedKey]) return 'Unlimited'
  return new Intl.NumberFormat('en').format(features[item.limitKey])
}

function NegotiationDetailPage() {
  const [negotiation, setNegotiation] = useState(undefined)
  const [company, setCompany] = useState(undefined)
  const [subscription, setSubscription] = useState(undefined)
  const [payments, setPayments] = useState(undefined)
  const { negotiationId } = useParams()
  const navigate = useNavigate()
  const { hideLoading, showLoading, showNotification } = useAppFeedback()

  useEffect(() => {
    let isActive = true

    async function loadNegotiation() {
      const negotiationItem = await getNegotiationById(negotiationId)

      if (!negotiationItem) {
        if (isActive) {
          setNegotiation(null)
          setCompany(null)
          setSubscription(null)
          setPayments([])
        }
        return
      }

      const [companyItem, subscriptionItem, paymentItems] = await Promise.all([
        getOrganisationById(negotiationItem.companyId),
        getCompanySubscriptionByCompanyId(negotiationItem.companyId),
        getSubscriptionPaymentsByNegotiationId(negotiationItem.id),
      ])

      if (isActive) {
        setNegotiation(negotiationItem)
        setCompany(companyItem)
        setSubscription(subscriptionItem)
        setPayments(paymentItems)
      }
    }

    loadNegotiation()
    return () => {
      isActive = false
    }
  }, [negotiationId])

  if (
    negotiation === undefined ||
    company === undefined ||
    subscription === undefined ||
    payments === undefined
  ) {
    return <p>Loading negotiation...</p>
  }

  if (!negotiation || !company) {
    return (
      <section className="space-y-4">
        <h1 className="text-2xl font-semibold">Negotiation not found</h1>
        <Button
          variant="outline"
          onClick={() => navigate('/admin/subscriptions/negotiations')}
        >
          Back to Negotiations
        </Button>
      </section>
    )
  }

  async function downloadPopulatedContract() {
    await downloadDocxFile(
      `ophile-contract-${negotiation.reference}.docx`,
      generateNegotiationContract(negotiation, company),
    )
  }

  async function downloadBlankContract() {
    await downloadDocxFile(
      'ophile-subscription-negotiation-agreement-blank.docx',
      generateBlankContract(),
    )
  }

  async function handleSendPayment() {
    showLoading('Sending payment request...')

    try {
      const updatedNegotiation = await sendPaymentRequest(negotiation.id)
      setNegotiation(updatedNegotiation)
      showNotification('Payment request sent successfully.')
    } catch (error) {
      showNotification(
        error.message || 'Unable to update the negotiation.',
        'error',
      )
    } finally {
      hideLoading()
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-4">
          <Button
            variant="outline"
            onClick={() => navigate('/admin/subscriptions/negotiations')}
          >
            Back to Negotiations
          </Button>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold">Negotiation Detail</h1>
            <p className="text-muted-foreground">
              Review negotiated terms, related payments, and contract files.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={downloadBlankContract}>
            Download Blank Contract
          </Button>
          <Button onClick={downloadPopulatedContract}>Download Contract</Button>
        </div>
      </div>

      {negotiation.status === 'DRAFT' && (
        <Card>
          <CardContent className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="font-medium">Payment Request</p>
              <p className="text-sm text-muted-foreground">
                Send this draft negotiation for payment processing.
              </p>
            </div>
            <Button onClick={handleSendPayment}>
              <SendIcon data-icon="inline-start" />
              Send Payment
            </Button>
          </CardContent>
        </Card>
      )}

      {negotiation.status === 'PROCESSING' && (
        <Card>
          <CardContent>
            <div>
              <p className="font-medium">Awaiting Payment Confirmation</p>
              <p className="text-sm text-muted-foreground">
                The negotiation status will be updated by the payment provider
                webhook when real payment integration is added.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Agreement Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-sm text-muted-foreground">
              Negotiation Reference
            </p>
            <p className="font-medium">{negotiation.reference}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Company</p>
            <p className="font-medium">{company.name}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Current Plan</p>
            <p className="font-medium">{subscription?.plan ?? '—'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Negotiated Plan</p>
            <p className="font-medium">{negotiation.plan}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Negotiated Price</p>
            <p className="font-medium">
              ${Number(negotiation.negotiatedAmount).toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              Billing Frequency
            </p>
            <p className="font-medium">
              {formatFrequency(negotiation.billingFrequency)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Start Date</p>
            <p className="font-medium">{formatDate(negotiation.startDate)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Contract Period</p>
            <p className="font-medium">
              {formatPeriod(
                negotiation.periodValue,
                negotiation.periodUnit,
              )}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <Badge
              className="mt-1"
              variant={
                negotiation.status === 'ACTIVE' ? 'default' : 'secondary'
              }
            >
              {negotiation.status}
            </Badge>
          </div>
          {negotiation.plan === 'ENTERPRISE' && (
            <div>
              <p className="text-sm text-muted-foreground">
                Hosting Deployment
              </p>
              <p className="font-medium">
                {formatHosting(negotiation.hostingDeployment)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Negotiated Limits &amp; Features</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {limitItems.map((item) => (
            <div key={item.limitKey} className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="mt-1 text-sm font-medium">
                {formatLimit(negotiation.features, item)}
              </p>
            </div>
          ))}
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Reports Access</p>
            <Badge
              className="mt-1"
              variant={
                negotiation.features.reportsAccess ? 'default' : 'secondary'
              }
            >
              {negotiation.features.reportsAccess ? 'Yes' : 'No'}
            </Badge>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">
              Advanced Permission Matrix
            </p>
            <Badge
              className="mt-1"
              variant={
                negotiation.features.advancedPermissionMatrix
                  ? 'default'
                  : 'secondary'
              }
            >
              {negotiation.features.advancedPermissionMatrix
                ? 'Available'
                : 'Not Available'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Related Payments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payment Reference</TableHead>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Billing Period</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6}>
                      No payments reference this negotiation.
                    </TableCell>
                  </TableRow>
                ) : (
                  payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{payment.paymentReference}</TableCell>
                      <TableCell>{payment.transactionId}</TableCell>
                      <TableCell>
                        ${Number(payment.amount).toFixed(2)}
                      </TableCell>
                      <TableCell>{payment.billingPeriod}</TableCell>
                      <TableCell>
                        <Badge>{payment.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <IconActionButton
                          icon={EyeIcon}
                          variant="outline"
                          title={`View ${payment.transactionId}`}
                          onClick={() =>
                            navigate(
                              `/admin/subscriptions/payments/${company.id}/transactions/${payment.transactionId}`,
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

export default NegotiationDetailPage
