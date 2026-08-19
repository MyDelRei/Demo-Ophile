import { useState } from 'react'
import { ArrowLeftIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { createHelpDeskUser } from '@/api/userApi'
import UserForm from '@/components/common/UserForm'
import GlassSection from '@/components/glass/GlassSection'
import { Button } from '@/components/ui/button'
import { useAppFeedback } from '@/hooks/useAppFeedback'
import { useAuth } from '@/hooks/useAuth'

const emptyHelpDeskForm = {
  firstName: '',
  lastName: '',
  birthDate: '',
  identityType: '',
  telephone: '',
  email: '',
  currentAddress: '',
  position: '',
  groupIds: [],
  loginId: '',
  role: 'HELP_DESK',
  active: true,
}

function CreateHelpDeskPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { hideLoading, showLoading, showNotification } = useAppFeedback()
  const [form, setForm] = useState(emptyHelpDeskForm)

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
    showLoading('Creating Help Desk user...')

    try {
      const createdUser = await createHelpDeskUser(
        user.organisationId,
        form,
      )
      showNotification('Help Desk user created successfully.')
      navigate(`/admin/helpdesk/${createdUser.id}`)
    } catch (error) {
      showNotification(
        error.message || 'Unable to create Help Desk user.',
        'error',
      )
    } finally {
      hideLoading()
    }
  }

  return (
    <GlassSection>
      <Button variant="outline" onClick={() => navigate('/admin/helpdesk')}>
        <ArrowLeftIcon />
        Back to Help Desk Management
      </Button>

      <div>
        <h1 className="text-2xl font-semibold">Create Help Desk</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create a Help Desk account and optionally assign active Company Groups.
        </p>
      </div>

      <UserForm
        availableGroups={[]}
        form={form}
        formId="create-help-desk"
        onCancel={() => navigate('/admin/helpdesk')}
        onFieldChange={updateField}
        onGroupToggle={toggleGroup}
        onSubmit={handleSubmit}
        readOnlyGroupLabel="Help Desk"
        roleReadOnly
        submitLabel="Create Help Desk"
      />
    </GlassSection>
  )
}

export default CreateHelpDeskPage
