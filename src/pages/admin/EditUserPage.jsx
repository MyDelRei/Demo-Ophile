import { useEffect, useState } from 'react'
import { ArrowLeftIcon, ShieldCheckIcon } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'

import { getGroups } from '@/api/groupApi'
import { getUserById, updateUser } from '@/api/userApi'
import UserForm from '@/components/common/UserForm'
import GlassSection from '@/components/glass/GlassSection'
import { Button } from '@/components/ui/button'
import { useAppFeedback } from '@/hooks/useAppFeedback'
import { useAuth } from '@/hooks/useAuth'

function toForm(user) {
  return {
    firstName: user.firstName,
    lastName: user.lastName,
    birthDate: user.birthDate ?? '',
    identityType: user.identityType ?? '',
    telephone: user.telephone ?? '',
    email: user.email,
    currentAddress: user.currentAddress ?? '',
    position: user.position ?? '',
    groupIds: user.groups.map((group) => group.id),
    loginId: user.loginId,
    role: user.role,
    active: user.active,
  }
}

function EditUserPage() {
  const { user: currentUser } = useAuth()
  const { userId } = useParams()
  const navigate = useNavigate()
  const { hideLoading, showLoading, showNotification } = useAppFeedback()
  const [targetUser, setTargetUser] = useState(undefined)
  const [groups, setGroups] = useState([])
  const [form, setForm] = useState(null)

  useEffect(() => {
    let isActive = true

    Promise.all([
      getUserById(userId, currentUser.organisationId),
      getGroups(currentUser.organisationId),
    ])
      .then(([userItem, groupItems]) => {
        if (!isActive) return

        setTargetUser(userItem)
        if (userItem) {
          const userForm = toForm(userItem)
          setForm(userForm)
          setGroups(
            groupItems.filter(
              (group) =>
                group.status === 'ACTIVE' || userForm.groupIds.includes(group.id),
            ),
          )
        }
      })
      .catch((error) => {
        if (isActive) {
          setTargetUser(null)
          showNotification(error.message || 'Unable to load user.', 'error')
        }
      })

    return () => {
      isActive = false
    }
  }, [currentUser.organisationId, showNotification, userId])

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function toggleGroup(groupId) {
    setForm((current) => ({
      ...current,
      groupIds: current.groupIds.includes(groupId)
        ? current.groupIds.filter((candidate) => candidate !== groupId)
        : [...current.groupIds, groupId],
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    showLoading('Updating user...')

    try {
      await updateUser(
        userId,
        form,
        currentUser.organisationId,
        currentUser.id,
      )
      showNotification('User updated successfully.')
      navigate(`/admin/users/${userId}`)
    } catch (error) {
      showNotification(error.message || 'Unable to update user.', 'error')
    } finally {
      hideLoading()
    }
  }

  if (targetUser === undefined) {
    return <p className="text-sm text-muted-foreground">Loading user...</p>
  }

  if (!targetUser || !form) {
    return (
      <GlassSection>
        <h1 className="text-2xl font-semibold">User not found</h1>
        <p className="text-muted-foreground">
          This user does not exist or does not belong to your Company.
        </p>
        <Button variant="outline" onClick={() => navigate('/admin/users')}>
          Back to Users
        </Button>
      </GlassSection>
    )
  }

  return (
    <GlassSection>
      <Button variant="outline" onClick={() => navigate(`/admin/users/${userId}`)}>
        <ArrowLeftIcon />
        Back to User
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Edit User</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Update {targetUser.name}&apos;s profile, account, and Group membership.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() =>
            navigate(`/admin/roles-permissions/users/${userId}`)
          }
        >
          <ShieldCheckIcon />
          Manage Access
        </Button>
      </div>

      <UserForm
        availableGroups={groups}
        form={form}
        formId="edit-user"
        onCancel={() => navigate(`/admin/users/${userId}`)}
        onFieldChange={updateField}
        onGroupToggle={toggleGroup}
        onSubmit={handleSubmit}
        roleDisabled
        roleDisabledMessage={
          targetUser.id === currentUser.id
            ? 'You cannot change your own system role.'
            : 'Use Roles & Permissions to change this user’s system role.'
        }
        submitLabel="Save Changes"
      />
    </GlassSection>
  )
}

export default EditUserPage
