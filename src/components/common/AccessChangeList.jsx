import { Badge } from '@/components/ui/badge'
import { userRoleLabels } from '@/lib/userOptions'

function formatDateTime(value) {
  const date = new Date(value)

  if (!value || Number.isNaN(date.getTime())) return '—'

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function formatValue(change, value) {
  return change.changeType === 'ROLE_CHANGED'
    ? userRoleLabels[value] ?? value
    : value
}

function AccessChangeList({ changes, permissionDefinitions = [] }) {
  const permissionLabels = Object.fromEntries(
    permissionDefinitions.map((item) => [item.key, item.label]),
  )

  if (!changes.length) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        No access changes recorded yet.
      </p>
    )
  }

  return (
    <div className="divide-y divide-border/60">
      {changes.map((change) => (
        <div
          key={change.id}
          className="grid gap-3 py-4 first:pt-0 last:pb-0 sm:grid-cols-[minmax(0,1fr)_auto]"
        >
          <div className="min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium">{change.userName}</p>
              <Badge variant="secondary">
                {change.changeType === 'ROLE_CHANGED'
                  ? 'Role Changed'
                  : change.changeType === 'PERMISSION_ENABLED'
                    ? 'Permission Enabled'
                    : 'Permission Disabled'}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Changed by {change.changedByName}
            </p>
            {change.permission && (
              <p className="text-sm font-medium">
                {permissionLabels[change.permission] ?? change.permission}
              </p>
            )}
            <p className="text-sm">
              <span className="text-muted-foreground">Previous:</span>{' '}
              {formatValue(change, change.previousValue)}
              <span className="mx-2 text-muted-foreground">→</span>
              <span className="text-muted-foreground">New:</span>{' '}
              {formatValue(change, change.newValue)}
            </p>
          </div>
          <time className="text-sm text-muted-foreground">
            {formatDateTime(change.createdAt)}
          </time>
        </div>
      ))}
    </div>
  )
}

export default AccessChangeList
