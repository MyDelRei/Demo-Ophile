const baseUsers = [
  {
    id: 'user-001',
    name: 'Sophie Martin',
    firstName: 'Sophie',
    lastName: 'Martin',
    loginId: 'superadmin',
    email: 'superadmin@ophile.test',
    telephone: '+855 12 100 001',
    password: 'superadmin123',
    birthDate: '',
    currentAddress: '',
    position: 'Platform Administrator',
    identityType: 'PASSPORT',
    photo: '',
    role: 'SUPER_ADMIN',
    active: true,
    createdAt: '2025-10-01T08:00:00.000Z',
    updatedAt: '2025-10-01T08:00:00.000Z',
  },
  {
    id: 'user-002',
    name: 'Daniel Kim',
    firstName: 'Daniel',
    lastName: 'Kim',
    loginId: 'orgadmin',
    email: 'admin@ophile.test',
    telephone: '+855 12 100 002',
    password: 'admin123',
    birthDate: '1988-06-15',
    currentAddress: 'Phnom Penh',
    position: 'IT Manager',
    identityType: 'NATIONAL_ID',
    photo: 'daniel-kim.jpg',
    role: 'ORGANISATION_ADMIN',
    organisationId: 'organisation-001',
    active: true,
    createdAt: '2026-01-06T08:00:00.000Z',
    updatedAt: '2026-01-06T08:00:00.000Z',
  },
  {
    id: 'user-003',
    name: 'Maya Patel',
    firstName: 'Maya',
    lastName: 'Patel',
    loginId: 'helpdesk',
    email: 'helpdesk@ophile.test',
    telephone: '+855 12 100 003',
    password: 'helpdesk123',
    birthDate: '',
    currentAddress: 'Phnom Penh',
    position: 'Support Specialist',
    identityType: 'NATIONAL_ID',
    photo: '',
    role: 'HELP_DESK',
    organisationId: 'organisation-001',
    active: true,
    createdAt: '2026-01-07T08:00:00.000Z',
    updatedAt: '2026-01-07T08:00:00.000Z',
  },
  {
    id: 'user-004',
    name: 'Alex Johnson',
    firstName: 'Alex',
    lastName: 'Johnson',
    loginId: 'user',
    email: 'user@ophile.test',
    telephone: '+855 12 100 004',
    password: 'user123',
    birthDate: '',
    currentAddress: 'Phnom Penh',
    position: 'Operations Officer',
    identityType: 'NATIONAL_ID',
    photo: '',
    role: 'USER',
    organisationId: 'organisation-001',
    active: true,
    createdAt: '2026-01-08T08:00:00.000Z',
    updatedAt: '2026-01-08T08:00:00.000Z',
  },
]

const firstNames = [
  'Amara',
  'Benjamin',
  'Chenda',
  'Dara',
  'Elena',
  'Felix',
  'Grace',
  'Heng',
  'Isabella',
  'Jonas',
  'Kanya',
  'Liam',
  'Malis',
  'Noah',
  'Olivia',
  'Piseth',
  'Quinn',
  'Rina',
  'Samuel',
  'Thida',
  'Uma',
  'Victor',
  'Wendy',
  'Xavier',
  'Yuna',
  'Zane',
]

const lastNames = [
  'Anderson',
  'Bennett',
  'Chan',
  'Davis',
  'Evans',
  'Foster',
  'Garcia',
  'Harris',
  'Ibrahim',
  'Jensen',
  'Kong',
  'Lim',
  'Miller',
  'Nguyen',
  'Ortiz',
  'Pich',
  'Reed',
  'Sok',
  'Taylor',
  'Vann',
]

const positionByRole = {
  ORGANISATION_ADMIN: [
    'IT Manager',
    'Operations Manager',
    'Systems Administrator',
  ],
  HELP_DESK: [
    'Support Specialist',
    'Service Desk Analyst',
    'Technical Support Officer',
  ],
  USER: [
    'Operations Officer',
    'Finance Officer',
    'Customer Service Officer',
    'Project Coordinator',
  ],
}

function createGeneratedUser(idNumber, companyNumber, role, roleIndex) {
  const firstName = firstNames[(idNumber - 5) % firstNames.length]
  const lastName = lastNames[(idNumber * 3 + companyNumber) % lastNames.length]
  const loginId = `${firstName}.${lastName}.${String(idNumber).padStart(3, '0')}`.toLowerCase()
  const companyId = `organisation-${String(companyNumber).padStart(3, '0')}`
  const month = String(Math.ceil(companyNumber / 3)).padStart(2, '0')
  const day = String(Math.min(27, 8 + roleIndex * 3)).padStart(2, '0')
  const positions = positionByRole[role]

  return {
    id: `user-${String(idNumber).padStart(3, '0')}`,
    name: `${firstName} ${lastName}`,
    firstName,
    lastName,
    loginId,
    email: `${loginId}@demo-company.test`,
    telephone: `+855 12 ${String(200000 + idNumber).slice(-6)}`,
    password: 'demo123',
    birthDate: '',
    currentAddress: 'Phnom Penh, Cambodia',
    position: positions[roleIndex % positions.length],
    identityType: 'NATIONAL_ID',
    photo: '',
    role,
    organisationId: companyId,
    active: idNumber % 8 !== 0,
    createdAt: `2026-${month}-${day}T08:00:00.000Z`,
    updatedAt: `2026-${month}-${day}T08:00:00.000Z`,
  }
}

function createCompanyUsers() {
  const users = []
  let nextUserId = 5

  for (let companyNumber = 1; companyNumber <= 24; companyNumber += 1) {
    const companyId = `organisation-${String(companyNumber).padStart(3, '0')}`
    const adminCount = companyNumber % 6 === 0 ? 3 : companyNumber % 2 === 0 ? 2 : 1
    const helpDeskCount = companyNumber % 4 === 0 ? 2 : 1
    const userCount = 6 - adminCount - helpDeskCount
    const existingRoleCounts = Object.fromEntries(
      ['ORGANISATION_ADMIN', 'HELP_DESK', 'USER'].map((role) => [
        role,
        baseUsers.filter(
          (user) => user.organisationId === companyId && user.role === role,
        ).length,
      ]),
    )
    const targets = {
      ORGANISATION_ADMIN: adminCount,
      HELP_DESK: helpDeskCount,
      USER: userCount,
    }

    Object.entries(targets).forEach(([role, targetCount]) => {
      const missingCount = targetCount - existingRoleCounts[role]

      for (let roleIndex = 0; roleIndex < missingCount; roleIndex += 1) {
        users.push(
          createGeneratedUser(
            nextUserId,
            companyNumber,
            role,
            roleIndex,
          ),
        )
        nextUserId += 1
      }
    })
  }

  return users
}

export const mockUsers = [...baseUsers, ...createCompanyUsers()]
