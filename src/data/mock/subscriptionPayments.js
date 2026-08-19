import { mockCompanySubscriptions } from './companySubscriptions.js'
import { mockOrganisations } from './organisations.js'

const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
]

function getSubscriptionAmount(subscription) {
  if (subscription.customPrice !== null) return subscription.customPrice
  if (subscription.plan === 'TEAM') return 5.99
  return 0
}

function getPaymentStatus(sequence) {
  if (sequence % 17 === 0) return 'FAILED'
  if (sequence % 11 === 0) return 'PENDING'
  return 'PAID'
}

function createPayments() {
  const payments = []
  let sequence = 1

  mockCompanySubscriptions
    .filter((subscription) => subscription.plan !== 'FREE')
    .forEach((subscription) => {
      const company = mockOrganisations.find(
        (item) => item.id === subscription.companyId,
      )
      const startMonth = Number(company.createdAt.slice(5, 7))

      for (let month = startMonth; month <= 8; month += 1) {
        const referenceNumber = String(sequence).padStart(6, '0')
        const companyNumber = Number(company.id.slice(-3))

        payments.push({
          id: `payment-${String(sequence).padStart(3, '0')}`,
          transactionId: `TXN-2026-${referenceNumber}`,
          paymentReference: `PAY-2026-${referenceNumber}`,
          companyId: company.id,
          subscriptionId: subscription.id,
          negotiationId: subscription.negotiationId,
          paymentDate: `2026-${String(month).padStart(2, '0')}-25T09:00:00.000Z`,
          amount: getSubscriptionAmount(subscription),
          currency: 'USD',
          billingPeriod: `${monthNames[month - 1]} 2026`,
          status: getPaymentStatus(sequence),
          paymentMethod: 'CARD',
          cardBrand: sequence % 2 === 0 ? 'Mastercard' : 'Visa',
          cardLast4: String(4000 + companyNumber).padStart(4, '0'),
          cardholderName: `${company.name} Billing`,
        })

        sequence += 1
      }
    })

  return payments
}

export const mockSubscriptionPayments = createPayments()
