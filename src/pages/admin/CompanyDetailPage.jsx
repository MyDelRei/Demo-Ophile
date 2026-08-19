import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { getOrganisationById } from '@/api/organisationApi'
import { getCompanySubscriptionByCompanyId } from '@/api/subscriptionApi'
import { getOrganisationAdmins } from '@/api/userApi'
import CreateCompanyAdminDialog from '@/components/common/CreateCompanyAdminDialog'
import PlanCapabilitiesGrid from '@/components/common/PlanCapabilitiesGrid'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function formatDate(value) {
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(
    new Date(value),
  )
}

function displayValue(value) {
  return value || '—'
}

function formatHostingDeployment(value) {
  if (value === 'CLOUD') return 'Cloud Hosted'
  if (value === 'ON_PREMISE') return 'On-Premise'
  return 'Not configured'
}

function CompanyDetailPage() {
  const [organisation, setOrganisation] = useState(undefined)
  const [organisationAdmins, setOrganisationAdmins] = useState(undefined)
  const [subscription, setSubscription] = useState(undefined)
  const [adminDialogOpen, setAdminDialogOpen] = useState(false)
  const { organisationId } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    let isActive = true

    async function loadDetails() {
      const [organisationItem, admins, subscriptionItem] = await Promise.all([
        getOrganisationById(organisationId),
        getOrganisationAdmins(organisationId),
        getCompanySubscriptionByCompanyId(organisationId),
      ])

      if (isActive) {
        setOrganisation(organisationItem)
        setOrganisationAdmins(admins)
        setSubscription(subscriptionItem)
      }
    }

    loadDetails()

    return () => {
      isActive = false
    }
  }, [organisationId])

  if (
    organisation === undefined ||
    organisationAdmins === undefined ||
    subscription === undefined
  ) {
    return <p>Loading company...</p>
  }

  if (!organisation) {
    return (
      <section className="space-y-4">
        <h1 className="text-2xl font-semibold">Company not found</h1>
        <Button
          variant="outline"
          onClick={() => navigate('/admin/organisations')}
        >
          Back to Company Profiles
        </Button>
      </section>
    )
  }

  const organisationAdmin = organisationAdmins[0]
  const userCounts = [
    { label: 'Total Users', value: organisation.totalUsers },
    { label: 'Active Users', value: organisation.activeUsers },
    { label: 'Inactive Users', value: organisation.inactiveUsers },
  ]

  return (
    <section className="space-y-6">
      <div className="space-y-4">
        <Button
          variant="outline"
          onClick={() => navigate('/admin/organisations')}
        >
          Back to Company Profiles
        </Button>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">{organisation.name}</h1>
          <p className="text-muted-foreground">
            View Company profile and current subscription information.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">Company Name</p>
            <p className="font-medium">{organisation.name}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Legal Name</p>
            <p className="font-medium">
              {displayValue(organisation.legalName)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Company Code</p>
            <p className="font-medium">{organisation.code}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Official Email</p>
            <p className="font-medium">{displayValue(organisation.email)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Telephone</p>
            <p className="font-medium">{displayValue(organisation.phone)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Physical Address</p>
            <p className="font-medium">{displayValue(organisation.address)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <Badge
              className="mt-1"
              variant={
                organisation.status === 'ACTIVE' ? 'default' : 'secondary'
              }
            >
              {organisation.status}
            </Badge>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Created Date</p>
            <p className="font-medium">{formatDate(organisation.createdAt)}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {subscription ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-sm text-muted-foreground">Plan</p>
                  <p className="font-medium">
                    {subscription.planDefinition.displayName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Current Price
                  </p>
                  <p className="font-medium">{subscription.priceDisplay}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-medium">
                    {subscription.subscriptionType}
                  </p>
                </div>
                {subscription.plan === 'ENTERPRISE' && (
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Hosting Deployment
                    </p>
                    <p className="font-medium">
                      {formatHostingDeployment(
                        subscription.hostingDeployment,
                      )}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-medium">
                  Current Limits &amp; Features
                </h3>
                <PlanCapabilitiesGrid
                  plan={subscription.planDefinition}
                  limits={subscription.effectiveLimits}
                />
                {!subscription.effectiveLimits && (
                  <p className="text-sm text-muted-foreground">
                    Negotiated limits have not been configured yet.
                  </p>
                )}
              </div>

              <p className="text-sm text-muted-foreground">
                Subscription changes are managed from Subscription Management.
              </p>
            </>
          ) : (
            <p className="text-muted-foreground">
              No subscription has been assigned to this Company.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        {userCounts.map((count) => (
          <Card key={count.label}>
            <CardHeader>
              <CardTitle>{count.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{count.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Company Admin</CardTitle>
        </CardHeader>
        <CardContent>
          {organisationAdmin ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{organisationAdmin.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Login ID</p>
                <p className="font-medium">{organisationAdmin.loginId}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{organisationAdmin.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge
                  className="mt-1"
                  variant={organisationAdmin.active ? 'default' : 'secondary'}
                >
                  {organisationAdmin.active ? 'ACTIVE' : 'INACTIVE'}
                </Badge>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-muted-foreground">
                No Company Admin has been created for this Company.
              </p>
              <Button onClick={() => setAdminDialogOpen(true)}>
                Create Company Admin
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <CreateCompanyAdminDialog
        organisationId={organisationId}
        open={adminDialogOpen}
        onOpenChange={setAdminDialogOpen}
        onCreated={async () =>
          setOrganisationAdmins(await getOrganisationAdmins(organisationId))
        }
      />
    </section>
  )
}

export default CompanyDetailPage
