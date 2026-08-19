const categoryNames = [
  'Hardware',
  'Software',
  'Network',
  'Account Access',
  'Printer',
  'Other',
]

export const mockTicketCategories = Array.from(
  { length: 24 },
  (_, companyIndex) => {
    const organisationId = `organisation-${String(companyIndex + 1).padStart(3, '0')}`

    return categoryNames.map((name, categoryIndex) => {
      const sequence = companyIndex * categoryNames.length + categoryIndex + 1
      const system = name === 'Other'

      return {
        id: `ticket-category-${String(sequence).padStart(4, '0')}`,
        organisationId,
        name,
        status: 'ACTIVE',
        systemType: system ? 'OTHER' : undefined,
        createdAt: '2026-08-15T08:00:00.000Z',
        updatedAt: '2026-08-15T08:00:00.000Z',
      }
    })
  },
).flat()
