import { useEffect, useState } from 'react'
import { ArrowLeftIcon } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'

import {
  getHelpDeskUserById,
  updateHelpDeskUser,
} from '@/api/userApi'
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
    role: 'HELP_DESK',
    active: user.active,
  }
}

function EditHelpDeskPage() {
  const { user: currentUser } = useAuth()
  const { userId } = useParams()
  const navigate = useNavigate()
  const { hideLoading, showLoading, showNotification } = useAppFeedback()
  const [targetUser, setTargetUser] = useState(undefined)
  const [form, setForm] = useState(null)

  useEffect(() => {
    let isActive = true

    getHelpDeskUserById(userId, currentUser.organisationId)
      .then((userItem) => {
        if (!isActive) return

        setTargetUser(userItem)
        if (userItem) {
          setForm(toForm(userItem))
        }
      })
      .catch((error) => {
        if (isActive) {
          setTargetUser(null)
          showNotification(
            error.message || 'Unable to load Help Desk user.',
            'error',
          )
        }
      })

    return () => {
      isActive = false
    }
  }, [currentUser.organisationId, showNotification, userId])

  function updateField(field, value) {
    if (field === 'role') return
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
    showLoading('Updating Help Desk user...')

    try {
      await updateHelpDeskUser(userId, form, currentUser.organisationId)
      showNotification('Help Desk user updated successfully.')
      navigate(`/admin/helpdesk/${userId}`)
    } catch (error) {
      showNotification(
        error.message || 'Unable to update Help Desk user.',
        'error',
      )
    } finally {
      hideLoading()
    }
  }

  if (targetUser === undefined) {
    return (
      <p className="text-sm text-muted-foreground">
        Loading Help Desk user...
      </p>
    )
  }

  if (!targetUser || !form) {
    return (
      <GlassSection>
        <h1 className="text-2xl font-semibold">Help Desk user not found</h1>
        <p className="text-muted-foreground">
          This Help Desk user does not exist or does not belong to your Company.
        </p>
        <Button variant="outline" onClick={() => navigate('/admin/helpdesk')}>
          Back to Help Desk Management
        </Button>
      </GlassSection>
    )
  }

  return (
    <GlassSection>
      <Button
        variant="outline"
        onClick={() => navigate(`/admin/helpdesk/${userId}`)}
      >
        <ArrowLeftIcon />
        Back to Help Desk User
      </Button>

      <div>
        <h1 className="text-2xl font-semibold">Edit Help Desk</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Update {targetUser.name}&apos;s profile, account, and Group membership.
        </p>
      </div>

      <UserForm
        availableGroups={[]}
        form={form}
        formId="edit-help-desk"
        onCancel={() => navigate(`/admin/helpdesk/${userId}`)}
        onFieldChange={updateField}
        onGroupToggle={toggleGroup}
        onSubmit={handleSubmit}
        readOnlyGroupLabel="Help Desk"
        roleReadOnly
        submitLabel="Save Changes"
      />
    </GlassSection>
  )
}

export default EditHelpDeskPage
