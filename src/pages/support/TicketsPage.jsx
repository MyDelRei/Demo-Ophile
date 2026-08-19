import { useEffect, useMemo, useState } from 'react'
import {
  CircleCheckIcon,
  CircleOffIcon,
  Clock3Icon,
  HeadsetIcon,
  Layers3Icon,
  ListFilterIcon,
  LoaderCircleIcon,
  PlusIcon,
  SearchCheckIcon,
  SearchIcon,
  TicketIcon,
  TicketsIcon,
} from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'

import { getGroups } from '@/api/groupApi'
import {
  getHelpDeskTickets,
  getMyGroupTickets,
  getMySupportTickets,
  getMyTickets,
  getVisibleTicketsForUser,
} from '@/api/ticketApi'
import { getActiveTicketCategories } from '@/api/ticketCategoryApi'
import { glassFormControlClass } from '@/components/glass/glassStyles'
import GlassPanel from '@/components/glass/GlassPanel'
import SupportPageShell from '@/components/support/SupportPageShell'
import TicketList from '@/components/support/TicketList'
import TicketPagination from '@/components/support/TicketPagination'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/hooks/useAuth'
import { useAppFeedback } from '@/hooks/useAppFeedback'
import { cn } from '@/lib/utils'

const userTicketTabs = [
  { value: 'groups', label: 'All My Groups', icon: Layers3Icon },
  { value: 'in-progress', label: 'In Progress', icon: LoaderCircleIcon },
  { value: 'resolved', label: 'Resolved', icon: CircleCheckIcon },
  { value: 'mine', label: 'My Tickets', icon: TicketIcon },
  { value: 'support', label: 'My Support', icon: HeadsetIcon },
]

const helpDeskTicketTabs = [
  { value: 'all', label: 'All Tickets', icon: TicketsIcon },
  { value: 'triage', label: 'Open / Triage', icon: SearchCheckIcon, status: 'OPEN' },
  { value: 'pending', label: 'Pending', icon: Clock3Icon, status: 'PENDING' },
  { value: 'in-progress', label: 'In Progress', icon: LoaderCircleIcon, status: 'IMPLEMENTATION' },
  { value: 'resolved', label: 'Resolved', icon: CircleCheckIcon, status: 'RESOLVED' },
  { value: 'mine', label: 'My Tickets', icon: TicketIcon },
  { value: 'support', label: 'My Support', icon: HeadsetIcon },
  { value: 'dropped', label: 'Dropped', icon: CircleOffIcon, status: 'DROPPED' },
]

const statusOptions = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'OPEN', label: 'Open' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'IMPLEMENTATION', label: 'In Progress' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'CLOSED', label: 'Closed' },
  { value: 'DROPPED', label: 'Dropped' },
]

