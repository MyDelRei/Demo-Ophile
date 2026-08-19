import { CircleAlertIcon, CircleCheckIcon, XIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'

function GlobalNotification({ message, variant = 'success', onDismiss }) {
  const Icon = variant === 'error' ? CircleAlertIcon : CircleCheckIcon

  return (
    <div
      className="fixed right-4 top-4 z-[110] flex w-[calc(100%-2rem)] max-w-sm items-start gap-3 rounded-lg border bg-background p-4 shadow-lg"
      role={variant === 'error' ? 'alert' : 'status'}
      aria-live="polite"
    >
      <Icon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
      <p className="min-w-0 flex-1 text-sm font-medium">{message}</p>
      <Button
        type="button"
        size="icon-xs"
        variant="ghost"
        onClick={onDismiss}
        aria-label="Dismiss notification"
      >
        <XIcon />
      </Button>
    </div>
  )
}

export default GlobalNotification
