import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { createNegotiation } from '@/api/negotiationApi'
import { getOrganisations } from '@/api/organisationApi'
import {
  getCompanySubscriptions,
  getSubscriptionPlans,
} from '@/api/subscriptionApi'
import { Badge } from '@/components/ui/badge'
import DatePicker from '@/components/common/DatePicker'
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

function createFeatures(plan) {
  const isTeam = plan.value === 'TEAM'
  return {
    organizationAdminLimit: isTeam ? plan.organizationAdminLimit : '',
    helpDeskLimit: isTeam ? plan.helpDeskLimit : '',
    userLimit: isTeam ? plan.userLimit : '',
    dailyTicketLimit: isTeam ? plan.dailyTicketLimit : '',
    unlimitedOrganizationAdmins: false,
    unlimitedHelpDesk: false,
    unlimitedUsers: false,
    unlimitedDailyTickets: false,
    reportsAccess: plan.reportsAccess,
    advancedPermissionMatrix: isTeam
      ? false
      : plan.advancedPermissionMatrix,
  }
}

function CreateNegotiationPage() {
  const [companies, setCompanies] = useState(undefined)
  const [subscriptions, setSubscriptions] = useState(undefined)
  const [plans, setPlans] = useState(undefined)
  const [form, setForm] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    let isActive = true

    async function loadFormData() {
      const [companyItems, subscriptionItems, planItems] = await Promise.all([
        getOrganisations(),
        getCompanySubscriptions(),
        getSubscriptionPlans(),
      ])
      const teamPlan = planItems.find((plan) => plan.value === 'TEAM')

      if (isActive) {
        setCompanies(companyItems)
        setSubscriptions(subscriptionItems)
        setPlans(planItems.filter((plan) => plan.value !== 'FREE'))
        setForm({
          companyId: '',
          plan: 'TEAM',
          startDate: '2026-08-11',
          periodValue: 12,
          periodUnit: 'MONTHS',
          negotiatedAmount: 12.99,
          billingFrequency: 'MONTHLY',
          features: createFeatures(teamPlan),
          hostingDeployment: 'CLOUD',
        })
      }
    }

    loadFormData()
    return () => {
      isActive = false
    }
  }, [])

  if (!companies || !subscriptions || !plans || !form) {
    return <p>Loading negotiation form...</p>
  }

  const selectedCompany = companies.find(
    (company) => company.id === form.companyId,
  )
  const selectedSubscription = subscriptions.find(
    (subscription) => subscription.companyId === form.companyId,
  )
  const selectedPlan = plans.find((plan) => plan.value === form.plan)

  function updateFeature(field, value) {
    setForm((current) => ({
      ...current,
      features: { ...current.features, [field]: value },
    }))
  }

  function handlePlanChange(planValue) {
    const plan = plans.find((item) => item.value === planValue)
    setForm((current) => ({
      ...current,
      plan: planValue,
      negotiatedAmount: planValue === 'TEAM' ? 12.99 : '',
      features: createFeatures(plan),
      hostingDeployment: 'CLOUD',
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const isEnterprise = form.plan === 'ENTERPRISE'
    const features = Object.fromEntries(
      limitFields.flatMap(({ limitKey, unlimitedKey }) => {
        const unlimited = isEnterprise && form.features[unlimitedKey]
        return [
          [
            limitKey,
            unlimited ? null : Number(form.features[limitKey]),
          ],
          [unlimitedKey, Boolean(unlimited)],
        ]
      }),
    )
    features.reportsAccess = Boolean(form.features.reportsAccess)
    features.advancedPermissionMatrix =
      form.plan === 'TEAM'
        ? false
        : Boolean(form.features.advancedPermissionMatrix)

    const negotiation = await createNegotiation({
      ...form,
      features,
    })
    navigate(`/admin/subscriptions/negotiations/${negotiation.id}`)
  }

  return (
    <section className="space-y-6">
      <div className="space-y-4">
        <Button
          variant="outline"
          onClick={() => navigate('/admin/subscriptions/negotiations')}
        >
          Back to Negotiations
        </Button>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Create Negotiation</h1>
          <p className="text-muted-foreground">
            Define a demo TEAM or Enterprise subscription agreement.
          </p>
        </div>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Company</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="max-w-md space-y-2">
              <Label htmlFor="negotiation-company">Company</Label>
              <Select
                value={form.companyId}
                onValueChange={(value) =>
                  setForm((current) => ({ ...current, companyId: value }))
                }
                required
              >
                <SelectTrigger id="negotiation-company" className="w-full">
                  <SelectValue>
                    {selectedCompany?.name ?? 'Select a Company'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedCompany && (
              <div className="grid gap-4 rounded-lg border p-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <p className="text-sm text-muted-foreground">Company Name</p>
                  <p className="font-medium">{selectedCompany.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Company Code</p>
                  <p className="font-medium">{selectedCompany.code}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium">
                    {selectedCompany.address || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Telephone</p>
                  <p className="font-medium">{selectedCompany.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Current Subscription Plan
                  </p>
                  <Badge className="mt-1">
                    {selectedSubscription?.plan ?? 'UNASSIGNED'}
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Plan &amp; Contract Period</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="negotiated-plan">Negotiated Plan</Label>
              <Select value={form.plan} onValueChange={handlePlanChange}>
                <SelectTrigger id="negotiated-plan" className="w-full">
                  <SelectValue>{form.plan}</SelectValue>
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
            <div className="space-y-2">
              <Label htmlFor="negotiation-start-date">Start Date</Label>
              <DatePicker
                id="negotiation-start-date"
                value={form.startDate}
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    startDate: value,
                  }))
                }
                placeholder="Select start date"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="period-value">Period Value</Label>
              <Input
                id="period-value"
                type="number"
                min="1"
                step="1"
                value={form.periodValue}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    periodValue: event.target.value,
                  }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="period-unit">Period Unit</Label>
              <Select
                value={form.periodUnit}
                onValueChange={(value) =>
                  setForm((current) => ({ ...current, periodUnit: value }))
                }
              >
                <SelectTrigger id="period-unit" className="w-full">
                  <SelectValue>
                    {form.periodUnit === 'YEARS' ? 'Years' : 'Months'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MONTHS">Months</SelectItem>
                  <SelectItem value="YEARS">Years</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Negotiated Price</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="negotiated-amount">
                Negotiated Amount (USD)
              </Label>
              <Input
                id="negotiated-amount"
                type="number"
                min={form.plan === 'TEAM' ? '5.99' : '0.01'}
                step="0.01"
                value={form.negotiatedAmount}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    negotiatedAmount: event.target.value,
                  }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="billing-frequency">Billing Frequency</Label>
              <Select
                value={form.billingFrequency}
                onValueChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    billingFrequency: value,
                  }))
                }
              >
                <SelectTrigger id="billing-frequency" className="w-full">
                  <SelectValue>
                    {
                      {
                        MONTHLY: 'Monthly',
                        QUARTERLY: 'Quarterly',
                        YEARLY: 'Yearly',
                        ONE_TIME: 'One-Time',
                      }[form.billingFrequency]
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MONTHLY">Monthly</SelectItem>
                  <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                  <SelectItem value="YEARLY">Yearly</SelectItem>
                  <SelectItem value="ONE_TIME">One-Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Negotiated Features &amp; Limits</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              {limitFields.map(({ limitKey, unlimitedKey, label }) => (
                <div key={limitKey} className="space-y-2 rounded-lg border p-3">
                  <Label htmlFor={`negotiation-${limitKey}`}>{label}</Label>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Input
                      id={`negotiation-${limitKey}`}
                      type="number"
                      min={
                        form.plan === 'TEAM' ? selectedPlan[limitKey] : '1'
                      }
                      step="1"
                      value={form.features[limitKey]}
                      onChange={(event) =>
                        updateFeature(limitKey, event.target.value)
                      }
                      disabled={
                        form.plan === 'ENTERPRISE' &&
                        form.features[unlimitedKey]
                      }
                      required={
                        form.plan !== 'ENTERPRISE' ||
                        !form.features[unlimitedKey]
                      }
                    />
                    {form.plan === 'ENTERPRISE' && (
                      <label
                        className="flex shrink-0 items-center gap-2 text-sm"
                        htmlFor={`negotiation-${unlimitedKey}`}
                      >
                        <input
                          id={`negotiation-${unlimitedKey}`}
                          type="checkbox"
                          className="size-4 accent-primary"
                          checked={form.features[unlimitedKey]}
                          onChange={(event) =>
                            updateFeature(unlimitedKey, event.target.checked)
                          }
                        />
                        Unlimited
                      </label>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="negotiation-reports">Reports Access</Label>
                <Select
                  value={form.features.reportsAccess ? 'YES' : 'NO'}
                  onValueChange={(value) =>
                    updateFeature('reportsAccess', value === 'YES')
                  }
                >
                  <SelectTrigger id="negotiation-reports" className="w-full">
                    <SelectValue>
                      {form.features.reportsAccess ? 'Yes' : 'No'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="YES">Yes</SelectItem>
                    <SelectItem value="NO">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Advanced Permission Matrix</Label>
                {form.plan === 'TEAM' ? (
                  <div className="flex h-8 items-center">
                    <Badge variant="secondary">Not Available for TEAM</Badge>
                  </div>
                ) : (
                  <Select
                    value={
                      form.features.advancedPermissionMatrix ? 'YES' : 'NO'
                    }
                    onValueChange={(value) =>
                      updateFeature(
                        'advancedPermissionMatrix',
                        value === 'YES',
                      )
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        {form.features.advancedPermissionMatrix
                          ? 'Available'
                          : 'Not Available'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="YES">Available</SelectItem>
                      <SelectItem value="NO">Not Available</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>

              {form.plan === 'ENTERPRISE' && (
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="negotiation-hosting">
                    Hosting Deployment
                  </Label>
                  <Select
                    value={form.hostingDeployment}
                    onValueChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        hostingDeployment: value,
                      }))
                    }
                  >
                    <SelectTrigger
                      id="negotiation-hosting"
                      className="w-full"
                    >
                      <SelectValue>
                        {form.hostingDeployment === 'ON_PREMISE'
                          ? 'On-Premise'
                          : 'Cloud Hosted'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CLOUD">Cloud Hosted</SelectItem>
                      <SelectItem value="ON_PREMISE">On-Premise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/admin/subscriptions/negotiations')}
          >
            Cancel
          </Button>
          <Button type="submit">Create Negotiation</Button>
        </div>
      </form>
    </section>
  )
}

export default CreateNegotiationPage
