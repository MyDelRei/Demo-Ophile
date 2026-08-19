import { useEffect, useState } from 'react'
import { EyeIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { getOrganisations } from '@/api/organisationApi'
import { getOrganisationAdmins } from '@/api/userApi'
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

function CompanyAdminsPage() {
  const [organisations, setOrganisations] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    let isActive = true

    async function loadOrganisations() {
      const organisationItems = await getOrganisations()
      const itemsWithAdminStatus = await Promise.all(
        organisationItems.map(async (organisation) => {
          const admins = await getOrganisationAdmins(organisation.id)

          return {
            ...organisation,
            adminCount: admins.length,
          }
        }),
      )

      if (isActive) {
        setOrganisations(itemsWithAdminStatus)
        setIsLoading(false)
      }
    }

    loadOrganisations()

    return () => {
      isActive = false
    }
  }, [])

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">
          Company Admin Management
        </h1>
        <p className="text-muted-foreground">
          Manage Company Admin accounts for registered companies.
        </p>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company Name</TableHead>
              <TableHead>Company Code</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Admin Status</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5}>Loading companies...</TableCell>
              </TableRow>
            ) : organisations.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground"
                >
                  No companies
                </TableCell>
              </TableRow>
            ) : (
              organisations.map((organisation) => (
                <TableRow key={organisation.id}>
                  <TableCell className="font-medium">
                    {organisation.name}
                  </TableCell>
                  <TableCell>{organisation.code}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        organisation.status === 'ACTIVE'
                          ? 'default'
                          : 'secondary'
                      }
                    >
                      {organisation.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        organisation.adminCount > 0 ? 'default' : 'outline'
                      }
                    >
                      {organisation.adminCount === 0
                        ? 'No Admin'
                        : organisation.adminCount === 1
                          ? 'Admin Assigned'
                          : `${organisation.adminCount} Admins`}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <IconActionButton
                      icon={EyeIcon}
                      variant="outline"
                      title={`View ${organisation.name} company admin details`}
                      onClick={() =>
                        navigate(
                          `/admin/organisation-admins/${organisation.id}`,
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
    </section>
  )
}

export default CompanyAdminsPage
