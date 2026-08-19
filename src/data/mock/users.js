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
    birthDate: '1985-04-12',
    currentAddress: 'Sangkat Boeung Keng Kang 1, Khan BKK, Phnom Penh',
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
    currentAddress: 'Sangkat Boeung Kak 2, Khan Toul Kork, Phnom Penh',
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
    birthDate: '1992-09-24',
    currentAddress: 'Sangkat Tonle Bassac, Khan Chamkarmon, Phnom Penh',
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
    birthDate: '1995-11-03',
    currentAddress: 'Sangkat Phsar Thmey 1, Khan Daun Penh, Phnom Penh',
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
  'Sophea',
  'Visal',
  'Channary',
  'Rathana',
  'Serey',
  'Vireak',
  'Bopha',
  'Kosal',
  'Monineath',
  'Samnang',
  'Chanthou',
  'Vannak',
  'Kunthea',
  'Sreymom',
  'Makara',
  'Neary',
  'Sokha',
  'Tevy',
  'Vanna',
  'Chantha',
  'Bora',
  'Somaly',
  'Phalla',
  'Sovan',
  'Sinat',
  'Rithy',
  'Chhaya',
  'Marcus',
  'Chloe',
  'Nathan',
  'Sophia',
  'Lucas',
  'Emily',
  'Adrian',
  'Hannah',
  'Julian',
  'Leila',
  'Dominic',
  'Clara',
  'Gabriel',
  'Zara',
  'Sarith',
  'Devin',
  'Kalyan',
  'Narith',
  'Dany',
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
  'Heng',
  'Keo',
  'Lay',
  'Meas',
  'Nhem',
  'Ouk',
  'Phan',
  'Ros',
  'San',
  'Touch',
  'Ung',
  'Vong',
  'Yim',
  'Chea',
  'Chhim',
  'Dy',
  'Hout',
  'Khin',
  'Ly',
  'Mao',
  'Nguon',
  'Pol',
  'Roth',
  'Sam',
  'Tep',
  'Un',
  'Vat',
  'Yok',
  'Kim',
  'Park',
  'Lee',
  'Wong',
  'Tan',
  'Morrison',
  'Seng',
  'Chum',
  'Chhay',
  'Seang',
]

const addresses = [
  'Sangkat Boeung Keng Kang 1, Khan BKK, Phnom Penh',
  'Sangkat Toul Tum Poung 1, Khan Chamkarmon, Phnom Penh',
  'Sangkat Boeung Kak 2, Khan Toul Kork, Phnom Penh',
  'Sangkat Phsar Thmey 1, Khan Daun Penh, Phnom Penh',
  'Sangkat Chroy Changvar, Khan Chroy Changvar, Phnom Penh',
  'Sangkat Teuk Thla, Khan Sen Sok, Phnom Penh',
  'Sangkat Tonle Bassac, Khan Chamkarmon, Phnom Penh',
  'Sangkat Olympic, Khan Boeung Keng Kang, Phnom Penh',
  'Sangkat Nirouth, Khan Chbar Ampov, Phnom Penh',
  'Sangkat Kakab 1, Khan Por Senchey, Phnom Penh',
  'Sangkat Svay Dangkum, Krong Siem Reap',
  'Sangkat Sala Kamreuk, Krong Siem Reap',
  'Sangkat Svay Por, Krong Battambang',
  'Sangkat Preah Sihanouk, Sihanoukville',
  'Sangkat Kampot, Krong Kampot',
]

const positionByRole = {
  ORGANISATION_ADMIN: [
    'IT Manager',
    'Operations Manager',
    'Systems Administrator',
    'Chief Information Officer',
    'VP of Technology',
    'Head of Infrastructure',
    'Director of Corporate IT',
    'Enterprise Solutions Lead',
    'Security & Governance Lead',
  ],
  HELP_DESK: [
    'Support Specialist',
    'Service Desk Analyst',
    'Technical Support Officer',
    'Senior IT Help Desk Engineer',
    'Customer Support Lead',
    'Tier 2 Support Specialist',
    'Incident Response Coordinator',
    'Application Support Analyst',
    'Infrastructure Support Specialist',
  ],
  USER: [
    'Operations Officer',
    'Finance Officer',
    'Customer Service Officer',
    'Project Coordinator',
    'Senior Accountant',
    'HR Generalist',
    'Marketing Specialist',
    'Procurement Executive',
    'Business Analyst',
    'Legal Compliance Associate',
    'Product Associate',
    'Inventory Controller',
    'Communications Officer',
    'Administrative Coordinator',
    'Sales Account Executive',
    'Logistics Supervisor',
    'Data Entry Specialist',
    'Billing Specialist',
    'Quality Assurance Auditor',
    'Brand Strategist',
  ],
}

function createGeneratedUser(idNumber, companyNumber, role, roleIndex) {
  const firstName = firstNames[(idNumber * 7 + roleIndex) % firstNames.length]
  const lastName = lastNames[(idNumber * 13 + companyNumber * 3) % lastNames.length]
  const loginId = `${firstName}.${lastName}.${String(idNumber).padStart(3, '0')}`.toLowerCase()
  const companyId = `organisation-${String(companyNumber).padStart(3, '0')}`
  const month = String(1 + (companyNumber % 12)).padStart(2, '0')
  const day = String(Math.min(28, 3 + ((idNumber * 5) % 25))).padStart(2, '0')
  const birthYear = 1980 + ((idNumber * 3) % 22)
  const birthMonth = String(1 + ((idNumber * 2) % 12)).padStart(2, '0')
  const birthDay = String(1 + ((idNumber * 7) % 28)).padStart(2, '0')
  const positions = positionByRole[role]
  const address = addresses[(idNumber + companyNumber) % addresses.length]
  const identityType = (idNumber + companyNumber) % 5 === 0 ? 'PASSPORT' : 'NATIONAL_ID'

  return {
    id: `user-${String(idNumber).padStart(3, '0')}`,
    name: `${firstName} ${lastName}`,
    firstName,
    lastName,
    loginId,
    email: `${loginId}@demo-company.test`,
    telephone: `+855 ${idNumber % 2 === 0 ? '12' : '15'} ${String(200000 + idNumber * 17).slice(-6).replace(/(\d{3})(\d{3})/, '$1 $2')}`,
    password: 'demo123',
    birthDate: `${birthYear}-${birthMonth}-${birthDay}`,
    currentAddress: address,
    position: positions[roleIndex % positions.length],
    identityType,
    photo: '',
    role,
    organisationId: companyId,
    active: idNumber % 11 !== 0,
    createdAt: `2026-${month}-${day}T08:00:00.000Z`,
    updatedAt: `2026-${month}-${day}T08:00:00.000Z`,
  }
}

function createCompanyUsers() {
  const users = []
  let nextUserId = 5

  for (let companyNumber = 1; companyNumber <= 24; companyNumber += 1) {
    const companyId = `organisation-${String(companyNumber).padStart(3, '0')}`
    const adminCount = companyNumber % 3 === 0 ? 4 : companyNumber % 2 === 0 ? 3 : 2
    const helpDeskCount = companyNumber % 4 === 0 ? 5 : companyNumber % 2 === 0 ? 4 : 3
    const userCount = 12 + ((companyNumber * 3) % 10)
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
