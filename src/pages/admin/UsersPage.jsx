import { useEffect, useMemo, useState } from 'react'
import {
  BanIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CircleCheckIcon,
  EyeIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  ShieldCheckIcon,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { getGroups } from '@/api/groupApi'
import {
  activateUser,
  deactivateUser,
  getOrganisationUsers,
} from '@/api/userApi'
import IconActionButton from '@/components/common/IconActionButton'
import UserStatusDialog from '@/components/common/UserStatusDialog'
import GlassPanel from '@/components/glass/GlassPanel'
import GlassSection from '@/components/glass/GlassSection'
import { glassFormControlClass } from '@/components/glass/glassStyles'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import { userRoleLabels, userRoleOptions } from '@/lib/userOptions'

const pageSizeOptions = [10, 25, 50, 100]

function GroupSummary({ groups }) {
  if (!groups.length) {
    return <span className="text-muted-foreground">—</span>
  }

  return (
    <div className="flex max-w-44 items-center gap-1.5">
      <span className="truncate" title={groups[0].name}>
        {groups[0].name}
      </span>
      {groups.length > 1 && (
        <Badge variant="secondary" title={groups.slice(1).map((group) => group.name).join(', ')}>
          +{groups.length - 1}
        </Badge>
      )}
    </div>
  )
}

function DisplayValue({ value }) {
  return value ? (
    <span className="block max-w-44 truncate" title={value}>
      {value}
    </span>
  ) : (
    <span className="text-muted-foreground">—</span>
  )
}

function UsersPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { hideLoading, showLoading, showNotification } = useAppFeedback()
  const [users, setUsers] = useState([])
  const [groups, setGroups] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('ALL')
  const [status, setStatus] = useState('ALL')
  const [groupId, setGroupId] = useState('ALL')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [statusChange, setStatusChange] = useState(null)

  async function refreshUsers() {
    const items = await getOrganisationUsers(user.organisationId, {
      search,
      role: role === 'ALL' ? '' : role,
      status: status === 'ALL' ? '' : status,
      groupId: groupId === 'ALL' ? '' : groupId,
    })
    setUsers(items)
  }

  useEffect(() => {
    let isActive = true

    Promise.all([
      getOrganisationUsers(user.organisationId, {
        search,
        role: role === 'ALL' ? '' : role,
        status: status === 'ALL' ? '' : status,
        groupId: groupId === 'ALL' ? '' : groupId,
      }),
      getGroups(user.organisationId),
    ])
      .then(([userItems, groupItems]) => {
        if (isActive) {
          setUsers(userItems)
          setGroups(groupItems)
          setIsLoading(false)
        }
      })
      .catch((error) => {
        if (isActive) {
          setIsLoading(false)
          showNotification(error.message || 'Unable to load users.', 'error')
        }
      })

    return () => {
      isActive = false
    }
  }, [groupId, role, search, showNotification, status, user.organisationId])

  const totalPages = Math.max(1, Math.ceil(users.length / pageSize))
  const currentPage = Math.min(page, totalPages)

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const pageUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return users.slice(start, start + pageSize)
  }, [currentPage, pageSize, users])
  const startItem = users.length ? (currentPage - 1) * pageSize + 1 : 0
  const endItem = Math.min(currentPage * pageSize, users.length)

  function changeFilter(setter, value) {
    setPage(1)
    setter(value)
  }

  async function handleStatusChange() {
    const isActivating = statusChange.targetStatus === 'ACTIVE'
    showLoading(isActivating ? 'Activating user...' : 'Deactivating user...')

    try {
      if (isActivating) {
        await activateUser(statusChange.user.id, user.organisationId)
      } else {
        await deactivateUser(statusChange.user.id, user.organisationId)
      }

      setStatusChange(null)
      await refreshUsers()
      showNotification(
        isActivating
          ? 'User activated successfully.'
          : 'User deactivated successfully.',
      )
    } catch (error) {
      showNotification(error.message || 'Unable to update user status.', 'error')
    } finally {
      hideLoading()
    }
  }

  return (
    <GlassSection>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Users</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage people, account access, and Group membership for your Company.
          </p>
        </div>
        <Button onClick={() => navigate('/admin/users/new')}>
          <PlusIcon />
          Create User
        </Button>
      </div>

      <GlassPanel className="overflow-hidden p-0">
        <div className="grid gap-3 border-b border-border/60 p-4 sm:grid-cols-2 xl:grid-cols-[minmax(15rem,1fr)_12rem_11rem_13rem]">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className={`${glassFormControlClass} pl-9`}
              aria-label="Search users"
              placeholder="Search users..."
              value={search}
              onChange={(event) => changeFilter(setSearch, event.target.value)}
            />
          </div>

          <Select value={role} onValueChange={(value) => changeFilter(setRole, value)}>
            <SelectTrigger
              className={`${glassFormControlClass} w-full`}
              aria-label="Filter by role"
            >
              <SelectValue>
                {role === 'ALL' ? 'All Roles' : userRoleLabels[role]}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Roles</SelectItem>
              {userRoleOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={status} onValueChange={(value) => changeFilter(setStatus, value)}>
            <SelectTrigger
              className={`${glassFormControlClass} w-full`}
              aria-label="Filter by status"
            >
              <SelectValue>
                {status === 'ALL'
                  ? 'All Statuses'
                  : status === 'ACTIVE'
                    ? 'Active'
                    : 'Inactive'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
            </SelectContent>
          </Select>

          <Select value={groupId} onValueChange={(value) => changeFilter(setGroupId, value)}>
            <SelectTrigger
              className={`${glassFormControlClass} w-full`}
              aria-label="Filter by Group"
            >
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

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Login ID</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Group</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Telephone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9}>Loading users...</TableCell>
              </TableRow>
            ) : pageUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                  No users match the current search and filters.
                </TableCell>
              </TableRow>
            ) : (
              pageUsers.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.firstName} {item.lastName}</TableCell>
                  <TableCell>{item.loginId}</TableCell>
                  <TableCell>{userRoleLabels[item.role] ?? item.role}</TableCell>
                  <TableCell><GroupSummary groups={item.groups} /></TableCell>
                  <TableCell><DisplayValue value={item.position} /></TableCell>
                  <TableCell><DisplayValue value={item.telephone} /></TableCell>
                  <TableCell><DisplayValue value={item.email} /></TableCell>
                  <TableCell>
                    <Badge variant={item.active ? 'default' : 'secondary'}>
                      {item.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <IconActionButton
                        icon={EyeIcon}
                        variant="outline"
                        title={`View ${item.name}`}
                        onClick={() => navigate(`/admin/users/${item.id}`)}
                      />
                      <IconActionButton
                        icon={PencilIcon}
                        variant="outline"
                        title={`Edit ${item.name}`}
                        onClick={() => navigate(`/admin/users/${item.id}/edit`)}
                      />
                      <IconActionButton
                        icon={ShieldCheckIcon}
                        variant="outline"
                        title={`Manage Access for ${item.name}`}
                        onClick={() =>
                          navigate(`/admin/roles-permissions/users/${item.id}`)
                        }
                      />
                      <IconActionButton
                        icon={item.active ? BanIcon : CircleCheckIcon}
                        variant="outline"
                        title={`${item.active ? 'Deactivate' : 'Activate'} ${item.name}`}
                        onClick={() => setStatusChange({
                          user: item,
                          targetStatus: item.active ? 'INACTIVE' : 'ACTIVE',
                        })}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 px-4 py-3">
          <p className="text-sm text-muted-foreground">
            Showing {startItem}–{endItem} of {users.length} users
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">Rows per page</span>
            <Select
              value={String(pageSize)}
              onValueChange={(value) => {
                setPage(1)
                setPageSize(Number(value))
              }}
            >
              <SelectTrigger
                className={`${glassFormControlClass} w-20`}
                aria-label="Rows per page"
              >
                <SelectValue>{pageSize}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((option) => (
                  <SelectItem key={option} value={String(option)}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="min-w-20 text-center text-sm">
              {currentPage} / {totalPages}
            </span>
            <IconActionButton
              icon={ChevronLeftIcon}
              variant="outline"
              title="Previous page"
              disabled={currentPage <= 1}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
            />
            <IconActionButton
              icon={ChevronRightIcon}
              variant="outline"
              title="Next page"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
            />
          </div>
        </div>
      </GlassPanel>

      <UserStatusDialog
        user={statusChange?.user}
        targetStatus={statusChange?.targetStatus}
        onOpenChange={(open) => {
          if (!open) setStatusChange(null)
        }}
        onConfirm={handleStatusChange}
      />
    </GlassSection>
  )
}

export default UsersPage
