import { useEffect, useMemo, useState } from 'react'
import {
  MailIcon,
  PhoneIcon,
  SearchIcon,
  UserPlusIcon,
  UsersRoundIcon,
} from 'lucide-react'

import { getSupportGroupDirectory } from '@/api/groupApi'
import {
  createMembershipRequest,
  getMembershipRequestCandidates,
  getPendingMembershipRequests,
} from '@/api/groupMembershipRequestApi'
import { glassFormControlClass } from '@/components/glass/glassStyles'
import GlassPanel from '@/components/glass/GlassPanel'
import SupportPageShell from '@/components/support/SupportPageShell'
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
import { formatTicketDateTime } from '@/lib/supportTicketUtils'

function memberLabel(count) {
  return `${count} ${count === 1 ? 'Member' : 'Members'}`
}

function matchesPerson(member, search) {
  return [
    member.name,
    member.position,
    member.email,
    member.telephone,
  ].some((value) => String(value ?? '').toLowerCase().includes(search))
}

function GroupMemberTable({ members }) {
  if (members.length === 0) {
    return (
      <p className="border-t border-border/60 px-5 py-8 text-center text-sm text-muted-foreground">
        No active members match this search.
      </p>
    )
  }

  return (
    <>
      <div className="hidden border-t border-border/60 sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Telephone</TableHead>
              <TableHead>Email</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => (
              <TableRow key={member.id}>
                <TableCell className="font-medium">{member.name}</TableCell>
                <TableCell>{member.position || '—'}</TableCell>
                <TableCell>{member.telephone || '—'}</TableCell>
                <TableCell>
                  {member.email ? (
                    <a className="hover:underline" href={`mailto:${member.email}`}>
                      {member.email}
                    </a>
                  ) : (
                    '—'
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="divide-y divide-border/60 border-t border-border/60 sm:hidden">
        {members.map((member) => (
          <div key={member.id} className="space-y-2 px-5 py-4">
            <p className="font-medium">{member.name}</p>
            <p className="text-sm text-muted-foreground">
              {member.position || 'Position not provided'}
            </p>
            <div className="space-y-1 text-sm">
              <p>{member.telephone || 'No telephone provided'}</p>
              <p className="break-all">{member.email || 'No email provided'}</p>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

function GroupListPage() {
  const { user } = useAuth()
  const { hideLoading, showLoading, showNotification } = useAppFeedback()
  const [groups, setGroups] = useState([])
  const [pendingRequests, setPendingRequests] = useState([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [requestGroup, setRequestGroup] = useState(null)
  const [candidates, setCandidates] = useState([])
  const [candidateSearch, setCandidateSearch] = useState('')
  const [selectedUserId, setSelectedUserId] = useState('')
  const isHelpDesk = user.role === 'HELP_DESK'

  async function refreshDirectory() {
    const [directory, requests] = await Promise.all([
      getSupportGroupDirectory(user.id),
      isHelpDesk ? getPendingMembershipRequests(user.id) : Promise.resolve([]),
    ])
    setGroups(directory)
    setPendingRequests(requests)
  }

  useEffect(() => {
    let isActive = true

    Promise.all([
      getSupportGroupDirectory(user.id),
      isHelpDesk ? getPendingMembershipRequests(user.id) : Promise.resolve([]),
    ])
      .then(([directory, requests]) => {
        if (!isActive) return
        setGroups(directory)
        setPendingRequests(requests)
      })
      .catch((error) => {
        if (isActive) {
          showNotification(
            error.message || 'Unable to load the Group List.',
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
  }, [isHelpDesk, showNotification, user.id])

  const filteredGroups = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()
    if (!normalizedSearch) return groups

    return groups.flatMap((group) => {
      const groupMatches = [group.name, group.departmentCode].some((value) =>
        String(value ?? '').toLowerCase().includes(normalizedSearch),
      )
      const members = groupMatches
        ? group.members
        : group.members.filter((member) =>
            matchesPerson(member, normalizedSearch),
          )
      return groupMatches || members.length > 0 ? [{ ...group, members }] : []
    })
  }, [groups, search])

  const filteredCandidates = useMemo(() => {
    const normalizedSearch = candidateSearch.trim().toLowerCase()
    if (!normalizedSearch) return candidates
    return candidates.filter((candidate) =>
      [candidate.name, candidate.email, candidate.position].some((value) =>
        String(value ?? '').toLowerCase().includes(normalizedSearch),
      ),
    )
  }, [candidateSearch, candidates])

  async function openRequestDialog(group) {
    showLoading('Loading existing Company users...')
    try {
      const availableCandidates = await getMembershipRequestCandidates(
        group.id,
        user.id,
      )
      setCandidates(availableCandidates)
      setCandidateSearch('')
      setSelectedUserId('')
      setRequestGroup(group)
    } catch (error) {
      showNotification(
        error.message || 'Unable to load available users.',
        'error',
      )
    } finally {
      hideLoading()
    }
  }

  function closeRequestDialog() {
    setRequestGroup(null)
    setCandidates([])
    setCandidateSearch('')
    setSelectedUserId('')
  }

  async function handleRequestMembership(event) {
    event.preventDefault()
    showLoading('Submitting membership request...')
    try {
      await createMembershipRequest(
        requestGroup.id,
        selectedUserId,
        user.id,
      )
      closeRequestDialog()
      await refreshDirectory()
      showNotification('Membership request submitted for approval.')
    } catch (error) {
      showNotification(
        error.message || 'Unable to submit membership request.',
        'error',
      )
    } finally {
      hideLoading()
    }
  }

  return (
    <SupportPageShell
      title="Group List"
      description="Find active Company Groups and the people available in each support directory."
    >
      <GlassPanel>
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className={`${glassFormControlClass} pl-9`}
            aria-label="Search groups or people"
            placeholder="Search groups or people..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </GlassPanel>

      {isLoading ? (
        <GlassPanel className="py-12 text-center text-sm text-muted-foreground">
          Loading Group List...
        </GlassPanel>
      ) : filteredGroups.length === 0 ? (
        <GlassPanel className="py-12 text-center">
          <UsersRoundIcon className="mx-auto size-9 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            No Groups or people match your search.
          </p>
        </GlassPanel>
      ) : (
        <div className="space-y-5">
          {filteredGroups.map((group) => {
            const groupRequests = pendingRequests.filter(
              (request) => request.groupId === group.id,
            )

            return (
              <GlassPanel key={group.id} className="overflow-hidden p-0">
                <header className="flex flex-col gap-4 px-5 py-5 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold">{group.name}</h2>
                      <Badge variant="secondary">
                        Code: {group.departmentCode || '—'}
                      </Badge>
                      <Badge variant="outline">
                        {memberLabel(group.memberCount)}
                      </Badge>
                    </div>
                    {(group.headlinePhone || group.headlineEmail) && (
                      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                        {group.headlinePhone && (
                          <span className="inline-flex items-center gap-1.5">
                            <PhoneIcon className="size-4" />
                            Group: {group.headlinePhone}
                          </span>
                        )}
                        {group.headlineEmail && (
                          <a
                            className="inline-flex items-center gap-1.5 hover:text-foreground hover:underline"
                            href={`mailto:${group.headlineEmail}`}
                          >
                            <MailIcon className="size-4" />
                            {group.headlineEmail}
                          </a>
                        )}
                      </div>
                    )}
                  </div>

                  {isHelpDesk && !group.system && (
                    <Button
                      variant="outline"
                      onClick={() => openRequestDialog(group)}
                    >
                      <UserPlusIcon />
                      Request Add User
                    </Button>
                  )}
                </header>

                {isHelpDesk && groupRequests.length > 0 && (
                  <section className="border-t border-amber-200/70 bg-amber-50/45 px-5 py-4 dark:border-amber-900/70 dark:bg-amber-950/20">
                    <h3 className="text-sm font-semibold">Membership Requests</h3>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {groupRequests.map((request) => (
                        <div
                          key={request.id}
                          className="rounded-lg border border-amber-200 bg-background/70 px-3 py-2 text-sm dark:border-amber-800"
                        >
                          <span className="font-medium">{request.user?.name}</span>
                          <Badge className="ml-2" variant="outline">
                            Pending Approval
                          </Badge>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Requested {formatTicketDateTime(request.requestedAt)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                <GroupMemberTable members={group.members} />
              </GlassPanel>
            )
          })}
        </div>
      )}

      <Dialog
        open={Boolean(requestGroup)}
        onOpenChange={(open) => {
          if (!open) closeRequestDialog()
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Request Add User</DialogTitle>
            <DialogDescription>
              Select an existing active Company user for {requestGroup?.name}. Organisation Admin approval is required before membership becomes active.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleRequestMembership}>
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                aria-label="Search existing users"
                placeholder="Search by name, email, or position..."
                value={candidateSearch}
                onChange={(event) => setCandidateSearch(event.target.value)}
              />
            </div>

            <div className="max-h-72 divide-y overflow-y-auto rounded-lg border">
              {filteredCandidates.length === 0 ? (
                <p className="p-5 text-center text-sm text-muted-foreground">
                  No eligible existing users found. Current members and pending requests are excluded.
                </p>
              ) : (
                filteredCandidates.map((candidate) => (
                  <label
                    key={candidate.id}
                    className="flex cursor-pointer items-start gap-3 p-3 hover:bg-muted/60"
                  >
                    <input
                      type="radio"
                      name="membership-candidate"
                      className="mt-1 size-4 accent-current"
                      checked={selectedUserId === candidate.id}
                      onChange={() => setSelectedUserId(candidate.id)}
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium">
                        {candidate.name}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {candidate.position || 'Position not provided'}
                      </span>
                      <span className="block break-all text-xs text-muted-foreground">
                        {candidate.email}
                      </span>
                    </span>
                  </label>
                ))
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeRequestDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={!selectedUserId}>
                Submit Request
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </SupportPageShell>
  )
}

export default GroupListPage
