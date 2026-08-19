import { CheckIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

const lifecycleSteps = [
  { status: 'OPEN', label: 'Open' },
  { status: 'PENDING', label: 'Pending' },
  { status: 'IMPLEMENTATION', label: 'In Progress' },
  { status: 'RESOLVED', label: 'Resolved' },
  { status: 'CLOSED', label: 'Closed' },
]

function TicketLifecycleStepper({ status }) {
  const currentIndex = lifecycleSteps.findIndex((step) => step.status === status)

  return (
    <div className="overflow-x-auto pb-2" aria-label="Ticket lifecycle">
      <ol className="flex min-w-[42rem] items-start">
        {lifecycleSteps.map((step, index) => {
          const complete = index < currentIndex
          const current = index === currentIndex

          return (
            <li key={step.status} className="relative flex flex-1 flex-col items-center text-center">
              {index > 0 && (
                <span
                  className={cn(
                    'absolute top-4 right-1/2 h-0.5 w-full -translate-y-1/2',
                    index <= currentIndex ? 'bg-foreground' : 'bg-border',
                  )}
                  aria-hidden="true"
                />
              )}
              <span
                className={cn(
                  'relative z-10 flex size-8 items-center justify-center rounded-full border-2 bg-background text-xs font-semibold',
                  complete && 'border-foreground bg-foreground text-background',
                  current && 'border-foreground ring-4 ring-foreground/10',
                  !complete && !current && 'border-border text-muted-foreground',
                )}
                aria-current={current ? 'step' : undefined}
              >
                {complete ? <CheckIcon className="size-4" /> : index + 1}
              </span>
              <span className={cn('mt-2 text-xs font-medium', !current && !complete && 'text-muted-foreground')}>
                {step.label}
              </span>
              <span className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                {step.status}
              </span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

export default TicketLifecycleStepper
