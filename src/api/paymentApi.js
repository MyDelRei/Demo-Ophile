import { mockSubscriptionPayments } from '../data/mock/subscriptionPayments.js'

function copyPayment(payment) {
  return { ...payment }
}

export async function getSubscriptionPayments() {
  return mockSubscriptionPayments.map(copyPayment)
}

export async function getSubscriptionPaymentsByCompanyId(companyId) {
  return mockSubscriptionPayments
    .filter((payment) => payment.companyId === companyId)
    .map(copyPayment)
}

export async function getPaymentTransaction(companyId, transactionId) {
  const payment = mockSubscriptionPayments.find(
    (item) =>
      item.companyId === companyId && item.transactionId === transactionId,
  )

  return payment ? copyPayment(payment) : null
}

export async function getSubscriptionPaymentsByNegotiationId(negotiationId) {
  return mockSubscriptionPayments
    .filter((payment) => payment.negotiationId === negotiationId)
    .map(copyPayment)
}
