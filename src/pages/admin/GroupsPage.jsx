import { useEffect, useState } from 'react'
import {
  BanIcon,
  CircleCheckIcon,
  EyeIcon,
  PencilIcon,
  XIcon,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import {
  activateGroup,
  createGroup,
  deactivateGroup,
  getGroups,
  updateGroup,
} from '@/api/groupApi'
import {
  approveMembershipRequest,
  getPendingMembershipRequests,
  rejectMembershipRequest,
} from '@/api/groupMembershipRequestApi'
import GroupFormDialog from '@/components/common/GroupFormDialog'
import GroupStatusDialog from '@/components/common/GroupStatusDialog'
import IconActionButton from '@/components/common/IconActionButton'
import GlassPanel from '@/components/glass/GlassPanel'
import GlassSection from '@/components/glass/GlassSection'
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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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

const emptyGroupForm = {
  name: '',
  departmentCode: '',
  headlinePhone: '',
  headlineEmail: '',
}

function formatDate(value) {
  if (!value) return '—'

  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? '—'
    : new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(date)
}

function memberLabel(count) {
  return `${count} ${count === 1 ? 'Member' : 'Members'}`
}

function DisplayValue({ value }) {
  return value ? (
    <span className="block max-w-48 truncate" title={value}>
      {value}
    </span>
  ) : (
    <span className="text-muted-foreground">—</span>
  )
}

function GroupsPage() {
  const { user } = useAuth()
  const { hideLoading, showLoading, showNotification } = useAppFeedback()
  const navigate = useNavigate()
  const [groups, setGroups] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState(emptyGroupForm)
  const [editingGroup, setEditingGroup] = useState(null)
  const [editForm, setEditForm] = useState(emptyGroupForm)
  const [statusChange, setStatusChange] = useState(null)
  const [membershipRequests, setMembershipRequests] = useState([])
  const [rejectingRequest, setRejectingRequest] = useState(null)
  const [rejectionReason, setRejectionReason] = useState('')

  async function refreshGroups() {
    const [items, requests] = await Promise.all([
      getGroups(user.organisationId),
      getPendingMembershipRequests(user.id),
    ])
    setGroups(items)
    setMembershipRequests(requests)
    setIsLoading(false)
  }

  useEffect(() => {
    let isActive = true

    Promise.all([
      getGroups(user.organisationId),
      getPendingMembershipRequests(user.id),
    ])
      .then(([items, requests]) => {
        if (isActive) {
          setGroups(items)
          setMembershipRequests(requests)
          setIsLoading(false)
        }
      })
      .catch((error) => {
        if (isActive) {
          setIsLoading(false)
          showNotification(error.message || 'Unable to load groups.', 'error')
        }
      })

    return () => {
      isActive = false
    }
  }, [showNotification, user.id, user.organisationId])

  function updateCreateField(field, value) {
    setCreateForm((current) => ({ ...current, [field]: value }))
  }

  function updateEditField(field, value) {
    setEditForm((current) => ({ ...current, [field]: value }))
  }

  function handleCreateOpenChange(open) {
    setCreateOpen(open)
    if (!open) setCreateForm(emptyGroupForm)
  }

  async function handleCreate(event) {
    event.preventDefault()
    showLoading('Creating group...')

    try {
      await createGroup(user.organisationId, createForm)
      handleCreateOpenChange(false)
      await refreshGroups()
      showNotification('Group created successfully.')
    } catch (error) {
      showNotification(error.message || 'Unable to create group.', 'error')
    } finally {
      hideLoading()
    }
  }

  function openEditDialog(group) {
    setEditingGroup(group)
    setEditForm({
      name: group.name,
      departmentCode: group.departmentCode,
      headlinePhone: group.headlinePhone,
      headlineEmail: group.headlineEmail,
    })
  }

  function handleEditOpenChange(open) {
    if (!open) {
      setEditingGroup(null)
      setEditForm(emptyGroupForm)
    }
  }

  async function handleEdit(event) {
    event.preventDefault()
    showLoading('Updating group...')

    try {
      await updateGroup(editingGroup.id, editForm, user.organisationId)
      handleEditOpenChange(false)
      await refreshGroups()
      showNotification('Group updated successfully.')
    } catch (error) {
      showNotification(error.message || 'Unable to update group.', 'error')
    } finally {
      hideLoading()
    }
  }

  async function handleStatusChange() {
    const isActivating = statusChange.targetStatus === 'ACTIVE'
    showLoading(isActivating ? 'Activating group...' : 'Deactivating group...')

    try {
      if (isActivating) {
        await activateGroup(statusChange.group.id, user.organisationId)
      } else {
        await deactivateGroup(statusChange.group.id, user.organisationId)
      }

      setStatusChange(null)
      await refreshGroups()
      showNotification(
        isActivating
          ? 'Group activated successfully.'
          : 'Group deactivated successfully.',
      )
    } catch (error) {
      showNotification(
        error.message ||
          (isActivating
            ? 'Unable to activate group.'
            : 'Unable to deactivate group.'),
        'error',
      )
    } finally {
      hideLoading()
    }
  }

  async function handleApproveRequest(request) {
    showLoading('Approving membership...')
    try {
      await approveMembershipRequest(request.id, user.id)
      await refreshGroups()
      showNotification('Group membership approved.')
    } catch (error) {
      showNotification(
        error.message || 'Unable to approve membership request.',
        'error',
      )
    } finally {
      hideLoading()
    }
  }

  async function handleRejectRequest(event) {
    event.preventDefault()
    showLoading('Rejecting membership request...')
    try {
      await rejectMembershipRequest(
        rejectingRequest.id,
        rejectionReason,
        user.id,
      )
      setRejectingRequest(null)
      setRejectionReason('')
      await refreshGroups()
      showNotification('Membership request rejected.')
    } catch (error) {
      showNotification(
        error.message || 'Unable to reject membership request.',
        'error',
      )
    } finally {
      hideLoading()
    }
  }

  return (
    <GlassSection>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <p className="max-w-2xl text-sm text-muted-foreground">
          Groups can represent departments, centres, offices, teams, or other
          organisational units.
        </p>
        <Button onClick={() => setCreateOpen(true)}>Create Group</Button>
      </div>

      <GlassPanel className="overflow-hidden p-0">
        <div className="border-b border-border/60 px-5 py-4">
          <h2 className="font-semibold">Group Management</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Review Group profiles, membership totals, and current status.
          </p>
        </div>
        <div className="overflow-x-auto">
          <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Group Name</TableHead>
              <TableHead>Department Code</TableHead>
              <TableHead>Headline Phone</TableHead>
              <TableHead>Headline Email</TableHead>
              <TableHead>Members</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8}>Loading groups...</TableCell>
              </TableRow>
            ) : groups.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center text-muted-foreground"
                >
                  No groups
                </TableCell>
              </TableRow>
            ) : (
              groups.map((group) => (
                <TableRow key={group.id}>
                  <TableCell>
                    <div className="flex items-center gap-2 font-medium">
                      {group.name}
                      {group.system && (
                        <Badge variant="secondary">System</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DisplayValue value={group.departmentCode} />
                  </TableCell>
                  <TableCell>
                    <DisplayValue value={group.headlinePhone} />
                  </TableCell>
                  <TableCell>
                    <DisplayValue value={group.headlineEmail} />
                  </TableCell>
                  <TableCell>{memberLabel(group.memberCount)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        group.status === 'ACTIVE' ? 'default' : 'secondary'
                      }
                    >
                      {group.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(group.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <IconActionButton
                        icon={EyeIcon}
                        variant="outline"
                        title={`View ${group.name}`}
                        onClick={() => navigate(`/admin/groups/${group.id}`)}
                      />
                      <IconActionButton
                        icon={PencilIcon}
                        variant="outline"
                        title={
                          group.system
                            ? 'System Group cannot be edited'
                            : `Edit ${group.name}`
                        }
                        disabled={group.system}
                        onClick={() => openEditDialog(group)}
                      />
                      {group.status === 'ACTIVE' ? (
                        <IconActionButton
                          icon={BanIcon}
                          variant="outline"
                          title={
                            group.system
                              ? 'System Group cannot be deactivated'
                              : `Deactivate ${group.name}`
                          }
                          disabled={group.system}
                          onClick={() =>
                            setStatusChange({
                              group,
                              targetStatus: 'INACTIVE',
                            })
                          }
                        />
                      ) : (
                        <IconActionButton
                          icon={CircleCheckIcon}
                          variant="outline"
                          title={`Activate ${group.name}`}
                          onClick={() =>
                            setStatusChange({ group, targetStatus: 'ACTIVE' })
                          }
                        />
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          </Table>
        </div>
      </GlassPanel>

      <GlassPanel className="overflow-hidden p-0">
        <div className="border-b border-border/60 px-5 py-4">
          <h2 className="font-semibold">Membership Requests</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Approve or reject Group membership requested by Help Desk.
          </p>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Group</TableHead>
              <TableHead>Requested By</TableHead>
              <TableHead>Requested Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {membershipRequests.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-8 text-center text-muted-foreground"
                >
                  No pending membership requests.
                </TableCell>
              </TableRow>
            ) : (
              membershipRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    <p className="font-medium">{request.user?.name ?? 'Unavailable User'}</p>
                    <p className="text-xs text-muted-foreground">
                      {request.user?.email}
                    </p>
                  </TableCell>
                  <TableCell>{request.group?.name ?? 'Unavailable Group'}</TableCell>
                  <TableCell>{request.requester?.name ?? 'Unavailable User'}</TableCell>
                  <TableCell>{formatDate(request.requestedAt)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">Pending Approval</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <IconActionButton
                        icon={CircleCheckIcon}
                        variant="outline"
                        title={`Approve ${request.user?.name ?? 'membership request'}`}
                        onClick={() => handleApproveRequest(request)}
                      />
                      <IconActionButton
                        icon={XIcon}
                        variant="outline"
                        title={`Reject ${request.user?.name ?? 'membership request'}`}
                        onClick={() => {
                          setRejectionReason('')
                          setRejectingRequest(request)
                        }}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </GlassPanel>

      <GroupFormDialog
        open={createOpen}
        onOpenChange={handleCreateOpenChange}
        formId="create"
        title="Create Group"
        description="Create a group for your Company. Department Codes must be unique among active Groups."
        form={createForm}
        onFieldChange={updateCreateField}
        onSubmit={handleCreate}
        submitLabel="Create Group"
      />

      <GroupFormDialog
        open={Boolean(editingGroup)}
        onOpenChange={handleEditOpenChange}
        formId="edit"
        title="Edit Group"
        description="Update the Group profile. Company ownership and the created date cannot be changed."
        form={editForm}
        onFieldChange={updateEditField}
        onSubmit={handleEdit}
        submitLabel="Save Changes"
      />

      <GroupStatusDialog
        group={statusChange?.group}
        targetStatus={statusChange?.targetStatus}
        onOpenChange={(open) => {
          if (!open) setStatusChange(null)
        }}
        onConfirm={handleStatusChange}
      />

      <Dialog
        open={Boolean(rejectingRequest)}
        onOpenChange={(open) => {
          if (!open) {
            setRejectingRequest(null)
            setRejectionReason('')
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Membership Request</DialogTitle>
            <DialogDescription>
              Reject the request to add {rejectingRequest?.user?.name} to {rejectingRequest?.group?.name}. No Group membership will be created.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleRejectRequest}>
            <div className="space-y-2">
              <Label htmlFor="membership-rejection-reason">
                Rejection Reason
              </Label>
              <Textarea
                id="membership-rejection-reason"
                className="min-h-28"
                value={rejectionReason}
                onChange={(event) => setRejectionReason(event.target.value)}
                placeholder="Explain why this membership request is being rejected..."
                required
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setRejectingRequest(null)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="destructive">
                Reject Request
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </GlassSection>
  )
}

export default GroupsPage
