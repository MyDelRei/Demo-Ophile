import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowLeftIcon,
  Building2Icon,
  CheckIcon,
  HeadsetIcon,
  ShieldCheckIcon,
  UserRoundIcon,
  XIcon,
} from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'

import { getOrganisationById } from '@/api/organisationApi'
import {
  getAccessChanges,
  getAssignableRoleDefinitions,
  getEffectivePermissions,
  getPredefinedPermissions,
  getRoleCapabilityGroups,
  getUserPermissions,
  updateUserPermissions,
} from '@/api/permissionApi'
import { getUserById, updateUserRole } from '@/api/userApi'
import AccessChangeList from '@/components/common/AccessChangeList'
import GlassCard from '@/components/glass/GlassCard'
import GlassPanel from '@/components/glass/GlassPanel'
import GlassSection from '@/components/glass/GlassSection'
import { glassFormControlClass } from '@/components/glass/glassStyles'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAppFeedback } from '@/hooks/useAppFeedback'
import { useAuth } from '@/hooks/useAuth'
import { userRoleLabels } from '@/lib/userOptions'

const roleIcons = {
  USER: UserRoundIcon,
  HELP_DESK: HeadsetIcon,
  ORGANISATION_ADMIN: Building2Icon,
}

function IdentityValue({ children, label, value }) {
  return (
    <div className="min-w-0">
      <p className="text-sm text-muted-foreground">{label}</p>
      {children ?? <p className="break-words font-medium">{value || '—'}</p>}
    </div>
  )
}

function PermissionChoice({ disabled, enabled, label, onChange }) {
  return (
    <div
      className="inline-flex rounded-lg border border-border/80 bg-background/75 p-1"
      role="group"
      aria-label={label}
    >
      <Button
        type="button"
        size="sm"
        variant={enabled ? 'default' : 'ghost'}
        aria-pressed={enabled}
        disabled={disabled}
        onClick={() => onChange(true)}
      >
        Yes
      </Button>
      <Button
        type="button"
        size="sm"
        variant={!enabled ? 'secondary' : 'ghost'}
        aria-pressed={!enabled}
        onClick={() => onChange(false)}
      >
        No
      </Button>
    </div>
  )
}

