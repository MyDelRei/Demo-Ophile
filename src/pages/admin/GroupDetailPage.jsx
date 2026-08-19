import { useEffect, useState } from 'react'
import {
  BanIcon,
  CircleCheckIcon,
  PencilIcon,
  UserMinusIcon,
  UserPlusIcon,
} from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'

import {
  activateGroup,
  addUsersToGroup,
  deactivateGroup,
  getGroupById,
  getGroupMembers,
  removeUserFromGroup,
  updateGroup,
} from '@/api/groupApi'
import GroupFormDialog from '@/components/common/GroupFormDialog'
import GroupStatusDialog from '@/components/common/GroupStatusDialog'
import IconActionButton from '@/components/common/IconActionButton'
import GlassCard from '@/components/glass/GlassCard'
import GlassPanel from '@/components/glass/GlassPanel'
import GlassSection from '@/components/glass/GlassSection'
import { getOrganisationUsers } from '@/api/userApi'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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

const roleLabels = {
  ORGANISATION_ADMIN: 'Organisation Admin',
  HELP_DESK: 'Help Desk',
  USER: 'User',
}

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

function ProfileValue({ label, children, value }) {
  return (
    <div className="min-w-0">
      <p className="text-sm text-muted-foreground">{label}</p>
      {children ?? (
        <p className="break-words font-medium" title={value || undefined}>
          {value || '—'}
        </p>
      )}
    </div>
  )
}

