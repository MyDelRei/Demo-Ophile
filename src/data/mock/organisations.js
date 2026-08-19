import { mockUsers } from './users.js'

const companySeeds = [
  ['Demo Enterprise Company', 'DEMOENTERPRISE', 'ACTIVE'],
  ['Demo Free Company', 'DEMOFREE', 'ACTIVE'],
  ['Demo Team Company', 'DEMOTEAM', 'SUSPENDED'],
  ['Demo Negotiated Team Company', 'DEMONEGTEAM', 'ACTIVE'],
  ['Mekong Logistics', 'MEKONGLOG', 'ACTIVE'],
  ['Angkor Digital Solutions', 'ANGKORDIGI', 'ACTIVE'],
  ['Tonle Retail Group', 'TONLERETAIL', 'SUSPENDED'],
  ['Lotus Health Network', 'LOTUSHEALTH', 'ACTIVE'],
  ['Royal Education Services', 'ROYALEDU', 'ACTIVE'],
  ['Kirirom Technology', 'KIRIROMTECH', 'ACTIVE'],
  ['Sorya Manufacturing', 'SORYAMFG', 'SUSPENDED'],
  ['Cambo AgriTrade', 'CAMBOAGRI', 'ACTIVE'],
  ['Golden Bay Hospitality', 'GOLDENBAY', 'ACTIVE'],
  ['Blue River Consulting', 'BLUERIVER', 'ACTIVE'],
  ['Heritage Property Management', 'HERITAGEPM', 'ACTIVE'],
  ['NextGen Fintech', 'NEXTGENFT', 'ACTIVE'],
  ['Emerald Construction', 'EMERALDCON', 'SUSPENDED'],
  ['Sunrise Food Distribution', 'SUNRISEFOOD', 'ACTIVE'],
  ['Apex Security Services', 'APEXSEC', 'ACTIVE'],
  ['Phnom Penh Creative Studio', 'PPCREATIVE', 'ACTIVE'],
  ['Indochina Travel Partners', 'INDOTRAVEL', 'ACTIVE'],
  ['Smart Office Supplies', 'SMARTOFFICE', 'SUSPENDED'],
  ['Harmony Insurance Brokers', 'HARMONYINS', 'ACTIVE'],
  ['Green Horizon Energy', 'GREENENERGY', 'ACTIVE'],
]

function getCompanyUserCounts(companyId) {
  const users = mockUsers.filter((user) => user.organisationId === companyId)
  return {
    totalUsers: users.length,
    activeUsers: users.filter((user) => user.active).length,
    inactiveUsers: users.filter((user) => !user.active).length,
  }
}

export const mockOrganisations = companySeeds.map(
  ([name, code, status], index) => {
    const companyNumber = index + 1
    const id = `organisation-${String(companyNumber).padStart(3, '0')}`
    const month = String(Math.ceil(companyNumber / 3)).padStart(2, '0')
    const day = String(4 + (companyNumber % 3) * 7).padStart(2, '0')
    const emailName = code.toLowerCase()

    return {
      id,
      name,
      legalName: `${name} Co., Ltd.`,
      code,
      email: `contact@${emailName}.test`,
      phone: `+855 23 555 ${String(1000 + companyNumber).slice(-4)}`,
      address: `${20 + companyNumber * 3} Business Avenue, Phnom Penh`,
      status,
      createdAt: `2026-${month}-${day}T08:30:00.000Z`,
      ...getCompanyUserCounts(id),
    }
  },
)
