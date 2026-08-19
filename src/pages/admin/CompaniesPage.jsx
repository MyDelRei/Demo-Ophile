import { useEffect, useState } from 'react'
import { BanIcon, CheckIcon, EyeIcon, PencilIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import {
  createOrganisation,
  getOrganisations,
  updateOrganisation,
  updateOrganisationStatus,
} from '@/api/organisationApi'
import {
  createCompanySubscription,
  getCompanySubscriptions,
  getSubscriptionPlans,
} from '@/api/subscriptionApi'
import IconActionButton from '@/components/common/IconActionButton'
import PlanCapabilitiesGrid from '@/components/common/PlanCapabilitiesGrid'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const emptyCompanyForm = {
  name: '',
  legalName: '',
  code: '',
  email: '',
  phone: '',
  address: '',
}

const emptyCreateForm = {
  ...emptyCompanyForm,
  subscriptionPlan: 'FREE',
}

function formatDate(value) {
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(
    new Date(value),
  )
}

function normalizeCompanyForm(values) {
  return {
    name: values.name.trim(),
    legalName: values.legalName.trim(),
    code: values.code.trim().toUpperCase(),
    email: values.email.trim().toLowerCase(),
    phone: values.phone.trim(),
    address: values.address.trim(),
  }
}

function CompanyProfileFields({ formId, values, onChange }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor={`${formId}-name`}>Company Name</Label>
        <Input
          id={`${formId}-name`}
          value={values.name}
          onChange={(event) => onChange('name', event.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${formId}-legal-name`}>Legal Name</Label>
        <Input
          id={`${formId}-legal-name`}
          value={values.legalName}
          onChange={(event) => onChange('legalName', event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${formId}-code`}>Company Code</Label>
        <Input
          id={`${formId}-code`}
          value={values.code}
          onChange={(event) => onChange('code', event.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${formId}-email`}>Official Email</Label>
        <Input
          id={`${formId}-email`}
          type="email"
          value={values.email}
          onChange={(event) => onChange('email', event.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${formId}-phone`}>Telephone</Label>
        <Input
          id={`${formId}-phone`}
          type="tel"
          value={values.phone}
          onChange={(event) => onChange('phone', event.target.value)}
          required
        />
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label htmlFor={`${formId}-address`}>Physical Address</Label>
        <Input
          id={`${formId}-address`}
          value={values.address}
          onChange={(event) => onChange('address', event.target.value)}
        />
      </div>
    </div>
  )
}

function CreateCompanyDialog({
  open,
  onOpenChange,
  values,
  plans,
  onChange,
  onSubmit,
}) {
  const selectedPlan = plans.find(
    (plan) => plan.value === values.subscriptionPlan,
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Create Company</DialogTitle>
          <DialogDescription>
            Add a Company profile and select its starting subscription plan.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-6" onSubmit={onSubmit}>
          <section className="space-y-4">
            <h3 className="font-medium">Company Information</h3>
            <CompanyProfileFields
              formId="create-company"
              values={values}
              onChange={onChange}
            />
          </section>

          <section className="space-y-4">
            <h3 className="font-medium">Starting Subscription</h3>
            <div className="max-w-sm space-y-2">
              <Label htmlFor="create-company-plan">Subscription Plan</Label>
              <Select
                value={values.subscriptionPlan}
                onValueChange={(value) => onChange('subscriptionPlan', value)}
                name="subscriptionPlan"
                required
              >
                <SelectTrigger id="create-company-plan" className="w-full">
                  <SelectValue>{selectedPlan?.displayName}</SelectValue>
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

            {selectedPlan && (
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Default Pricing
                  </p>
                  <p className="font-medium">{selectedPlan.pricingDisplay}</p>
                </div>
                <h4 className="text-sm font-medium">
                  Default Plan Limits &amp; Features
                </h4>
                <PlanCapabilitiesGrid plan={selectedPlan} />
              </div>
            )}
          </section>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Create</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function EditCompanyDialog({
  open,
  onOpenChange,
  values,
  onChange,
  onSubmit,
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Edit Company Profile</DialogTitle>
          <DialogDescription>
            Update Company information. Subscription changes are managed under
            Subscription Management.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-6" onSubmit={onSubmit}>
          <CompanyProfileFields
            formId="edit-company"
            values={values}
            onChange={onChange}
          />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function CompaniesPage() {
  const [organisations, setOrganisations] = useState([])
  const [subscriptions, setSubscriptions] = useState([])
  const [plans, setPlans] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState(emptyCreateForm)
  const [editingOrganisation, setEditingOrganisation] = useState(null)
  const [editForm, setEditForm] = useState(emptyCompanyForm)
  const [statusOrganisation, setStatusOrganisation] = useState(null)
  const navigate = useNavigate()

  async function refreshCompanies() {
    const [items, subscriptionItems] = await Promise.all([
      getOrganisations(),
      getCompanySubscriptions(),
    ])
    setOrganisations(items)
    setSubscriptions(subscriptionItems)
    setIsLoading(false)
  }

  useEffect(() => {
    refreshCompanies()
    getSubscriptionPlans().then(setPlans)
  }, [])

  async function handleCreate(event) {
    event.preventDefault()
    const organisation = await createOrganisation(
      normalizeCompanyForm(createForm),
    )
    await createCompanySubscription(
      organisation.id,
      createForm.subscriptionPlan,
    )
    setCreateForm(emptyCreateForm)
    setCreateOpen(false)
    await refreshCompanies()
  }

  function openEditDialog(organisation) {
    setEditingOrganisation(organisation)
    setEditForm({
      name: organisation.name ?? '',
      legalName: organisation.legalName ?? '',
      code: organisation.code ?? '',
      email: organisation.email ?? '',
      phone: organisation.phone ?? '',
      address: organisation.address ?? '',
    })
  }

  async function handleEdit(event) {
    event.preventDefault()
    await updateOrganisation(
      editingOrganisation.id,
      normalizeCompanyForm(editForm),
    )
    setEditingOrganisation(null)
    await refreshCompanies()
  }

  async function handleStatusChange() {
    const nextStatus =
      statusOrganisation.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'
    await updateOrganisationStatus(statusOrganisation.id, nextStatus)
    setStatusOrganisation(null)
    await refreshCompanies()
  }

  function getCompanySubscription(companyId) {
    return subscriptions.find(
      (subscription) => subscription.companyId === companyId,
    )
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Company Profiles</h1>
          <p className="text-muted-foreground">
            View and manage Company information on the Ophile platform.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>Create Company</Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company Name</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6}>Loading companies...</TableCell>
              </TableRow>
            ) : (
              organisations.map((organisation) => {
                const subscription = getCompanySubscription(organisation.id)

                return (
                  <TableRow key={organisation.id}>
                    <TableCell className="font-medium">
                      {organisation.name}
                    </TableCell>
                    <TableCell>{organisation.code}</TableCell>
                    <TableCell>
                      <Badge>{subscription?.plan ?? '—'}</Badge>
                    </TableCell>
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
                    <TableCell>{formatDate(organisation.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <IconActionButton
                          icon={EyeIcon}
                          variant="outline"
                          title={`View ${organisation.name}`}
                          onClick={() =>
                            navigate(`/admin/organisations/${organisation.id}`)
                          }
                        />
                        <IconActionButton
                          icon={PencilIcon}
                          variant="outline"
                          title={`Edit ${organisation.name}`}
                          onClick={() => openEditDialog(organisation)}
                        />
                        <IconActionButton
                          icon={
                            organisation.status === 'ACTIVE'
                              ? BanIcon
                              : CheckIcon
                          }
                          variant="outline"
                          title={`${
                            organisation.status === 'ACTIVE'
                              ? 'Suspend'
                              : 'Activate'
                          } ${organisation.name}`}
                          onClick={() => setStatusOrganisation(organisation)}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <CreateCompanyDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        values={createForm}
        plans={plans}
        onChange={(field, value) =>
          setCreateForm((current) => ({ ...current, [field]: value }))
        }
        onSubmit={handleCreate}
      />

      <EditCompanyDialog
        open={Boolean(editingOrganisation)}
        onOpenChange={(open) => {
          if (!open) setEditingOrganisation(null)
        }}
        values={editForm}
        onChange={(field, value) =>
          setEditForm((current) => ({ ...current, [field]: value }))
        }
        onSubmit={handleEdit}
      />

      <Dialog
        open={Boolean(statusOrganisation)}
        onOpenChange={(open) => {
          if (!open) setStatusOrganisation(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {statusOrganisation?.status === 'ACTIVE'
                ? 'Suspend Company'
                : 'Activate Company'}
            </DialogTitle>
            <DialogDescription>
              Confirm this status change for {statusOrganisation?.name}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setStatusOrganisation(null)}
            >
              Cancel
            </Button>
            <Button onClick={handleStatusChange}>
              Confirm{' '}
              {statusOrganisation?.status === 'ACTIVE'
                ? 'Suspend'
                : 'Activate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}

export default CompaniesPage
