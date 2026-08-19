import { mockNegotiations } from '../data/mock/negotiations.js'

let negotiations = mockNegotiations.map(copyNegotiation)
let nextNegotiationId = negotiations.length + 1
const transitionDelay = 700

function copyNegotiation(negotiation) {
  return negotiation
    ? {
        ...negotiation,
        features: { ...negotiation.features },
      }
    : null
}

export async function getNegotiations() {
  return negotiations.map(copyNegotiation)
}

export async function getNegotiationById(id) {
  return copyNegotiation(
    negotiations.find((negotiation) => negotiation.id === id),
  )
}

export async function createNegotiation(data) {
  const sequence = String(nextNegotiationId).padStart(4, '0')
  const negotiation = {
    id: `negotiation-${String(nextNegotiationId).padStart(3, '0')}`,
    reference: `NEG-2026-${sequence}`,
    companyId: data.companyId,
    plan: data.plan,
    startDate: data.startDate,
    periodValue: Number(data.periodValue),
    periodUnit: data.periodUnit,
    negotiatedAmount: Number(data.negotiatedAmount),
    billingFrequency: data.billingFrequency,
    features: { ...data.features },
    hostingDeployment:
      data.plan === 'ENTERPRISE' ? data.hostingDeployment : null,
    status: 'DRAFT',
    createdAt: new Date().toISOString(),
  }

  nextNegotiationId += 1
  negotiations = [...negotiations, negotiation]
  return copyNegotiation(negotiation)
}

function waitForTransition() {
  return new Promise((resolve) => setTimeout(resolve, transitionDelay))
}

async function transitionNegotiation(id, expectedStatus, nextStatus) {
  await waitForTransition()

  const index = negotiations.findIndex((negotiation) => negotiation.id === id)
  if (index === -1) {
    throw new Error('Negotiation not found.')
  }

  const negotiation = negotiations[index]
  if (negotiation.status !== expectedStatus) {
    throw new Error(
      `Negotiation cannot change from ${negotiation.status} to ${nextStatus}.`,
    )
  }

  const updatedNegotiation = { ...negotiation, status: nextStatus }
  negotiations = negotiations.map((item, itemIndex) =>
    itemIndex === index ? updatedNegotiation : item,
  )

  return copyNegotiation(updatedNegotiation)
}

export async function sendPaymentRequest(negotiationId) {
  return transitionNegotiation(negotiationId, 'DRAFT', 'PROCESSING')
}
