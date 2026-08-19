import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { getOrganisationById } from '@/api/organisationApi'
import {
  getCompanySubscriptionByCompanyId,
  getSubscriptionPlans,
  updateCompanySubscription,
} from '@/api/subscriptionApi'
import PlanCapabilitiesGrid from '@/components/common/PlanCapabilitiesGrid'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const limitFields = [
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

function createLimits(source = {}) {
  return Object.fromEntries(
    limitFields.flatMap(({ limitKey, unlimitedKey }) => [
      [limitKey, source[limitKey] ?? ''],
      [unlimitedKey, Boolean(source[unlimitedKey])],
    ]),
  )
}

function createFormFromSubscription(subscription) {
  return {
    plan: subscription.plan,
    customPrice: subscription.effectivePrice ?? '',
    limits: createLimits(subscription.effectiveLimits ?? {}),
    hostingDeployment: subscription.hostingDeployment ?? 'CLOUD',
  }
}

function createDefaultPlanForm(plan) {
  return {
    plan: plan.value,
    customPrice: plan.price ?? '',
    limits: createLimits(plan.pricingType === 'FIXED' ? plan : {}),
    hostingDeployment: plan.value === 'ENTERPRISE' ? 'CLOUD' : '',
  }
}

function normalizeLimits(limits, allowUnlimited) {
  return Object.fromEntries(
    limitFields.flatMap(({ limitKey, unlimitedKey }) => {
      const unlimited = allowUnlimited && limits[unlimitedKey]
      return [
        [limitKey, unlimited ? null : Number(limits[limitKey])],
        [unlimitedKey, Boolean(unlimited)],
      ]
    }),
  )
}

function formatHosting(value) {
  if (value === 'CLOUD') return 'Cloud Hosted'
  if (value === 'ON_PREMISE') return 'On-Premise'
  return 'Not configured'
}

function SubscriptionLimitFields({ values, onChange, allowUnlimited }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {limitFields.map(({ limitKey, unlimitedKey, label }) => (
        <div key={limitKey} className="space-y-2 rounded-lg border p-3">
          <Label htmlFor={`subscription-${limitKey}`}>{label}</Label>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              id={`subscription-${limitKey}`}
              type="number"
              min="1"
              step="1"
              value={values[limitKey]}
              onChange={(event) => onChange(limitKey, event.target.value)}
              disabled={allowUnlimited && values[unlimitedKey]}
              required={!allowUnlimited || !values[unlimitedKey]}
            />
            {allowUnlimited && (
              <label
                className="flex shrink-0 items-center gap-2 text-sm"
                htmlFor={`subscription-${unlimitedKey}`}
              >
                <input
                  id={`subscription-${unlimitedKey}`}
                  type="checkbox"
                  className="size-4 accent-primary"
                  checked={values[unlimitedKey]}
                  onChange={(event) =>
                    onChange(unlimitedKey, event.target.checked)
                  }
                />
                Unlimited
              </label>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function CompanySubscriptionDetailPage() {
  const [company, setCompany] = useState(undefined)
  const [subscription, setSubscription] = useState(undefined)
  const [plans, setPlans] = useState(undefined)
  const [form, setForm] = useState(null)
  const [saved, setSaved] = useState(false)
  const { companyId } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    let isActive = true

    async function loadSubscription() {
      const [companyItem, subscriptionItem, planItems] = await Promise.all([
        getOrganisationById(companyId),
        getCompanySubscriptionByCompanyId(companyId),
        getSubscriptionPlans(),
      ])

      if (isActive) {
        setCompany(companyItem)
        setSubscription(subscriptionItem)
        setPlans(planItems)
        setForm(
          subscriptionItem
            ? createFormFromSubscription(subscriptionItem)
            : createDefaultPlanForm(planItems[0]),
        )
      }
    }

    loadSubscription()
    return () => {
      isActive = false
    }
  }, [companyId])

  if (
    company === undefined ||
    subscription === undefined ||
    plans === undefined ||
    form === null
  ) {
    return <p>Loading subscription...</p>
  }

  if (!company || !subscription) {
    return (
      <section className="space-y-4">
        <h1 className="text-2xl font-semibold">Subscription not found</h1>
        <Button
          variant="outline"
          onClick={() => navigate('/admin/subscriptions/companies')}
        >
          Back to Company Subscriptions
        </Button>
      </section>
    )
  }

  const selectedPlan = plans.find((plan) => plan.value === form.plan)

  function handlePlanChange(planValue) {
    const plan = plans.find((item) => item.value === planValue)
    setForm(createDefaultPlanForm(plan))
    setSaved(false)
  }

  function updateLimit(field, value) {
    setForm((current) => ({
      ...current,
      limits: { ...current.limits, [field]: value },
    }))
    setSaved(false)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const data = { plan: form.plan }

    if (form.plan === 'TEAM') {
      data.customPrice = Number(form.customPrice)
      data.overrides = normalizeLimits(form.limits, false)
    }

    if (form.plan === 'ENTERPRISE') {
      data.customPrice = Number(form.customPrice)
      data.overrides = normalizeLimits(form.limits, true)
      data.hostingDeployment = form.hostingDeployment
    }

    const updated = await updateCompanySubscription(companyId, data)
    setSubscription(updated)
    setForm(createFormFromSubscription(updated))
    setSaved(true)
  }

  return (
    <section className="space-y-6">
      <div className="space-y-4">
        <Button
          variant="outline"
          onClick={() => navigate('/admin/subscriptions/companies')}
        >
          Back to Company Subscriptions
        </Button>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Company Subscription</h1>
          <p className="text-muted-foreground">
            Manage this Company&apos;s subscription agreement.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-sm text-muted-foreground">Company Name</p>
            <p className="font-medium">{company.name}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Company Code</p>
            <p className="font-medium">{company.code}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Company Status</p>
            <Badge
              className="mt-1"
              variant={company.status === 'ACTIVE' ? 'default' : 'secondary'}
            >
              {company.status}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Subscription</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-sm text-muted-foreground">Plan</p>
              <p className="font-medium">
                {subscription.planDefinition.displayName}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Price</p>
              <p className="font-medium">{subscription.priceDisplay}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                Subscription Type
              </p>
              <p className="font-medium">{subscription.subscriptionType}</p>
            </div>
            {subscription.plan === 'ENTERPRISE' && (
              <div>
                <p className="text-sm text-muted-foreground">Hosting</p>
                <p className="font-medium">
                  {formatHosting(subscription.hostingDeployment)}
                </p>
              </div>
            )}
          </div>

          <PlanCapabilitiesGrid
            plan={subscription.planDefinition}
            limits={subscription.effectiveLimits}
          />
          {!subscription.effectiveLimits && (
            <p className="text-sm text-muted-foreground">
              Negotiated limits have not been configured yet.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Manage Subscription</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="max-w-sm space-y-2">
              <Label htmlFor="managed-subscription-plan">
                Subscription Plan
              </Label>
              <Select value={form.plan} onValueChange={handlePlanChange}>
                <SelectTrigger
                  id="managed-subscription-plan"
                  className="w-full"
                >
                  <SelectValue>{selectedPlan.displayName}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan.value} value={plan.value}>
                      {plan.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {form.plan === 'FREE' && (
              <div className="space-y-3">
                <p className="font-medium">$0/month</p>
                <PlanCapabilitiesGrid plan={selectedPlan} />
                <p className="text-sm text-muted-foreground">
                  FREE uses fixed defaults and cannot be negotiated.
                </p>
              </div>
            )}

            {form.plan === 'TEAM' && (
              <div className="space-y-4">
                <div className="max-w-sm space-y-2">
                  <Label htmlFor="team-price">
                    Subscription Price (USD/month)
                  </Label>
                  <Input
                    id="team-price"
                    type="number"
                    min="5.99"
                    step="0.01"
                    value={form.customPrice}
                    onChange={(event) => {
                      setForm((current) => ({
                        ...current,
                        customPrice: event.target.value,
                      }))
                      setSaved(false)
                    }}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Standard TEAM starts at $5.99/month.
                  </p>
                </div>
                <SubscriptionLimitFields
                  values={form.limits}
                  onChange={updateLimit}
                  allowUnlimited={false}
                />
                <PlanCapabilitiesGrid
                  plan={selectedPlan}
                  showLimits={false}
                />
              </div>
            )}

            {form.plan === 'ENTERPRISE' && (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="enterprise-price">
                      Subscription Price (USD/month)
                    </Label>
                    <Input
                      id="enterprise-price"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={form.customPrice}
                      onChange={(event) => {
                        setForm((current) => ({
                          ...current,
                          customPrice: event.target.value,
                        }))
                        setSaved(false)
                      }}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="enterprise-hosting">
                      Hosting Deployment
                    </Label>
                    <Select
                      value={form.hostingDeployment}
                      onValueChange={(value) => {
                        setForm((current) => ({
                          ...current,
                          hostingDeployment: value,
                        }))
                        setSaved(false)
                      }}
                      required
                    >
                      <SelectTrigger
                        id="enterprise-hosting"
                        className="w-full"
                      >
                        <SelectValue>
                          {formatHosting(form.hostingDeployment)}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CLOUD">Cloud Hosted</SelectItem>
                        <SelectItem value="ON_PREMISE">On-Premise</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <SubscriptionLimitFields
                  values={form.limits}
                  onChange={updateLimit}
                  allowUnlimited
                />
                <PlanCapabilitiesGrid
                  plan={selectedPlan}
                  showLimits={false}
                />
              </div>
            )}

            {saved && (
              <p className="text-sm" role="status">
                Subscription saved.
              </p>
            )}

            <Button type="submit">Save Subscription</Button>
          </form>
        </CardContent>
      </Card>
    </section>
  )
}

export default CompanySubscriptionDetailPage
