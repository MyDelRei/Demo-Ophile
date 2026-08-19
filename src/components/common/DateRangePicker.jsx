import { useState } from 'react'
import { CalendarRangeIcon } from 'lucide-react'
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

function DateRangePicker({
  className,
  disabled = false,
  id,
  maxDate,
  minDate,
  onChange,
  placeholder = 'Select date range',
  value,
}) {
  const [open, setOpen] = useState(false)
  const [selectionStart, setSelectionStart] = useState()
  const from = parseDateValue(value?.from)
  const to = parseDateValue(value?.to)
  const normalizedMinDate = parseDateValue(minDate)
  const normalizedMaxDate = parseDateValue(maxDate)
  const selectedRange = from ? { from, to } : undefined
  const disabledDates = [
    normalizedMinDate ? { before: normalizedMinDate } : null,
    normalizedMaxDate ? { after: normalizedMaxDate } : null,
  ].filter(Boolean)
  const displayValue = from
    ? to
      ? `${format(from, 'MMM d, yyyy')} – ${format(to, 'MMM d, yyyy')}`
      : `${format(from, 'MMM d, yyyy')} – …`
    : placeholder

  function handleOpenChange(nextOpen) {
    setOpen(nextOpen)

    if (nextOpen) {
      setSelectionStart(from && !to ? from : undefined)
    }
  }

  function selectRange(_range, selectedDay) {
    if (!selectionStart) {
      setSelectionStart(selectedDay)
      onChange({ from: toDateValue(selectedDay), to: '' })
      return
    }

    const rangeStart =
      selectedDay < selectionStart ? selectedDay : selectionStart
    const rangeEnd = selectedDay < selectionStart ? selectionStart : selectedDay

    onChange({
      from: toDateValue(rangeStart),
      to: toDateValue(rangeEnd),
    })
    setSelectionStart(undefined)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        render={
          <Button
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn(
              glassFormControlClass,
              'w-full justify-start px-3 text-left font-normal',
              !from && 'text-muted-foreground',
              className,
            )}
          >
            <CalendarRangeIcon data-icon="inline-start" />
            <span className="truncate">{displayValue}</span>
          </Button>
        }
      />
      <PopoverContent className="w-auto max-w-[calc(100vw-2rem)] gap-0 overflow-auto bg-popover p-0" align="start">
        <Calendar
          mode="range"
          selected={selectedRange}
          onSelect={selectRange}
          defaultMonth={from}
          startMonth={normalizedMinDate}
          endMonth={normalizedMaxDate}
          disabled={disabledDates}
          numberOfMonths={2}
          autoFocus
        />
        {from && (
          <div className="flex justify-end border-t p-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectionStart(undefined)
                onChange({ from: '', to: '' })
              }}
            >
              Clear range
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

export default DateRangePicker
