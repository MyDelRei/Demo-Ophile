import { LoaderCircleIcon } from 'lucide-react'

function GlobalLoading({ message = 'Processing...' }) {
  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-background/80 p-4 backdrop-blur-sm"
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <div className="flex items-center gap-3 rounded-lg border bg-background px-5 py-4 shadow-lg">
        <LoaderCircleIcon className="size-5 animate-spin" aria-hidden="true" />
        <p className="text-sm font-medium">{message}</p>
      </div>
    </div>
  )
}

export default GlobalLoading
