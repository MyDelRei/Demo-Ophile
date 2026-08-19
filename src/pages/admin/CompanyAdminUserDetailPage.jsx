import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { getOrganisationById } from '@/api/organisationApi'
import { getOrganisationAdminById } from '@/api/userApi'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const identityTypeLabels = {
  PASSPORT: 'Passport',
  NATIONAL_ID: 'National ID',
  GOVERNMENT_RECOGNITION_LETTER: 'Government Recognition Letter',
}

function displayValue(value) {
  return value || '—'
}

function CompanyAdminUserDetailPage() {
  const [company, setCompany] = useState(undefined)
  const [admin, setAdmin] = useState(undefined)
  const { companyId, userId } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    let isActive = true

    async function loadProfile() {
      const [companyItem, adminItem] = await Promise.all([
        getOrganisationById(companyId),
        getOrganisationAdminById(companyId, userId),
      ])

      if (isActive) {
        setCompany(companyItem)
        setAdmin(adminItem)
      }
    }

    loadProfile()

    return () => {
      isActive = false
    }
  }, [companyId, userId])

  if (company === undefined || admin === undefined) {
    return <p>Loading Company Admin profile...</p>
  }

  if (!company || !admin) {
    return (
      <section className="space-y-4">
        <h1 className="text-2xl font-semibold">Company Admin not found</h1>
        <Button
          variant="outline"
          onClick={() =>
            navigate(`/admin/organisation-admins/${companyId}`)
          }
        >
          Back to Company Admins
        </Button>
      </section>
    )
  }

  const displayName =
    [admin.firstName, admin.lastName].filter(Boolean).join(' ') || admin.name

  return (
    <section className="space-y-6">
      <div className="space-y-4">
        <Button
          variant="outline"
          onClick={() =>
            navigate(`/admin/organisation-admins/${companyId}`)
          }
        >
          Back to Company Admins
        </Button>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">{displayName}</h1>
          <p className="text-muted-foreground">
            View the Company Admin profile information.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">Company Name</p>
            <p className="font-medium">{company.name}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Telephone</p>
            <p className="font-medium">{displayValue(company.phone)}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm text-muted-foreground">Company Address</p>
            <p className="font-medium">{displayValue(company.address)}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">Login ID</p>
            <p className="font-medium">{admin.loginId}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="font-medium">{admin.email}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">First Name</p>
            <p className="font-medium">{displayValue(admin.firstName)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Last Name</p>
            <p className="font-medium">{displayValue(admin.lastName)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Birth Date</p>
            <p className="font-medium">{displayValue(admin.birthDate)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Current Address</p>
            <p className="font-medium">{displayValue(admin.currentAddress)}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm text-muted-foreground">Photo</p>
            <p className="font-medium">{displayValue(admin.photo)}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Employment &amp; Identity</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">Position</p>
            <p className="font-medium">{displayValue(admin.position)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Identity Type</p>
            <p className="font-medium">
              {displayValue(identityTypeLabels[admin.identityType])}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">User Type</p>
            <p className="font-medium">Organization Admin</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <Badge
              className="mt-1"
              variant={admin.active ? 'default' : 'secondary'}
            >
              {admin.active ? 'ACTIVE' : 'INACTIVE'}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}

export default CompanyAdminUserDetailPage
