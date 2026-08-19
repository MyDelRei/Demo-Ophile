import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

function UserStatusDialog({ onConfirm, onOpenChange, targetStatus, user }) {
  const isActivating = targetStatus === 'ACTIVE'
  const actionLabel = isActivating ? 'Activate User' : 'Deactivate User'

  return (
    <Dialog open={Boolean(user)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{actionLabel}</DialogTitle>
          <DialogDescription>
            {isActivating
              ? `Activate ${user?.name}? They will be able to use their Ophile account again.`
              : `Deactivate ${user?.name}? Their account, Group memberships, and historical references will be preserved.`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant={isActivating ? 'default' : 'destructive'}
            onClick={onConfirm}
          >
            {actionLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default UserStatusDialog
