import { useEffect, useState } from 'react'
import { EyeIcon, UserPlusIcon } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'

import { getOrganisationById } from '@/api/organisationApi'
import { getOrganisationAdmins } from '@/api/userApi'
import CreateCompanyAdminDialog from '@/components/common/CreateCompanyAdminDialog'
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

function CompanyAdminDetailPage() {
  const [organisation, setOrganisation] = useState(undefined)
  const [organisationAdmins, setOrganisationAdmins] = useState(undefined)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const { organisationId } = useParams()
  const navigate = useNavigate()

  async function refreshAdmins() {
    setOrganisationAdmins(await getOrganisationAdmins(organisationId))
  }

  useEffect(() => {
    let isActive = true

    async function loadDetails() {
      const [organisationItem, admins] = await Promise.all([
        getOrganisationById(organisationId),
        getOrganisationAdmins(organisationId),
      ])

      if (isActive) {
        setOrganisation(organisationItem)
        setOrganisationAdmins(admins)
      }
    }

    loadDetails()

    return () => {
      isActive = false
    }
  }, [organisationId])

  if (organisation === undefined || organisationAdmins === undefined) {
    return <p>Loading company admin details...</p>
  }

  if (!organisation) {
    return (
      <section className="space-y-4">
        <h1 className="text-2xl font-semibold">Company not found</h1>
        <Button
          variant="outline"
          onClick={() => navigate('/admin/organisation-admins')}
        >
          Back to Company Admin Management
        </Button>
      </section>
    )
  }

  return (
    <section className="space-y-6">
      <div className="space-y-4">
        <Button
          variant="outline"
          onClick={() => navigate('/admin/organisation-admins')}
        >
          Back to Company Admin Management
        </Button>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">
            Company Admin Management
          </h1>
          <p className="text-muted-foreground">
            View the company and its Company Admin accounts.
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
            <p className="font-medium">{organisation.name}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Company Code</p>
            <p className="font-medium">{organisation.code}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              Company Status
            </p>
            <Badge
              className="mt-1"
              variant={
                organisation.status === 'ACTIVE' ? 'default' : 'secondary'
              }
            >
              {organisation.status}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Company Admins</h2>

        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Login ID</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {organisationAdmins.length > 0 ? (
                organisationAdmins.map((admin) => {
                  const displayName =
                    [admin.firstName, admin.lastName]
                      .filter(Boolean)
                      .join(' ') || admin.name

                  return (
                    <TableRow key={admin.id}>
                      <TableCell className="font-medium">
                        {displayName}
                      </TableCell>
                      <TableCell>{admin.loginId}</TableCell>
                      <TableCell>{admin.email}</TableCell>
                      <TableCell>{admin.position || '—'}</TableCell>
                      <TableCell>
                        <Badge
                          variant={admin.active ? 'default' : 'secondary'}
                        >
                          {admin.active ? 'ACTIVE' : 'INACTIVE'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <IconActionButton
                          icon={EyeIcon}
                          variant="outline"
                          title={`View ${displayName}`}
                          onClick={() =>
                            navigate(
                              `/admin/organisation-admins/${organisationId}/users/${admin.id}`,
                            )
                          }
                        />
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground"
                  >
                    No Admin
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex justify-end">
          <IconActionButton
            icon={UserPlusIcon}
            variant="outline"
            title="Add Company Admin"
            onClick={() => setCreateDialogOpen(true)}
          />
        </div>
      </div>

      <CreateCompanyAdminDialog
        organisationId={organisationId}
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreated={refreshAdmins}
      />
    </section>
  )
}

export default CompanyAdminDetailPage