function GroupDetailPage() {
  const { user } = useAuth()
  const { groupId } = useParams()
  const navigate = useNavigate()
  const { hideLoading, showLoading, showNotification } = useAppFeedback()
  const [group, setGroup] = useState(undefined)
  const [members, setMembers] = useState([])
  const [organisationUsers, setOrganisationUsers] = useState([])
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState(emptyGroupForm)
  const [statusChange, setStatusChange] = useState(null)
  const [addUsersOpen, setAddUsersOpen] = useState(false)
  const [selectedUserIds, setSelectedUserIds] = useState([])
  const [removingUser, setRemovingUser] = useState(null)

  async function refreshGroupDetails() {
    const [groupItem, memberItems] = await Promise.all([
      getGroupById(groupId, user.organisationId),
      getGroupMembers(groupId, user.organisationId),
    ])
    setGroup(groupItem)
    setMembers(memberItems)
  }

  useEffect(() => {
    let isActive = true

    async function loadGroupDetails() {
      try {
        const groupItem = await getGroupById(groupId, user.organisationId)

        if (!groupItem) {
          if (isActive) setGroup(null)
          return
        }

        const [memberItems, userItems] = await Promise.all([
          getGroupMembers(groupId, user.organisationId),
          getOrganisationUsers(user.organisationId),
        ])

        if (isActive) {
          setGroup(groupItem)
          setMembers(memberItems)
          setOrganisationUsers(userItems)
        }
      } catch (error) {
        if (isActive) {
          setGroup(null)
          showNotification(
            error.message || 'Unable to load group details.',
            'error',
          )
        }
      }
    }

    loadGroupDetails()

    return () => {
      isActive = false
    }
  }, [groupId, showNotification, user.organisationId])

  const memberIds = new Set(members.map((member) => member.id))
  const availableUsers = organisationUsers.filter(
    (organisationUser) => !memberIds.has(organisationUser.id),
  )

  function openEditDialog() {
    setEditForm({
      name: group.name,
      departmentCode: group.departmentCode,
      headlinePhone: group.headlinePhone,
      headlineEmail: group.headlineEmail,
    })
    setEditOpen(true)
  }

  function handleEditOpenChange(open) {
    setEditOpen(open)
    if (!open) setEditForm(emptyGroupForm)
  }

  function updateEditField(field, value) {
    setEditForm((current) => ({ ...current, [field]: value }))
  }

  async function handleEdit(event) {
    event.preventDefault()
    showLoading('Updating group...')

    try {
      await updateGroup(group.id, editForm, user.organisationId)
      handleEditOpenChange(false)
      await refreshGroupDetails()
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
        await activateGroup(group.id, user.organisationId)
      } else {
        await deactivateGroup(group.id, user.organisationId)
      }

      setStatusChange(null)
      await refreshGroupDetails()
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

  function handleAddUsersOpenChange(open) {
    setAddUsersOpen(open)
    if (!open) setSelectedUserIds([])
  }

  function toggleUser(userId) {
    setSelectedUserIds((current) =>
      current.includes(userId)
        ? current.filter((candidate) => candidate !== userId)
        : [...current, userId],
    )
  }

  async function handleAddUsers(event) {
    event.preventDefault()
    showLoading('Adding users to group...')

    try {
      await addUsersToGroup(groupId, selectedUserIds, user.organisationId)
      handleAddUsersOpenChange(false)
      await refreshGroupDetails()
      showNotification('Users added to group successfully.')
    } catch (error) {
      showNotification(
        error.message || 'Unable to add users to group.',
        'error',
      )
    } finally {
      hideLoading()
    }
  }

  async function handleRemoveUser() {
    showLoading('Removing user from group...')

    try {
      await removeUserFromGroup(
        groupId,
        removingUser.id,
        user.organisationId,
      )
      setRemovingUser(null)
      await refreshGroupDetails()
      showNotification('User removed from group successfully.')
    } catch (error) {
      showNotification(
        error.message || 'Unable to remove user from group.',
        'error',
      )
    } finally {
      hideLoading()
    }
  }

  if (group === undefined) {
    return <p className="text-sm text-muted-foreground">Loading group...</p>
  }

  if (!group) {
    return (
      <GlassSection className="space-y-4">
        <h1 className="text-2xl font-semibold">Group not found</h1>
        <p className="text-muted-foreground">
          This group does not exist or does not belong to your Company.
        </p>
        <Button variant="outline" onClick={() => navigate('/admin/groups')}>
          Back to Groups
        </Button>
      </GlassSection>
    )
  }

  return (
    <GlassSection>
      <Button variant="outline" onClick={() => navigate('/admin/groups')}>
        Back to Groups
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold">{group.name}</h1>
            {group.system && <Badge variant="secondary">System</Badge>}
          </div>
          <p className="text-muted-foreground">
            View the Group profile and manage its members.
          </p>
        </div>

        <div className="flex flex-wrap gap-2" aria-label="Group actions">
          <IconActionButton
            icon={PencilIcon}
            variant="outline"
            title={group.system ? 'System Group cannot be edited' : 'Edit Group'}
            disabled={group.system}
            onClick={openEditDialog}
          />
          {group.status === 'ACTIVE' ? (
            <>
              <IconActionButton
                icon={BanIcon}
                variant="outline"
                title={
                  group.system
                    ? 'System Group cannot be deactivated'
                    : 'Deactivate Group'
                }
                disabled={group.system}
                onClick={() =>
                  setStatusChange({ group, targetStatus: 'INACTIVE' })
                }
              />
              <IconActionButton
                icon={UserPlusIcon}
                variant="outline"
                title={
                  group.system
                    ? 'System Group membership is role-managed'
                    : 'Add Users'
                }
                disabled={group.system}
                onClick={() => setAddUsersOpen(true)}
              />
            </>
          ) : (
            <IconActionButton
              icon={CircleCheckIcon}
              variant="outline"
              title="Activate Group"
              onClick={() => setStatusChange({ group, targetStatus: 'ACTIVE' })}
            />
          )}
        </div>
      </div>

      <GlassCard>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ProfileValue label="Group Name" value={group.name} />
          <ProfileValue
            label="Group Type"
            value={group.system ? 'System Group' : 'Company Group'}
          />
          <ProfileValue
            label="Department Code"
            value={group.departmentCode}
          />
          <ProfileValue label="Headline Phone" value={group.headlinePhone} />
          <ProfileValue label="Headline Email" value={group.headlineEmail} />
          <ProfileValue label="Status">
            <Badge
              className="mt-1"
              variant={group.status === 'ACTIVE' ? 'default' : 'secondary'}
            >
              {group.status === 'ACTIVE' ? 'Active' : 'Inactive'}
            </Badge>
          </ProfileValue>
          <ProfileValue
            label="Created Date"
            value={formatDate(group.createdAt)}
          />
          <ProfileValue
            label="Updated Date"
            value={formatDate(group.updatedAt)}
          />
          <ProfileValue label="Total Members" value={String(group.memberCount)} />
        </CardContent>
      </GlassCard>

      <GlassPanel className="overflow-hidden p-0">
        <div className="px-5 py-4">
          <h2 className="text-xl font-semibold">Group Members</h2>
          {group.status === 'INACTIVE' && (
            <p className="mt-1 text-sm text-muted-foreground">
              Inactive Groups preserve existing memberships and cannot receive
              new members.
            </p>
          )}
        </div>

        <div className="overflow-x-auto border-t border-border/60">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Login ID</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground"
                  >
                    No group members
                  </TableCell>
                </TableRow>
              ) : (
                members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      {member.name}
                    </TableCell>
                    <TableCell>{member.loginId}</TableCell>
                    <TableCell>
                      {roleLabels[member.role] ?? member.role}
                    </TableCell>
                    <TableCell>
                      <Badge variant={member.active ? 'default' : 'secondary'}>
                        {member.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <IconActionButton
                        icon={UserMinusIcon}
                        variant="outline"
                        title={
                          group.system
                            ? 'System Group membership is role-managed'
                            : `Remove ${member.name} from Group`
                        }
                        disabled={group.system}
                        onClick={() => setRemovingUser(member)}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </GlassPanel>

      <GroupFormDialog
        open={editOpen}
        onOpenChange={handleEditOpenChange}
        formId="detail-edit"
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

      <Dialog open={addUsersOpen} onOpenChange={handleAddUsersOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Users</DialogTitle>
            <DialogDescription>
              Select one or more users from your Company. Users can belong to
              multiple Groups.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleAddUsers}>
            <div className="max-h-72 space-y-2 overflow-y-auto rounded-lg border p-2">
              {availableUsers.length === 0 ? (
                <p className="p-2 text-sm text-muted-foreground">
                  All Company users are already members of this Group.
                </p>
              ) : (
                availableUsers.map((availableUser) => (
                  <label
                    key={availableUser.id}
                    className="flex cursor-pointer items-start gap-3 rounded-lg p-2 hover:bg-muted"
                  >
                    <input
                      className="mt-1 size-4 accent-current"
                      type="checkbox"
                      checked={selectedUserIds.includes(availableUser.id)}
                      onChange={() => toggleUser(availableUser.id)}
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium">
                        {availableUser.name}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {availableUser.loginId} ·{' '}
                        {roleLabels[availableUser.role] ?? availableUser.role}
                      </span>
                    </span>
                  </label>
                ))
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleAddUsersOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={selectedUserIds.length === 0}>
                Add Users
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(removingUser)}
        onOpenChange={(open) => {
          if (!open) setRemovingUser(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove User From Group</DialogTitle>
            <DialogDescription>
              Remove {removingUser?.name} from {group.name}? This will not
              deactivate the user, change their role, or affect other Group
              memberships.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemovingUser(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRemoveUser}>
              Remove User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </GlassSection>
  )
}

export default GroupDetailPage