function UserAccessDetailPage() {
  const { user: currentUser, refreshUser } = useAuth()
  const { userId } = useParams()
  const navigate = useNavigate()
  const { hideLoading, showLoading, showNotification } = useAppFeedback()
  const [targetUser, setTargetUser] = useState(undefined)
  const [organisation, setOrganisation] = useState(null)
  const [roleDefinitions, setRoleDefinitions] = useState([])
  const [capabilityGroups, setCapabilityGroups] = useState([])
  const [permissionDefinitions, setPermissionDefinitions] = useState([])
  const [permissionForm, setPermissionForm] = useState({})
  const [savedPermissionForm, setSavedPermissionForm] = useState({})
  const [effectiveAccess, setEffectiveAccess] = useState(null)
  const [accessChanges, setAccessChanges] = useState([])
  const [pendingRole, setPendingRole] = useState(null)

  const loadAccessDetails = useCallback(async function loadAccessDetails() {
    const userItem = await getUserById(
      userId,
      currentUser.organisationId,
    )

    if (!userItem) {
      setTargetUser(null)
      return
    }

    const [
      organisationItem,
      roles,
      capabilities,
      permissions,
      userPermissionItems,
      effective,
      changes,
    ] = await Promise.all([
      getOrganisationById(currentUser.organisationId),
      getAssignableRoleDefinitions(),
      getRoleCapabilityGroups(),
      getPredefinedPermissions(),
      getUserPermissions(userId, currentUser.organisationId),
      getEffectivePermissions(userId, currentUser.organisationId),
      getAccessChanges(currentUser.organisationId, { userId, limit: 10 }),
    ])
    const enabledKeys = new Set(
      userPermissionItems.map((item) => item.permission),
    )
    const nextPermissionForm = Object.fromEntries(
      permissions.map((item) => [item.key, enabledKeys.has(item.key)]),
    )

    setTargetUser(userItem)
    setOrganisation(organisationItem)
    setRoleDefinitions(roles)
    setCapabilityGroups(capabilities)
    setPermissionDefinitions(permissions)
    setPermissionForm(nextPermissionForm)
    setSavedPermissionForm(nextPermissionForm)
    setEffectiveAccess(effective)
    setAccessChanges(changes)
  }, [currentUser.organisationId, userId])

  useEffect(() => {
    let isActive = true

    async function load() {
      try {
        await loadAccessDetails()
      } catch (error) {
        if (isActive) {
          setTargetUser(null)
          showNotification(
            error.message || 'Unable to load user access.',
            'error',
          )
        }
      }
    }

    load()

    return () => {
      isActive = false
    }
  }, [loadAccessDetails, showNotification])

  const hasUnsavedPermissions = useMemo(
    () =>
      permissionDefinitions.some(
        (definition) =>
          Boolean(permissionForm[definition.key]) !==
          Boolean(savedPermissionForm[definition.key]),
      ),
    [permissionDefinitions, permissionForm, savedPermissionForm],
  )

  function updatePermission(permissionKey, enabled) {
    setPermissionForm((current) => {
      const next = { ...current, [permissionKey]: enabled }

      if (permissionKey === 'VIEW_REPORTS' && !enabled) {
        next.VIEW_GROUP_REPORTS = false
        next.EXPORT_REPORTS = false
      }

      return next
    })
  }

  async function confirmRoleChange() {
    showLoading('Updating access...')

    try {
      await updateUserRole(
        userId,
        pendingRole,
        currentUser.organisationId,
        currentUser.id,
      )
      setPendingRole(null)
      await loadAccessDetails()
      showNotification('User role updated successfully.')
    } catch (error) {
      showNotification(error.message || 'Unable to update user role.', 'error')
    } finally {
      hideLoading()
    }
  }

  async function savePermissions() {
    showLoading('Updating permissions...')

    try {
      const enabledPermissions = permissionDefinitions
        .filter((definition) => permissionForm[definition.key])
        .map((definition) => definition.key)

      await updateUserPermissions(
        userId,
        enabledPermissions,
        currentUser.organisationId,
        currentUser.id,
      )

      if (userId === currentUser.id) await refreshUser()

      await loadAccessDetails()
      showNotification('Permissions updated successfully.')
    } catch (error) {
      showNotification(
        error.message || 'Unable to update permissions.',
        'error',
      )
    } finally {
      hideLoading()
    }
  }

  if (targetUser === undefined) {
    return <p className="text-sm text-muted-foreground">Loading user access...</p>
  }

  if (!targetUser) {
    return (
      <GlassSection>
        <h1 className="text-2xl font-semibold">User access not found</h1>
        <p className="text-muted-foreground">
          This user does not exist or does not belong to your Company.
        </p>
        <Button
          variant="outline"
          onClick={() => navigate('/admin/roles-permissions')}
        >
          Back to Access Control Center
        </Button>
      </GlassSection>
    )
  }

  const isCurrentUser = targetUser.id === currentUser.id
  const RoleIcon = roleIcons[targetUser.role] ?? ShieldCheckIcon

  return (
    <GlassSection>
      <Button
        variant="outline"
        onClick={() => navigate('/admin/roles-permissions')}
      >
        <ArrowLeftIcon />
        Back to Access Control Center
      </Button>

      <GlassPanel className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-primary">User Access</p>
            <h1 className="mt-1 text-3xl font-semibold">{targetUser.name}</h1>
            <p className="mt-1 text-muted-foreground">
              Review the effective capabilities available after login.
            </p>
          </div>
          <Badge className="gap-1.5" variant="outline">
            <RoleIcon className="size-3.5" />
            {userRoleLabels[targetUser.role]}
          </Badge>
        </div>
        <div className="grid gap-4 border-t border-border/60 pt-5 sm:grid-cols-2 lg:grid-cols-3">
          <IdentityValue label="Full Name" value={targetUser.name} />
          <IdentityValue label="Login ID" value={targetUser.loginId} />
          <IdentityValue label="Email" value={targetUser.email} />
          <IdentityValue label="Status">
            <Badge className="mt-1" variant={targetUser.active ? 'default' : 'secondary'}>
              {targetUser.active ? 'Active' : 'Inactive'}
            </Badge>
          </IdentityValue>
          <IdentityValue label="Company" value={organisation?.name} />
          <IdentityValue label="Groups">
            <div className="mt-1 flex flex-wrap gap-1.5">
              {targetUser.groups.length ? (
                targetUser.groups.map((group) => (
                  <Badge key={group.id} variant="secondary">{group.name}</Badge>
                ))
              ) : (
                <span className="font-medium">—</span>
              )}
            </div>
          </IdentityValue>
        </div>
      </GlassPanel>

      <GlassPanel>
        <div className="mb-5">
          <h2 className="text-xl font-semibold">Base Role</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Base Role determines the user&apos;s core Ophile capabilities.
          </p>
        </div>
        <div className="max-w-md space-y-2">
          {isCurrentUser ? (
            <>
              <div className="flex h-10 items-center rounded-lg border border-border/80 bg-muted/70 px-3 font-medium">
                Organisation Admin
              </div>
              <p className="text-sm text-muted-foreground">
                You cannot change your own system role.
              </p>
            </>
          ) : (
            <Select
              value={targetUser.role}
              onValueChange={(value) => setPendingRole(value)}
            >
              <SelectTrigger className={`${glassFormControlClass} w-full`} aria-label="Base Role">
                <SelectValue>{userRoleLabels[targetUser.role]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {roleDefinitions.map((definition) => (
                  <SelectItem key={definition.key} value={definition.key}>
                    {definition.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </GlassPanel>

      <GlassPanel>
        <h2 className="text-xl font-semibold">Portal Access</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Portal access is determined by Base Role and cannot be toggled separately.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {effectiveAccess?.portalAccess.map((portal) => (
            <Badge key={portal} variant="default">
              {portal === 'ADMIN' ? 'Admin Portal' : 'Support Portal'}
            </Badge>
          ))}
        </div>
      </GlassPanel>

      <div className="space-y-3">
        <div>
          <h2 className="text-xl font-semibold">Effective Permission Matrix</h2>
          <p className="text-sm text-muted-foreground">
            Base-role capabilities are locked and cannot be overridden per user.
          </p>
        </div>
        <div className="grid gap-4 xl:grid-cols-3">
          {capabilityGroups.map((group) => {
            const isAllowed = group.roles.includes(targetUser.role)
            const inheritedLabel =
              group.key === 'SUPPORT_REQUESTS'
                ? 'Inherited from User capabilities'
                : group.key === 'HELP_DESK_OPERATIONS'
                  ? 'Inherited from Help Desk role'
                  : 'Inherited from Organisation Admin role'

            return (
              <GlassCard key={group.key}>
                <CardHeader>
                  <CardTitle>{group.label}</CardTitle>
                  <Badge className="w-fit" variant={isAllowed ? 'default' : 'secondary'}>
                    {isAllowed ? 'Allowed' : 'Not Available'}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  {group.capabilities.map((capability) => (
                    <div key={capability} className="flex items-start gap-2 text-sm">
                      {isAllowed ? (
                        <CheckIcon className="mt-0.5 size-4 shrink-0 text-primary" />
                      ) : (
                        <XIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                      )}
                      <div>
                        <p className={isAllowed ? 'font-medium' : 'text-muted-foreground'}>
                          {capability}
                        </p>
                        {isAllowed && (
                          <p className="text-xs text-muted-foreground">{inheritedLabel}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </GlassCard>
            )
          })}
        </div>
      </div>

      <GlassPanel>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Additional Permissions</h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Optional predefined access is additive. It cannot grant Help Desk
              or Organisation Admin capabilities.
            </p>
          </div>
          <Button disabled={!hasUnsavedPermissions} onClick={savePermissions}>
            Save Permissions
          </Button>
        </div>
        <div className="mt-5 divide-y divide-border/60">
          {permissionDefinitions.map((definition) => {
            const dependencyMissing = definition.requires.some(
              (requiredKey) => !permissionForm[requiredKey],
            )

            return (
              <div key={definition.key} className="flex flex-wrap items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
                <div className="max-w-2xl">
                  <p className="font-medium">{definition.label}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{definition.description}</p>
                  {dependencyMissing && (
                    <p className="mt-1 text-xs font-medium text-muted-foreground">
                      Requires View Reports.
                    </p>
                  )}
                </div>
                <PermissionChoice
                  label={definition.label}
                  enabled={Boolean(permissionForm[definition.key])}
                  disabled={dependencyMissing}
                  onChange={(enabled) => updatePermission(definition.key, enabled)}
                />
              </div>
            )
          })}
        </div>
      </GlassPanel>

      <GlassPanel className="border-primary/20">
        <div className="flex items-center gap-2">
          <ShieldCheckIcon className="size-5 text-primary" />
          <h2 className="text-xl font-semibold">Effective Access</h2>
        </div>
        <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <IdentityValue label="User" value={targetUser.name} />
          <IdentityValue label="Base Role" value={userRoleLabels[targetUser.role]} />
          <IdentityValue label="Inherited Capabilities">
            <ul className="mt-1 space-y-1 text-sm font-medium">
              {effectiveAccess?.inheritedCapabilityGroups.map((group) => (
                <li key={group.key}>• {group.label}</li>
              ))}
            </ul>
          </IdentityValue>
          <IdentityValue label="Additional Access">
            {effectiveAccess?.additionalPermissions.length ? (
              <ul className="mt-1 space-y-1 text-sm font-medium">
                {effectiveAccess.additionalPermissions.map((permission) => (
                  <li key={permission.key}>• {permission.label}</li>
                ))}
              </ul>
            ) : (
              <p className="font-medium">None</p>
            )}
          </IdentityValue>
        </div>
      </GlassPanel>

      <GlassPanel>
        <div className="mb-4">
          <h2 className="text-xl font-semibold">Recent Access Changes</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Role and predefined permission changes recorded for this user.
          </p>
        </div>
        <AccessChangeList
          changes={accessChanges}
          permissionDefinitions={permissionDefinitions}
        />
      </GlassPanel>

      <Dialog
        open={Boolean(pendingRole)}
        onOpenChange={(open) => {
          if (!open) setPendingRole(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Base Role</DialogTitle>
            <DialogDescription>
              Change role from {userRoleLabels[targetUser.role]} to{' '}
              {userRoleLabels[pendingRole]}? Core capabilities and portal access
              will update. Ordinary Group memberships will be preserved.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingRole(null)}>
              Cancel
            </Button>
            <Button onClick={confirmRoleChange}>Change Role</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </GlassSection>
  )
}

export default UserAccessDetailPage