function TicketsPage() {
  const { user } = useAuth()
  const { showNotification } = useAppFeedback()
  const [searchParams, setSearchParams] = useSearchParams()
  const [tickets, setTickets] = useState([])
  const [search, setSearch] = useState('')
  const [groupId, setGroupId] = useState('ALL')
  const [categoryId, setCategoryId] = useState('ALL')
  const [status, setStatus] = useState('ALL')
  const [groups, setGroups] = useState([])
  const [categories, setCategories] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const isHelpDesk = user.role === 'HELP_DESK'
  const ticketTabs = isHelpDesk ? helpDeskTicketTabs : userTicketTabs
  const defaultTab = isHelpDesk ? 'all' : 'groups'
  const requestedTab = searchParams.get('tab') ?? defaultTab
  const activeTab = ticketTabs.some((tab) => tab.value === requestedTab)
    ? requestedTab
    : defaultTab
  const activeTabDefinition = ticketTabs.find(
    (tab) => tab.value === activeTab,
  )
  const fixedStatus = activeTabDefinition?.status

  useEffect(() => {
    if (!isHelpDesk) return undefined
    let isActive = true

    Promise.all([
      getGroups(user.organisationId),
      getActiveTicketCategories(user.organisationId),
    ])
      .then(([companyGroups, companyCategories]) => {
        if (!isActive) return
        setGroups(companyGroups.filter((group) => group.status === 'ACTIVE'))
        setCategories(companyCategories)
      })
      .catch((error) => {
        if (isActive) {
          showNotification(
            error.message || 'Unable to load ticket filters.',
            'error',
          )
        }
      })

    return () => {
      isActive = false
    }
  }, [isHelpDesk, showNotification, user.organisationId])

  useEffect(() => {
    let isActive = true
    setIsLoading(true)

    const helpDeskFilters = {
      search,
      groupId,
      categoryId,
      status: fixedStatus ?? status,
    }
    const normalFilters = { search }
    const requestByTab = isHelpDesk
      ? {
          all: () => getHelpDeskTickets(user.id, helpDeskFilters),
          triage: () => getHelpDeskTickets(user.id, helpDeskFilters),
          pending: () => getHelpDeskTickets(user.id, helpDeskFilters),
          'in-progress': () => getHelpDeskTickets(user.id, helpDeskFilters),
          resolved: () => getHelpDeskTickets(user.id, helpDeskFilters),
          mine: () => getMyTickets(user.id, helpDeskFilters),
          support: () => getMySupportTickets(user.id, helpDeskFilters),
          dropped: () => getHelpDeskTickets(user.id, helpDeskFilters),
        }
      : {
          groups: () => getMyGroupTickets(user.id, normalFilters),
          'in-progress': () =>
            getVisibleTicketsForUser(user.id, {
              ...normalFilters,
              status: 'IMPLEMENTATION',
            }),
          resolved: () =>
            getVisibleTicketsForUser(user.id, {
              ...normalFilters,
              status: 'RESOLVED',
            }),
          mine: () => getMyTickets(user.id, normalFilters),
          support: () => getMySupportTickets(user.id, normalFilters),
        }

    requestByTab[activeTab]()
      .then((result) => {
        if (isActive) setTickets(result)
      })
      .catch((error) => {
        if (isActive) {
          showNotification(
            error.message || 'Unable to load tickets.',
            'error',
          )
        }
      })
      .finally(() => {
        if (isActive) setIsLoading(false)
      })

    return () => {
      isActive = false
    }
  }, [
    activeTab,
    categoryId,
    fixedStatus,
    groupId,
    isHelpDesk,
    search,
    showNotification,
    status,
    user.id,
  ])

  const totalPages = Math.max(1, Math.ceil(tickets.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageTickets = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return tickets.slice(start, start + pageSize)
  }, [currentPage, pageSize, tickets])

  function selectTab(tab) {
    setPage(1)
    setSearchParams(tab === defaultTab ? {} : { tab })
  }

  function updateSearch(value) {
    setPage(1)
    setSearch(value)
  }

  function updateFilter(setter, value) {
    setPage(1)
    setter(value)
  }

  function updatePageSize(value) {
    setPage(1)
    setPageSize(value)
  }

  return (
    <SupportPageShell
      title="Tickets"
      description={
        isHelpDesk
          ? 'Triage and manage every support ticket in your Company.'
          : 'Find tickets you can view, follow their progress, or log a new request.'
      }
    >
      <GlassPanel className="overflow-hidden p-0">
        <div className="space-y-4 border-b border-border/60 p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative min-w-0 flex-1">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className={`${glassFormControlClass} pl-9`}
                aria-label="Search tickets"
                placeholder="Search tickets..."
                value={search}
                onChange={(event) => updateSearch(event.target.value)}
              />
            </div>
            <Button
              render={<Link to="/support/tickets/new" />}
              nativeButton={false}
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              <PlusIcon />
              Log Ticket
            </Button>
          </div>

          {isHelpDesk && (
            <div className="grid gap-3 rounded-xl border border-border/60 bg-background/45 p-3 sm:grid-cols-3">
              <div className="flex items-center gap-2 sm:col-span-3">
                <ListFilterIcon className="size-4 text-muted-foreground" />
                <p className="text-xs font-medium text-muted-foreground">
                  Ticket filters
                </p>
              </div>
              <Select
                value={groupId}
                onValueChange={(value) => updateFilter(setGroupId, value)}
              >
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

              <Select
                value={categoryId}
                onValueChange={(value) => updateFilter(setCategoryId, value)}
              >
                <SelectTrigger className={`${glassFormControlClass} w-full`} aria-label="Filter by Category">
                  <SelectValue>
                    {categoryId === 'ALL'
                      ? 'All Categories'
                      : categories.find((category) => category.id === categoryId)?.name}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={fixedStatus ?? status}
                onValueChange={(value) => updateFilter(setStatus, value)}
                disabled={Boolean(fixedStatus)}
              >
                <SelectTrigger className={`${glassFormControlClass} w-full`} aria-label="Filter by Status">
                  <SelectValue>
                    {statusOptions.find(
                      (option) => option.value === (fixedStatus ?? status),
                    )?.label}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <nav
            className="-mx-1 overflow-x-auto px-1 pb-1"
            aria-label="Ticket views"
          >
            <div className="flex min-w-max gap-1">
              {ticketTabs.map((tab) => {
                const Icon = tab.icon
                const tabIsActive = activeTab === tab.value

                return (
                  <button
                    key={tab.value}
                    type="button"
                    className={cn(
                      'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                      tabIsActive
                        ? 'bg-foreground text-background'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    )}
                    aria-pressed={tabIsActive}
                    onClick={() => selectTab(tab.value)}
                  >
                    <Icon className="size-4" />
                    {tab.label}
                  </button>
                )
              })}
            </div>
          </nav>
        </div>

        <TicketList tickets={pageTickets} isLoading={isLoading} />
        <TicketPagination
          page={currentPage}
          pageSize={pageSize}
          total={tickets.length}
          onPageChange={setPage}
          onPageSizeChange={updatePageSize}
        />
      </GlassPanel>
    </SupportPageShell>
  )
}

export default TicketsPage
