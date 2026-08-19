import { useState } from 'react'
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'

import { glassFormControlClass } from '@/components/glass/glassStyles'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { parseDateValue, toDateValue } from '@/lib/dateUtils'
import { cn } from '@/lib/utils'

function DatePicker({
  captionLayout = 'label',
  className,
  defaultMonth,
  disabled = false,
  id,
  maxDate,
  minDate,
  onChange,
  placeholder = 'Select date',
  required = false,
  value,
}) {
  const [open, setOpen] = useState(false)
  const selectedDate = parseDateValue(value)
  const normalizedMinDate = parseDateValue(minDate)
  const normalizedMaxDate = parseDateValue(maxDate)
  const normalizedDefaultMonth = parseDateValue(defaultMonth)
  const disabledDates = [
    normalizedMinDate ? { before: normalizedMinDate } : null,
    normalizedMaxDate ? { after: normalizedMaxDate } : null,
  ].filter(Boolean)

  function selectDate(date) {
    onChange(toDateValue(date))
    if (date) setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            aria-required={required || undefined}
            className={cn(
              glassFormControlClass,
              'w-full justify-start px-3 text-left font-normal',
              !selectedDate && 'text-muted-foreground',
              className,
            )}
          >
            <CalendarIcon data-icon="inline-start" />
            {selectedDate ? format(selectedDate, 'MMM d, yyyy') : placeholder}
          </Button>
        }
      />
      <PopoverContent className="w-auto max-w-[calc(100vw-2rem)] gap-0 overflow-auto bg-popover p-0" align="start">
        <Calendar
          mode="single"
          required={required}
          selected={selectedDate}
          onSelect={selectDate}
          defaultMonth={
            selectedDate ?? normalizedDefaultMonth ?? normalizedMaxDate
          }
          captionLayout={captionLayout}
          startMonth={normalizedMinDate}
          endMonth={normalizedMaxDate}
          disabled={disabledDates}
          autoFocus
        />
        {selectedDate && !required && (
          <div className="flex justify-end border-t p-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => selectDate(undefined)}>
              Clear date
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

export default DatePicker
