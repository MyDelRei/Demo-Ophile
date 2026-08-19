export const userRoleOptions = [
  { value: 'USER', label: 'User' },
  { value: 'HELP_DESK', label: 'Help Desk' },
  { value: 'ORGANISATION_ADMIN', label: 'Organisation Admin' },
]

export const userRoleLabels = Object.fromEntries(
  userRoleOptions.map((option) => [option.value, option.label]),
)

export const identityTypeLabels = {
  NATIONAL_ID: 'National ID',
  PASSPORT: 'Passport',
}
