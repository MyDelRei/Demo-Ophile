import { useContext } from 'react'

import { OrganisationAppearanceContext } from '@/context/organisation-appearance-context'

export function useOrganisationAppearance() {
  const context = useContext(OrganisationAppearanceContext)

  if (!context) {
    throw new Error(
      'useOrganisationAppearance must be used within OrganisationAdminLayout',
    )
  }

  return context
}
