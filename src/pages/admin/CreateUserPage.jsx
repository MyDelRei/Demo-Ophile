import { useEffect, useState } from 'react'
import { ArrowLeftIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { getGroups } from '@/api/groupApi'
import { createUser } from '@/api/userApi'
import UserForm from '@/components/common/UserForm'
import GlassSection from '@/components/glass/GlassSection'
import { Button } from '@/components/ui/button'
import { useAppFeedback } from '@/hooks/useAppFeedback'
import { useAuth } from '@/hooks/useAuth'

const emptyUserForm = {
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
  role: 'USER',
  active: true,
}

function CreateUserPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { hideLoading, showLoading, showNotification } = useAppFeedback()
  const [groups, setGroups] = useState([])
  const [form, setForm] = useState(emptyUserForm)

  useEffect(() => {
    let isActive = true

    getGroups(user.organisationId)
      .then((items) => {
        if (isActive) {
          setGroups(items.filter((group) => group.status === 'ACTIVE'))
        }
      })
      .catch((error) => {
        if (isActive) {
          showNotification(error.message || 'Unable to load Groups.', 'error')
        }
      })

    return () => {
      isActive = false
    }
  }, [showNotification, user.organisationId])

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
    showLoading('Creating user...')

    try {
      const createdUser = await createUser(user.organisationId, form)
      showNotification('User created successfully.')
      navigate(`/admin/users/${createdUser.id}`)
    } catch (error) {
      showNotification(error.message || 'Unable to create user.', 'error')
    } finally {
      hideLoading()
    }
  }

  return (
    <GlassSection>
      <Button variant="outline" onClick={() => navigate('/admin/users')}>
        <ArrowLeftIcon />
        Back to Users
      </Button>

      <div>
        <h1 className="text-2xl font-semibold">Create User</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Add a Company user and optionally assign them to active Groups.
        </p>
      </div>

      <UserForm
        availableGroups={groups}
        form={form}
        formId="create-user"
        onCancel={() => navigate('/admin/users')}
        onFieldChange={updateField}
        onGroupToggle={toggleGroup}
        onSubmit={handleSubmit}
        submitLabel="Create User"
      />
    </GlassSection>
  )
}

export default CreateUserPage
