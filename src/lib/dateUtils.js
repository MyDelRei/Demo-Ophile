import { format, isValid, parse } from 'date-fns'

export function parseDateValue(value) {
  if (!value) return undefined
  if (value instanceof Date) return isValid(value) ? value : undefined

  const parsedDate = parse(String(value), 'yyyy-MM-dd', new Date())
  return isValid(parsedDate) &&
    format(parsedDate, 'yyyy-MM-dd') === String(value)
    ? parsedDate
    : undefined
}

export function toDateValue(date) {
  return date && isValid(date) ? format(date, 'yyyy-MM-dd') : ''
}

export function calculateAge(birthDate, referenceDate = new Date()) {
  if (!birthDate) return null

  const [year, month, day] = String(birthDate).split('-').map(Number)

  if (!year || !month || !day) return null

  const birthDateValue = new Date(year, month - 1, day)

  if (
    Number.isNaN(birthDateValue.getTime()) ||
    birthDateValue.getFullYear() !== year ||
    birthDateValue.getMonth() !== month - 1 ||
    birthDateValue.getDate() !== day ||
    birthDateValue > referenceDate
  ) {
    return null
  }

  let age = referenceDate.getFullYear() - year
  const birthdayHasPassed =
    referenceDate.getMonth() > month - 1 ||
    (referenceDate.getMonth() === month - 1 &&
      referenceDate.getDate() >= day)

  if (!birthdayHasPassed) age -= 1
  return age
}
