import { useEffect, useMemo, useState } from 'react'
import {
  Building2Icon,
  HeadsetIcon,
  SearchIcon,
  ShieldCheckIcon,
  UserRoundIcon,
  UsersIcon,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { getGroups } from '@/api/groupApi'
import {
  getAccessChanges,
  getAssignableRoleDefinitions,
  getPredefinedPermissions,
  getRoleCapabilityGroups,
  getUserPermissions,
  getUsersWithAdditionalPermissionsCount,
} from '@/api/permissionApi'
import { getOrganisationUsers } from '@/api/userApi'
import AccessChangeList from '@/components/common/AccessChangeList'
import IconActionButton from '@/components/common/IconActionButton'
import GlassCard from '@/components/glass/GlassCard'
import GlassPanel from '@/components/glass/GlassPanel'
import GlassSection from '@/components/glass/GlassSection'
import { glassFormControlClass } from '@/components/glass/glassStyles'
import { Badge } from '@/components/ui/badge'
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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
import { useAppFeedback } from '@/hooks/useAppFeedback'
import { useAuth } from '@/hooks/useAuth'
import { userRoleLabels } from '@/lib/userOptions'

const roleIcons = {
  USER: UserRoundIcon,
  HELP_DESK: HeadsetIcon,
  ORGANISATION_ADMIN: ShieldCheckIcon,
}

function GroupSummary({ groups }) {
  if (!groups.length) return <span className="text-muted-foreground">—</span>

  return (
    <div className="flex max-w-48 items-center gap-1.5">
      <span className="truncate" title={groups[0].name}>
        {groups[0].name}
      </span>
      {groups.length > 1 && (
        <Badge variant="secondary">+{groups.length - 1}</Badge>
      )}
    </div>
  )
}

function SummaryCard({ icon: Icon, label, value }) {
  return (
    <GlassPanel className="flex items-center gap-4 p-4">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="size-5" />
      </div>
      <div>
        <p className="text-2xl font-semibold">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </GlassPanel>
  )
}

function RolesPermissionsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { showNotification } = useAppFeedback()
  const [users, setUsers] = useState([])
  const [groups, setGroups] = useState([])
  const [roleDefinitions, setRoleDefinitions] = useState([])
  const [capabilityGroups, setCapabilityGroups] = useState([])
  const [permissionDefinitions, setPermissionDefinitions] = useState([])
  const [permissionCounts, setPermissionCounts] = useState({})
  const [usersWithPermissions, setUsersWithPermissions] = useState(0)
  const [accessChanges, setAccessChanges] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('ALL')
  const [status, setStatus] = useState('ALL')
  const [groupId, setGroupId] = useState('ALL')

  useEffect(() => {
    let isActive = true

    async function loadAccessControlCenter() {
      try {
        const [
          userItems,
          groupItems,
          roles,
          capabilities,
          permissions,
          permissionUserCount,
          changes,
        ] = await Promise.all([
          getOrganisationUsers(user.organisationId),
          getGroups(user.organisationId),
          getAssignableRoleDefinitions(),
          getRoleCapabilityGroups(),
          getPredefinedPermissions(),
          getUsersWithAdditionalPermissionsCount(user.organisationId),
          getAccessChanges(user.organisationId, { limit: 6 }),
        ])
        const permissionEntries = await Promise.all(
          userItems.map(async (item) => [
            item.id,
            (await getUserPermissions(item.id, user.organisationId)).length,
          ]),
        )

        if (!isActive) return

        setUsers(userItems)
        setGroups(groupItems)
        setRoleDefinitions(roles)
        setCapabilityGroups(capabilities)
        setPermissionDefinitions(permissions)
        setPermissionCounts(Object.fromEntries(permissionEntries))
        setUsersWithPermissions(permissionUserCount)
        setAccessChanges(changes)
        setIsLoading(false)
      } catch (error) {
        if (isActive) {
          setIsLoading(false)
          showNotification(
            error.message || 'Unable to load access controls.',
            'error',
          )
        }
      }
    }

    loadAccessControlCenter()

    return () => {
      isActive = false
    }
  }, [showNotification, user.organisationId])

  const filteredUsers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return users.filter((item) => {
      const matchesSearch =
        !normalizedSearch ||
        [item.name, item.loginId, item.email].some((value) =>
          String(value ?? '').toLowerCase().includes(normalizedSearch),
        )
      const matchesRole = role === 'ALL' || item.role === role
      const matchesStatus =
        status === 'ALL' ||
        (status === 'ACTIVE' ? item.active : !item.active)
      const matchesGroup =
        groupId === 'ALL' ||
        item.groups.some((group) => group.id === groupId)

      return matchesSearch && matchesRole && matchesStatus && matchesGroup
    })
  }, [groupId, role, search, status, users])

  const roleCounts = Object.fromEntries(
    roleDefinitions.map((definition) => [
      definition.key,
      users.filter((item) => item.role === definition.key).length,
    ]),
  )

  return (
    <GlassSection>
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          <ShieldCheckIcon className="size-4" />
          Access Control Center
        </div>
        <h1 className="text-3xl font-semibold">Roles &amp; Permissions</h1>
        <p className="max-w-3xl text-muted-foreground">
          Understand and manage what each Company user is allowed to do after
          login. Ophile roles are fixed; only approved additional permissions
          can be assigned.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard icon={UsersIcon} label="Total Users" value={users.length} />
        <SummaryCard
          icon={HeadsetIcon}
          label="Help Desk Users"
          value={roleCounts.HELP_DESK ?? 0}
        />
        <SummaryCard
          icon={Building2Icon}
          label="Organisation Admins"
          value={roleCounts.ORGANISATION_ADMIN ?? 0}
        />
        <SummaryCard
          icon={ShieldCheckIcon}
          label="Users With Additional Permissions"
          value={usersWithPermissions}
        />
      </div>

      <div className="space-y-3">
        <div>
          <h2 className="text-xl font-semibold">Role Overview</h2>
          <p className="text-sm text-muted-foreground">
            Company roles are predefined and cannot be created, cloned, or deleted.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {roleDefinitions.map((definition) => {
            const Icon = roleIcons[definition.key]

            return (
              <GlassCard key={definition.key}>
                <CardHeader>
                  <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </div>
                  <CardTitle>{definition.label}</CardTitle>
                  <Badge className="w-fit" variant="outline">
                    {definition.key}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="min-h-10 text-sm text-muted-foreground">
                    {definition.description}
                  </p>
                  <p className="font-semibold">
                    {roleCounts[definition.key] ?? 0}{' '}
                    {(roleCounts[definition.key] ?? 0) === 1 ? 'User' : 'Users'}
                  </p>
                </CardContent>
              </GlassCard>
            )
          })}
        </div>
      </div>

      <GlassPanel className="overflow-hidden p-0">
        <div className="border-b border-border/60 p-5">
          <h2 className="text-xl font-semibold">Permission Matrix</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Core capabilities are inherited from fixed roles and are never
            editable as individual overrides.
          </p>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Capability Area</TableHead>
                {roleDefinitions.map((definition) => (
                  <TableHead key={definition.key}>{definition.label}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {capabilityGroups.map((group) => (
                <TableRow key={group.key}>
                  <TableCell className="font-medium">{group.label}</TableCell>
                  {roleDefinitions.map((definition) => (
                    <TableCell key={definition.key}>
                      <Badge
                        variant={
                          group.roles.includes(definition.key)
                            ? 'default'
                            : 'secondary'
                        }
                      >
                        {group.roles.includes(definition.key)
                          ? 'Allowed'
                          : 'Not Available'}
                      </Badge>
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </GlassPanel>

      <GlassPanel className="overflow-hidden p-0">
        <div className="border-b border-border/60 p-5">
          <h2 className="text-xl font-semibold">User Access Management</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Select a Company user to review their complete effective access.
          </p>
        </div>
        <div className="grid gap-3 border-b border-border/60 p-4 sm:grid-cols-2 xl:grid-cols-[minmax(15rem,1fr)_12rem_11rem_13rem]">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className={`${glassFormControlClass} pl-9`}
              aria-label="Search user access"
              placeholder="Search name, Login ID, or email..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger className={`${glassFormControlClass} w-full`} aria-label="Filter by role">
              <SelectValue>
                {role === 'ALL' ? 'All Roles' : userRoleLabels[role]}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Roles</SelectItem>
              {roleDefinitions.map((definition) => (
                <SelectItem key={definition.key} value={definition.key}>
                  {definition.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className={`${glassFormControlClass} w-full`} aria-label="Filter by status">
              <SelectValue>
                {status === 'ALL' ? 'All Statuses' : status === 'ACTIVE' ? 'Active' : 'Inactive'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Select value={groupId} onValueChange={setGroupId}>
            <SelectTrigger className={`${glassFormControlClass} w-full`} aria-label="Filter by Group">
              <SelectValue>
                {groupId === 'ALL'
                  ? 'All Groups'
                  : groups.find((group) => group.id === groupId)?.name}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Groups</SelectItem>
              {groups.map((group) => (
                <SelectItem key={group.id} value={group.id}>
                  {group.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Login ID</TableHead>
                <TableHead>Current Role</TableHead>
                <TableHead>Groups</TableHead>
                <TableHead>Additional Permissions</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7}>Loading access settings...</TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                    No users match the current search and filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>{item.loginId}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{userRoleLabels[item.role]}</Badge>
                    </TableCell>
                    <TableCell><GroupSummary groups={item.groups} /></TableCell>
                    <TableCell>
                      {permissionCounts[item.id]
                        ? `${permissionCounts[item.id]} enabled`
                        : 'None'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.active ? 'default' : 'secondary'}>
                        {item.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <IconActionButton
                        icon={ShieldCheckIcon}
                        variant="outline"
                        title={`Manage Access for ${item.name}`}
                        onClick={() =>
                          navigate(`/admin/roles-permissions/users/${item.id}`)
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </GlassPanel>

      <GlassPanel>
        <div className="mb-4">
          <h2 className="text-xl font-semibold">Recent Access Changes</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Latest role and predefined permission changes in your Company.
          </p>
        </div>
        <AccessChangeList
          changes={accessChanges}
          permissionDefinitions={permissionDefinitions}
        />
      </GlassPanel>
    </GlassSection>
  )
}

export default RolesPermissionsPage
