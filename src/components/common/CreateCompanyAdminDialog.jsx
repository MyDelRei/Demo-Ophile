import { useEffect, useState } from 'react'

import { getOrganisationById } from '@/api/organisationApi'
import { createOrganisationAdmin } from '@/api/userApi'
import { Button } from '@/components/ui/button'
import DatePicker from '@/components/common/DatePicker'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const emptyAdminForm = {
  loginId: '',
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  birthDate: '',
  currentAddress: '',
  photo: '',
  position: '',
  identityType: 'PASSPORT',
  active: true,
}

const identityTypeLabels = {
  PASSPORT: 'Passport',
  NATIONAL_ID: 'National ID',
  GOVERNMENT_RECOGNITION_LETTER: 'Government Recognition Letter',
}

function displayValue(value) {
  return value || '—'
}

function CreateCompanyAdminDialog({
  organisationId,
  open,
  onOpenChange,
  onCreated,
}) {
  const [company, setCompany] = useState(undefined)
  const [adminForm, setAdminForm] = useState(emptyAdminForm)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let isActive = true

    async function loadCompany() {
      const companyItem = await getOrganisationById(organisationId)
      if (isActive) setCompany(companyItem)
    }

    loadCompany()

    return () => {
      isActive = false
    }
  }, [organisationId])

  function updateField(field, value) {
    setAdminForm((current) => ({ ...current, [field]: value }))
  }

  function handleOpenChange(nextOpen) {
    onOpenChange(nextOpen)

    if (!nextOpen) {
      setAdminForm(emptyAdminForm)
      setErrorMessage('')
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setErrorMessage('')

    try {
      const createdAdmin = await createOrganisationAdmin(
        organisationId,
        adminForm,
      )
      await onCreated(createdAdmin)
      handleOpenChange(false)
    } catch (error) {
      setErrorMessage(error.message)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Create Company Admin</DialogTitle>
          <DialogDescription>
            Create an administrator account for the selected company.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <section className="space-y-4">
            <h3 className="font-medium">Company Information</h3>
            <div className="grid gap-4 rounded-lg border bg-muted/30 p-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Company Name</p>
                <p className="font-medium">
                  {company === undefined
                    ? 'Loading...'
                    : displayValue(company?.name)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Telephone</p>
                <p className="font-medium">
                  {company === undefined
                    ? 'Loading...'
                    : displayValue(company?.phone)}
                </p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-muted-foreground">
                  Company Address
                </p>
                <p className="font-medium">
                  {company === undefined
                    ? 'Loading...'
                    : displayValue(company?.address)}
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="font-medium">Account Information</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="admin-login-id">Login ID</Label>
                <Input
                  id="admin-login-id"
                  value={adminForm.loginId}
                  onChange={(event) =>
                    updateField('loginId', event.target.value)
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-email">Email</Label>
                <Input
                  id="admin-email"
                  type="email"
                  value={adminForm.email}
                  onChange={(event) => updateField('email', event.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-password">Password</Label>
                <Input
                  id="admin-password"
                  type="password"
                  autoComplete="new-password"
                  value={adminForm.password}
                  onChange={(event) =>
                    updateField('password', event.target.value)
                  }
                  required
                />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="font-medium">Personal Information</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="admin-first-name">First Name</Label>
                <Input
                  id="admin-first-name"
                  value={adminForm.firstName}
                  onChange={(event) =>
                    updateField('firstName', event.target.value)
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-last-name">Last Name</Label>
                <Input
                  id="admin-last-name"
                  value={adminForm.lastName}
                  onChange={(event) =>
                    updateField('lastName', event.target.value)
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-birth-date">Birth Date</Label>
                <DatePicker
                  id="admin-birth-date"
                  value={adminForm.birthDate}
                  onChange={(value) => updateField('birthDate', value)}
                  placeholder="Select birth date"
                  minDate={new Date(new Date().getFullYear() - 120, 0, 1)}
                  maxDate={new Date()}
                  defaultMonth={new Date(new Date().getFullYear() - 25, 0, 1)}
                  captionLayout="dropdown"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-current-address">Current Address</Label>
                <Input
                  id="admin-current-address"
                  value={adminForm.currentAddress}
                  onChange={(event) =>
                    updateField('currentAddress', event.target.value)
                  }
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="admin-photo">Photo</Label>
                <Input
                  id="admin-photo"
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    updateField('photo', event.target.files[0]?.name ?? '')
                  }
                />
                {adminForm.photo && (
                  <p className="text-xs text-muted-foreground">
                    Demo file: {adminForm.photo}
                  </p>
                )}
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="font-medium">Employment &amp; Identity</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="admin-position">Position</Label>
                <Input
                  id="admin-position"
                  value={adminForm.position}
                  onChange={(event) =>
                    updateField('position', event.target.value)
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-identity-type">Identity Type</Label>
                <Select
                  value={adminForm.identityType}
                  onValueChange={(value) => updateField('identityType', value)}
                >
                  <SelectTrigger id="admin-identity-type" className="w-full">
                    <SelectValue>
                      {identityTypeLabels[adminForm.identityType]}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PASSPORT">Passport</SelectItem>
                    <SelectItem value="NATIONAL_ID">National ID</SelectItem>
                    <SelectItem value="GOVERNMENT_RECOGNITION_LETTER">
                      Government Recognition Letter
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-user-type">User Type</Label>
                <Input
                  id="admin-user-type"
                  value="Organization Admin"
                  readOnly
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-status">Status</Label>
                <Select
                  value={adminForm.active ? 'ACTIVE' : 'INACTIVE'}
                  onValueChange={(value) =>
                    updateField('active', value === 'ACTIVE')
                  }
                >
                  <SelectTrigger id="admin-status" className="w-full">
                    <SelectValue>
                      {adminForm.active ? 'Active' : 'Inactive'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          {errorMessage && (
            <p className="text-sm text-destructive" role="alert">
              {errorMessage}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Create Admin</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default CreateCompanyAdminDialog
