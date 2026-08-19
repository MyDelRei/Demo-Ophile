import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function GroupFormDialog({
  description,
  form,
  formId,
  onFieldChange,
  onOpenChange,
  onSubmit,
  open,
  submitLabel,
  title,
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`${formId}-group-name`}>Group Name</Label>
              <Input
                id={`${formId}-group-name`}
                value={form.name}
                onChange={(event) => onFieldChange('name', event.target.value)}
                autoFocus
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${formId}-department-code`}>
                Department Code
              </Label>
              <Input
                id={`${formId}-department-code`}
                value={form.departmentCode}
                onChange={(event) =>
                  onFieldChange('departmentCode', event.target.value)
                }
                placeholder="e.g. IT or PP-CENTRE"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${formId}-headline-phone`}>
                Headline Phone
              </Label>
              <Input
                id={`${formId}-headline-phone`}
                type="tel"
                value={form.headlinePhone}
                onChange={(event) =>
                  onFieldChange('headlinePhone', event.target.value)
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${formId}-headline-email`}>
                Headline Email
              </Label>
              <Input
                id={`${formId}-headline-email`}
                type="email"
                value={form.headlineEmail}
                onChange={(event) =>
                  onFieldChange('headlineEmail', event.target.value)
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">{submitLabel}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default GroupFormDialog
