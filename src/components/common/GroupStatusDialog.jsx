import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

function GroupStatusDialog({ group, onConfirm, onOpenChange, targetStatus }) {
  const isActivating = targetStatus === 'ACTIVE'
  const actionLabel = isActivating ? 'Activate Group' : 'Deactivate Group'

  return (
    <Dialog open={Boolean(group)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{actionLabel}</DialogTitle>
          <DialogDescription>
            {isActivating
              ? `Activate ${group?.name}? It will be able to receive new members again.`
              : `Deactivate ${group?.name}? Its historical memberships will be preserved, but new members cannot be added.`}
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

export default GroupStatusDialog
