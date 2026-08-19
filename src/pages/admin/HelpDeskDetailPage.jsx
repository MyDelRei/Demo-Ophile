import { useEffect, useState } from 'react'
import {
  ArrowLeftIcon,
  BanIcon,
  CircleCheckIcon,
  PencilIcon,
} from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'

import {
  activateHelpDeskUser,
  deactivateHelpDeskUser,
  getHelpDeskUserById,
} from '@/api/userApi'
import IconActionButton from '@/components/common/IconActionButton'
import UserStatusDialog from '@/components/common/UserStatusDialog'
import GlassCard from '@/components/glass/GlassCard'
import GlassSection from '@/components/glass/GlassSection'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CardContent } from '@/components/ui/card'
import { useAppFeedback } from '@/hooks/useAppFeedback'
import { useAuth } from '@/hooks/useAuth'
import { calculateAge } from '@/lib/dateUtils'
import { identityTypeLabels } from '@/lib/userOptions'

function formatDate(value) {
  if (!value) return '—'

  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? '—'
    : new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(date)
}

function ProfileValue({ children, label, value }) {
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

function ProfileSection({ children, description, title }) {
  return (
    <GlassCard>
      <CardContent>
        <div className="mb-5">
          <h2 className="font-semibold">{title}</h2>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {children}
        </div>
      </CardContent>
    </GlassCard>
  )
}

function HelpDeskDetailPage() {
  const { user: currentUser } = useAuth()
  const { userId } = useParams()
  const navigate = useNavigate()
  const { hideLoading, showLoading, showNotification } = useAppFeedback()
  const [targetUser, setTargetUser] = useState(undefined)
  const [statusChange, setStatusChange] = useState(null)

  async function refreshUser() {
    const userItem = await getHelpDeskUserById(
      userId,
      currentUser.organisationId,
    )
    setTargetUser(userItem)
  }

  useEffect(() => {
    let isActive = true

    getHelpDeskUserById(userId, currentUser.organisationId)
      .then((userItem) => {
        if (isActive) setTargetUser(userItem)
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

  async function handleStatusChange() {
    const isActivating = statusChange.targetStatus === 'ACTIVE'
    showLoading(
      isActivating
        ? 'Activating Help Desk user...'
        : 'Deactivating Help Desk user...',
    )

    try {
      if (isActivating) {
        await activateHelpDeskUser(userId, currentUser.organisationId)
      } else {
        await deactivateHelpDeskUser(userId, currentUser.organisationId)
      }

      setStatusChange(null)
      await refreshUser()
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

  if (targetUser === undefined) {
    return (
      <p className="text-sm text-muted-foreground">
        Loading Help Desk user...
      </p>
    )
  }

  if (!targetUser) {
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

  const age = calculateAge(targetUser.birthDate)

  return (
    <GlassSection>
      <Button variant="outline" onClick={() => navigate('/admin/helpdesk')}>
        <ArrowLeftIcon />
        Back to Help Desk Management
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{targetUser.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review this Help Desk user&apos;s profile, employment, and account.
          </p>
        </div>
        <div className="flex gap-2" aria-label="Help Desk user actions">
          <IconActionButton
            icon={PencilIcon}
            variant="outline"
            title="Edit Help Desk"
            onClick={() => navigate(`/admin/helpdesk/${userId}/edit`)}
          />
          <IconActionButton
            icon={targetUser.active ? BanIcon : CircleCheckIcon}
            variant="outline"
            title={
              targetUser.active
                ? 'Deactivate Help Desk User'
                : 'Activate Help Desk User'
            }
            onClick={() =>
              setStatusChange({
                user: targetUser,
                targetStatus: targetUser.active ? 'INACTIVE' : 'ACTIVE',
              })
            }
          />
        </div>
      </div>

      <ProfileSection title="Personal Information">
        <ProfileValue label="First Name" value={targetUser.firstName} />
        <ProfileValue label="Last Name" value={targetUser.lastName} />
        <ProfileValue
          label="Birth Date"
          value={formatDate(targetUser.birthDate)}
        />
        <ProfileValue label="Age" value={age === null ? '—' : String(age)} />
        <ProfileValue
          label="ID Type"
          value={identityTypeLabels[targetUser.identityType] ?? '—'}
        />
        <ProfileValue label="Telephone" value={targetUser.telephone} />
        <ProfileValue label="Email" value={targetUser.email} />
        <ProfileValue
          label="Current Address"
          value={targetUser.currentAddress}
        />
      </ProfileSection>

      <ProfileSection
        title="Employment"
        description="Group membership does not control Help Desk permissions."
      >
        <ProfileValue label="Position" value={targetUser.position} />
        <ProfileValue label="Group" value="Help Desk" />
      </ProfileSection>

      <ProfileSection
        title="Ophile Account"
        description="Inactive Help Desk users cannot receive new ticket assignments."
      >
        <ProfileValue label="Login ID" value={targetUser.loginId} />
        <ProfileValue label="User Type" value="Help Desk" />
        <ProfileValue label="Status">
          <Badge
            className="mt-1"
            variant={targetUser.active ? 'default' : 'secondary'}
          >
            {targetUser.active ? 'Active' : 'Inactive'}
          </Badge>
        </ProfileValue>
        <ProfileValue
          label="Created Date"
          value={formatDate(targetUser.createdAt)}
        />
        <ProfileValue
          label="Updated Date"
          value={formatDate(targetUser.updatedAt)}
        />
      </ProfileSection>

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

export default HelpDeskDetailPage
