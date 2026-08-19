import { getOrganisations } from './organisationApi.js'
import { getSubscriptionPayments } from './paymentApi.js'
import { getCompanySubscriptions } from './subscriptionApi.js'
import { getTickets } from './ticketApi.js'
import { getUsers } from './userApi.js'

const reportDelay = 350

function waitForReport() {
  return new Promise((resolve) => setTimeout(resolve, reportDelay))
}

function isPaidPayment(payment) {
  return String(payment.status).toUpperCase() === 'PAID'
}

function roundCurrency(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100
}

function isValidPayment(payment) {
  return Boolean(
    payment.id &&
      payment.paymentReference &&
      payment.companyId &&
      payment.subscriptionId &&
      payment.paymentDate &&
      Number.isFinite(Number(payment.amount)),
  )
}

function isWithinDateRange(value, filters) {
  const date = String(value ?? '').slice(0, 10)
  if (!date) return false
  if (filters.fromDate && date < filters.fromDate) return false
  if (filters.toDate && date > filters.toDate) return false
  return true
}

function matchesSearch(values, searchValue) {
  const search = String(searchValue ?? '').trim().toLowerCase()
  if (!search) return true

  return values.some((value) => String(value ?? '').toLowerCase().includes(search))
}

function sortByName(records, direction, getName) {
  const multiplier = direction === 'DESC' ? -1 : 1
  return [...records].sort(
    (first, second) =>
      getName(first).localeCompare(getName(second), undefined, {
        sensitivity: 'base',
      }) * multiplier,
  )
}

function getLocalDateStamp(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export async function getSuperAdminOverview() {
  const [companies, users, tickets, payments] = await Promise.all([
    getOrganisations(),
    getUsers(),
    getTickets(),
    getSubscriptionPayments(),
  ])
  const today = getLocalDateStamp()

  return {
    activeCompanies: companies.filter((company) => company.status === 'ACTIVE')
      .length,
    inactiveCompanies: companies.filter(
      (company) => company.status !== 'ACTIVE',
    ).length,
    activeUsers: users.filter((user) => user.organisationId && user.active)
      .length,
    inactiveUsers: users.filter((user) => user.organisationId && !user.active)
      .length,
    totalAdmins: users.filter(
      (user) => user.role === 'ORGANISATION_ADMIN',
    ).length,
    ticketsToday: tickets.filter(
      (ticket) => String(ticket.createdAt).slice(0, 10) === today,
    ).length,
    totalRevenue: roundCurrency(
      payments
        .filter(
          (payment) =>
            isValidPayment(payment) && isPaidPayment(payment),
        )
        .reduce((total, payment) => total + Number(payment.amount), 0),
    ),
  }
}

async function getPaymentReportData(filters, searchPaymentReference = true) {
  const [payments, companies, subscriptions] = await Promise.all([
    getSubscriptionPayments(),
    getOrganisations(),
    getCompanySubscriptions(),
  ])

  const records = payments
    .filter(
      (payment) =>
        isValidPayment(payment) &&
        isWithinDateRange(payment.paymentDate, filters),
    )
    .map((payment) => {
      const company = companies.find((item) => item.id === payment.companyId)
      const subscription = subscriptions.find(
        (item) => item.id === payment.subscriptionId,
      )

      if (!company || !subscription) return null

      return {
        id: payment.id,
        paymentReference: payment.paymentReference,
        companyName: company.name,
        plan: subscription.plan,
        amount: Number(payment.amount),
        currency: payment.currency,
        paymentDate: payment.paymentDate,
        paymentMethod: payment.paymentMethod,
        status: payment.status,
      }
    })
    .filter(Boolean)
    .filter((record) =>
      matchesSearch(
        searchPaymentReference
          ? [record.companyName, record.paymentReference]
          : [record.companyName],
        filters.search,
      ),
    )

  return sortByName(
    records,
    filters.sortDirection,
    (record) => record.companyName,
  )
}

export async function getPaymentReport(filters = {}) {
  const [records] = await Promise.all([
    getPaymentReportData(filters),
    waitForReport(),
  ])
  return {
    records,
    paymentSummary: {
      paid: records.filter((record) => record.status === 'PAID').length,
      pending: records.filter((record) => record.status === 'PENDING').length,
      failed: records.filter((record) => record.status === 'FAILED').length,
    },
  }
}

export async function getRevenueReport(filters = {}) {
  const [paymentRecords] = await Promise.all([
    getPaymentReportData(filters, false),
    waitForReport(),
  ])
  const revenueByCompany = new Map()

  paymentRecords
    .filter(isPaidPayment)
    .forEach((payment) => {
      const key = `${payment.companyName}:${payment.plan}`
      const current = revenueByCompany.get(key) ?? {
        id: key,
        companyName: payment.companyName,
        plan: payment.plan,
        paymentCount: 0,
        totalRevenue: 0,
      }

      current.paymentCount += 1
      current.totalRevenue += payment.amount
      revenueByCompany.set(key, current)
    })

  const records = sortByName(
    [...revenueByCompany.values()],
    filters.sortDirection,
    (record) => record.companyName,
  ).map((record) => ({
    ...record,
    totalRevenue: roundCurrency(record.totalRevenue),
  }))

  return {
    records,
    totalRevenue: roundCurrency(
      records.reduce(
        (total, record) => total + record.totalRevenue,
        0,
      ),
    ),
  }
}

export async function getCompanyReport(filters = {}) {
  const [companies, subscriptions] = await Promise.all([
    getOrganisations(),
    getCompanySubscriptions(),
    waitForReport(),
  ])
  const records = companies
    .filter((company) => isWithinDateRange(company.createdAt, filters))
    .map((company) => ({
      id: company.id,
      companyName: company.name,
      companyCode: company.code,
      subscriptionPlan:
        subscriptions.find((item) => item.companyId === company.id)?.plan ?? '—',
      status: company.status,
      createdAt: company.createdAt,
    }))
    .filter((record) =>
      matchesSearch(
        [record.companyName, record.companyCode],
        filters.search,
      ),
    )

  return {
    records: sortByName(
      records,
      filters.sortDirection,
      (record) => record.companyName,
    ),
  }
}

export async function getAdminUserReport(filters = {}) {
  const [users, companies] = await Promise.all([
    getUsers(),
    getOrganisations(),
    waitForReport(),
  ])
  const records = users
    .filter(
      (user) =>
        user.role === 'ORGANISATION_ADMIN' &&
        isWithinDateRange(user.createdAt, filters),
    )
    .map((user) => ({
      id: user.id,
      name: user.name,
      loginId: user.loginId,
      email: user.email,
      companyName:
        companies.find((company) => company.id === user.organisationId)?.name ??
        'Unknown Company',
      position: user.position || '—',
      status: user.active ? 'ACTIVE' : 'INACTIVE',
      createdAt: user.createdAt,
    }))
    .filter((record) =>
      matchesSearch(
        [
          record.name,
          record.loginId,
          record.email,
          record.companyName,
        ],
        filters.search,
      ),
    )

  return {
    records: sortByName(records, filters.sortDirection, (record) => record.name),
  }
}

export async function getReport(reportType, filters = {}) {
  if (reportType === 'REVENUE') return getRevenueReport(filters)
  if (reportType === 'COMPANY') return getCompanyReport(filters)
  if (reportType === 'USERS') return getAdminUserReport(filters)
  return getPaymentReport(filters)
}
