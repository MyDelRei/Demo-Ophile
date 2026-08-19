import { format, isValid } from 'date-fns'

export function formatTicketDate(value) {
  const date = new Date(value)
  return isValid(date) ? format(date, 'MMM d, yyyy') : '—'
}

export function formatTicketDateTime(value) {
  const date = new Date(value)
  return isValid(date) ? format(date, 'MMM d, yyyy, h:mm a') : '—'
}
