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
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import {
  activateHelpDeskUser,
  deactivateHelpDeskUser,
  getHelpDeskUsers,
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

const pageSizeOptions = [10, 25, 50, 100]

function DisplayValue({ value }) {
  return value ? (
    <span className="block max-w-44 truncate" title={value}>
      {value}
    </span>
  ) : (
    <span className="text-muted-foreground">—</span>
  )
}

function HelpDeskManagementPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { hideLoading, showLoading, showNotification } = useAppFeedback()
  const [helpDeskUsers, setHelpDeskUsers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('ALL')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [statusChange, setStatusChange] = useState(null)

  async function refreshHelpDeskUsers() {
    const items = await getHelpDeskUsers(user.organisationId, {
      search,
      status: status === 'ALL' ? '' : status,
    })
    setHelpDeskUsers(items)
  }

  useEffect(() => {
    let isActive = true

    getHelpDeskUsers(user.organisationId, {
      search,
      status: status === 'ALL' ? '' : status,
    })
      .then((userItems) => {
        if (isActive) {
          setHelpDeskUsers(userItems)
          setIsLoading(false)
        }
      })
      .catch((error) => {
        if (isActive) {
          setIsLoading(false)
          showNotification(
            error.message || 'Unable to load Help Desk users.',
            'error',
          )
        }
      })

    return () => {
      isActive = false
    }
  }, [search, showNotification, status, user.organisationId])

  const totalPages = Math.max(
    1,
    Math.ceil(helpDeskUsers.length / pageSize),
  )
  const currentPage = Math.min(page, totalPages)

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const pageUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return helpDeskUsers.slice(start, start + pageSize)
  }, [currentPage, helpDeskUsers, pageSize])
  const startItem = helpDeskUsers.length
    ? (currentPage - 1) * pageSize + 1
    : 0
  const endItem = Math.min(currentPage * pageSize, helpDeskUsers.length)

  function changeFilter(setter, value) {
    setPage(1)
    setter(value)
  }

  async function handleStatusChange() {
    const isActivating = statusChange.targetStatus === 'ACTIVE'
    showLoading(
      isActivating
        ? 'Activating Help Desk user...'
        : 'Deactivating Help Desk user...',
    )

    try {
      if (isActivating) {
        await activateHelpDeskUser(
          statusChange.user.id,
          user.organisationId,
        )
      } else {
        await deactivateHelpDeskUser(
          statusChange.user.id,
          user.organisationId,
        )
      }

      setStatusChange(null)
      await refreshHelpDeskUsers()
      showNotification(
        isActivating
          ? 'Help Desk user activated successfully.'
          : 'Help Desk user deactivated successfully.',
      )
    } catch (error) {
      showNotification(
        error.message || 'Unable to update Help Desk user status.',
        'error',
      )
    } finally {
      hideLoading()
    }
  }

  return (
    <GlassSection>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Help Desk Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage Help Desk accounts and Group membership for your Company.
          </p>
        </div>
        <Button onClick={() => navigate('/admin/helpdesk/new')}>
          <PlusIcon />
          Create Help Desk
        </Button>
      </div>

      <GlassPanel className="overflow-hidden p-0">
        <div className="grid gap-3 border-b border-border/60 p-4 sm:grid-cols-[minmax(15rem,1fr)_11rem]">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className={`${glassFormControlClass} pl-9`}
              aria-label="Search Help Desk users"
              placeholder="Search Help Desk users..."
              value={search}
              onChange={(event) =>
                changeFilter(setSearch, event.target.value)
              }
            />
          </div>

          <Select
            value={status}
            onValueChange={(value) => changeFilter(setStatus, value)}
          >
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
              <SelectItem value="ALL">All</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
            </SelectContent>
          </Select>

        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Login ID</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Group</TableHead>
              <TableHead>Telephone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8}>Loading Help Desk users...</TableCell>
              </TableRow>
            ) : pageUsers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="py-10 text-center text-muted-foreground"
                >
                  No Help Desk users match the current search and filters.
                </TableCell>
              </TableRow>
            ) : (
              pageUsers.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    {item.firstName} {item.lastName}
                  </TableCell>
                  <TableCell>{item.loginId}</TableCell>
                  <TableCell>
                    <DisplayValue value={item.position} />
                  </TableCell>
                  <TableCell>
                    Help Desk
                  </TableCell>
                  <TableCell>
                    <DisplayValue value={item.telephone} />
                  </TableCell>
                  <TableCell>
                    <DisplayValue value={item.email} />
                  </TableCell>
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
                        onClick={() => navigate(`/admin/helpdesk/${item.id}`)}
                      />
                      <IconActionButton
                        icon={PencilIcon}
                        variant="outline"
                        title={`Edit ${item.name}`}
                        onClick={() =>
                          navigate(`/admin/helpdesk/${item.id}/edit`)
                        }
                      />
                      <IconActionButton
                        icon={item.active ? BanIcon : CircleCheckIcon}
                        variant="outline"
                        title={`${item.active ? 'Deactivate' : 'Activate'} ${item.name}`}
                        onClick={() =>
                          setStatusChange({
                            user: item,
                            targetStatus: item.active ? 'INACTIVE' : 'ACTIVE',
                          })
                        }
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
            Showing {startItem}–{endItem} of {helpDeskUsers.length} Help Desk users
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
                  <SelectItem key={option} value={String(option)}>
                    {option}
                  </SelectItem>
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
              onClick={() =>
                setPage((value) => Math.min(totalPages, value + 1))
              }
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

export default HelpDeskManagementPage
