import GlassPanel from '@/components/glass/GlassPanel'
import DatePicker from '@/components/common/DatePicker'
import { glassFormControlClass } from '@/components/glass/glassStyles'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { calculateAge } from '@/lib/dateUtils'
import {
  identityTypeLabels,
  userRoleLabels,
  userRoleOptions,
} from '@/lib/userOptions'

function UserForm({
  availableGroups,
  form,
  formId,
  onCancel,
  onFieldChange,
  onGroupToggle,
  onSubmit,
  readOnlyGroupLabel,
  roleReadOnly = false,
  roleDisabled = false,
  roleDisabledMessage = 'You cannot change your own system role.',
  submitLabel,
}) {
  const age = calculateAge(form.birthDate)
  const today = new Date()
  const earliestBirthDate = new Date(today.getFullYear() - 120, 0, 1)
  const defaultBirthMonth = new Date(
    today.getFullYear() - 25,
    today.getMonth(),
    1,
  )

  return (
    <form className="space-y-6" onSubmit={onSubmit}>
      <GlassPanel>
        <div className="mb-5">
          <h2 className="font-semibold">Personal Information</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Record the user&apos;s contact and personal details.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`${formId}-first-name`}>First Name</Label>
            <Input
              className={glassFormControlClass}
              id={`${formId}-first-name`}
              value={form.firstName}
              onChange={(event) =>
                onFieldChange('firstName', event.target.value)
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${formId}-last-name`}>Last Name</Label>
            <Input
              className={glassFormControlClass}
              id={`${formId}-last-name`}
              value={form.lastName}
              onChange={(event) =>
                onFieldChange('lastName', event.target.value)
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${formId}-birth-date`}>Birth Date</Label>
            <DatePicker
              id={`${formId}-birth-date`}
              value={form.birthDate}
              onChange={(value) => onFieldChange('birthDate', value)}
              placeholder="Select birth date"
              minDate={earliestBirthDate}
              maxDate={today}
              defaultMonth={defaultBirthMonth}
              captionLayout="dropdown"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${formId}-age`}>Age</Label>
            <Input
              className={`${glassFormControlClass} bg-muted/85`}
              id={`${formId}-age`}
              value={age ?? '—'}
              readOnly
              aria-readonly="true"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${formId}-identity-type`}>ID Type</Label>
            <Select
              value={form.identityType || 'NONE'}
              onValueChange={(value) =>
                onFieldChange('identityType', value === 'NONE' ? '' : value)
              }
            >
              <SelectTrigger
                id={`${formId}-identity-type`}
                className={`${glassFormControlClass} w-full`}
              >
                <SelectValue>
                  {identityTypeLabels[form.identityType] ?? 'Not specified'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">Not specified</SelectItem>
                <SelectItem value="NATIONAL_ID">National ID</SelectItem>
                <SelectItem value="PASSPORT">Passport</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${formId}-telephone`}>Telephone</Label>
            <Input
              className={glassFormControlClass}
              id={`${formId}-telephone`}
              type="tel"
              value={form.telephone}
              onChange={(event) =>
                onFieldChange('telephone', event.target.value)
              }
              required
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor={`${formId}-email`}>Email</Label>
            <Input
              className={glassFormControlClass}
              id={`${formId}-email`}
              type="email"
              value={form.email}
              onChange={(event) => onFieldChange('email', event.target.value)}
              required
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor={`${formId}-current-address`}>
              Current Address
            </Label>
            <Input
              className={glassFormControlClass}
              id={`${formId}-current-address`}
              value={form.currentAddress}
              onChange={(event) =>
                onFieldChange('currentAddress', event.target.value)
              }
            />
          </div>
        </div>
      </GlassPanel>

      <GlassPanel>
        <div className="mb-5">
          <h2 className="font-semibold">Employment</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {readOnlyGroupLabel
              ? 'Position is optional. Help Desk permissions come from the User Type, not Group membership.'
              : 'Position and Group membership are independent from the Ophile role.'}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`${formId}-position`}>Position</Label>
            <Input
              className={glassFormControlClass}
              id={`${formId}-position`}
              value={form.position}
              onChange={(event) =>
                onFieldChange('position', event.target.value)
              }
            />
          </div>
          {readOnlyGroupLabel ? (
            <div className="space-y-2">
              <Label>Group</Label>
              <div className="flex min-h-9 items-center justify-between gap-3 rounded-md border border-input bg-muted/85 px-3 py-2 text-sm shadow-xs">
                <span>{readOnlyGroupLabel}</span>
                <Badge variant="secondary">Default</Badge>
              </div>
            </div>
          ) : (
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">Groups</legend>
              <div className="max-h-52 space-y-1 overflow-y-auto rounded-xl border border-border/80 bg-background/85 p-2 shadow-sm">
                {availableGroups.length === 0 ? (
                  <p className="p-2 text-sm text-muted-foreground">
                    No active Groups available.
                  </p>
                ) : (
                  availableGroups.map((group) => {
                    const isSystemGroup = group.system

                    return (
                      <label
                        key={group.id}
                        className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted/60 has-disabled:cursor-not-allowed has-disabled:opacity-75"
                      >
                        <input
                          className="size-4 accent-current"
                          type="checkbox"
                          checked={
                            isSystemGroup
                              ? form.role === 'HELP_DESK'
                              : form.groupIds.includes(group.id)
                          }
                          disabled={isSystemGroup}
                          onChange={() => onGroupToggle(group.id)}
                        />
                        <span className="min-w-0 flex-1 truncate text-sm">
                          {group.name}
                        </span>
                        {isSystemGroup && (
                          <Badge variant="secondary">System</Badge>
                        )}
                        {group.status === 'INACTIVE' && (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </label>
                    )
                  })
                )}
              </div>
            </fieldset>
          )}
        </div>
      </GlassPanel>

      <GlassPanel>
        <div className="mb-5">
          <h2 className="font-semibold">Ophile Account</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure login access without changing Group membership rules.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`${formId}-login-id`}>Login ID</Label>
            <Input
              className={glassFormControlClass}
              id={`${formId}-login-id`}
              value={form.loginId}
              onChange={(event) =>
                onFieldChange('loginId', event.target.value)
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${formId}-role`}>
              {roleReadOnly ? 'User Type' : 'Role'}
            </Label>
            {roleReadOnly ? (
              <Input
                id={`${formId}-role`}
                className={`${glassFormControlClass} bg-muted/85`}
                value={userRoleLabels[form.role] ?? form.role}
                readOnly
                aria-readonly="true"
              />
            ) : (
              <Select
                value={form.role}
                disabled={roleDisabled}
                onValueChange={(value) => onFieldChange('role', value)}
              >
                <SelectTrigger
                  id={`${formId}-role`}
                  className={`${glassFormControlClass} w-full`}
                >
                  <SelectValue>{userRoleLabels[form.role]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {userRoleOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {roleDisabled && !roleReadOnly && (
              <p className="text-xs text-muted-foreground">
                {roleDisabledMessage}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${formId}-status`}>Account Status</Label>
            <Select
              value={form.active ? 'ACTIVE' : 'INACTIVE'}
              onValueChange={(value) =>
                onFieldChange('active', value === 'ACTIVE')
              }
            >
              <SelectTrigger
                id={`${formId}-status`}
                className={`${glassFormControlClass} w-full`}
              >
                <SelectValue>{form.active ? 'Active' : 'Inactive'}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </GlassPanel>

      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  )
}

export default UserForm
