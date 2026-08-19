import { useEffect, useMemo, useState } from 'react'

import { getReport } from '@/api/reportApi'
import DateRangePicker from '@/components/common/DateRangePicker'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAppFeedback } from '@/hooks/useAppFeedback'

const reportTypes = [
  { value: 'PAYMENT', label: 'Payment' },
  { value: 'REVENUE', label: 'Revenue' },
  { value: 'COMPANY', label: 'Company' },
  { value: 'USERS', label: 'Users — Admin Only' },
]

const sortOptions = [
  { value: 'ASC', label: 'A → Z' },
  { value: 'DESC', label: 'Z → A' },
]

const pageSizes = [10, 25, 50, 100]
const searchPlaceholders = {
  PAYMENT: 'Search Company Name or Payment Reference',
  REVENUE: 'Search Company Name',
  COMPANY: 'Search Company Name or Company Code',
  USERS: 'Search Name, Login ID, Email, or Company',
}
const emptyReportResult = {
  reportType: null,
  records: [],
  totalRevenue: 0,
  paymentSummary: { paid: 0, pending: 0, failed: 0 },
}
const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

function formatDate(value) {
  const date = new Date(value)

  if (!value || Number.isNaN(date.getTime())) return '—'

  return new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(date)
}

function formatPaymentMethod(value) {
  return value === 'CARD' ? 'Card' : value
}

function EmptyRow({ columnCount }) {
  return (
    <TableRow>
      <TableCell
        colSpan={columnCount}
        className="text-center text-muted-foreground"
      >
        No records found.
      </TableCell>
    </TableRow>
  )
}

function PaymentTable({ records }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Payment Reference</TableHead>
          <TableHead>Company</TableHead>
          <TableHead>Plan</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Payment Date</TableHead>
          <TableHead>Payment Method</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {records.length === 0 ? (
          <EmptyRow columnCount={7} />
        ) : (
          records.map((record) => (
            <TableRow key={record.id}>
              <TableCell className="font-medium">
                {record.paymentReference}
              </TableCell>
              <TableCell>{record.companyName}</TableCell>
              <TableCell>
                <Badge variant="outline">{record.plan}</Badge>
              </TableCell>
              <TableCell>{currencyFormatter.format(record.amount)}</TableCell>
              <TableCell>{formatDate(record.paymentDate)}</TableCell>
              <TableCell>{formatPaymentMethod(record.paymentMethod)}</TableCell>
              <TableCell>
                <Badge
                  variant={record.status === 'PAID' ? 'default' : 'secondary'}
                >
                  {record.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}

function RevenueTable({ records }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Company</TableHead>
          <TableHead>Plan</TableHead>
          <TableHead>Payment Count</TableHead>
          <TableHead>Total Revenue</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {records.length === 0 ? (
          <EmptyRow columnCount={4} />
        ) : (
          records.map((record) => (
            <TableRow key={record.id}>
              <TableCell className="font-medium">
                {record.companyName}
              </TableCell>
              <TableCell>
                <Badge variant="outline">{record.plan}</Badge>
              </TableCell>
              <TableCell>{record.paymentCount}</TableCell>
              <TableCell>
                {currencyFormatter.format(record.totalRevenue)}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}

function CompanyTable({ records }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Company Name</TableHead>
          <TableHead>Company Code</TableHead>
          <TableHead>Subscription Plan</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Created Date</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {records.length === 0 ? (
          <EmptyRow columnCount={5} />
        ) : (
          records.map((record) => (
            <TableRow key={record.id}>
              <TableCell className="font-medium">
                {record.companyName}
              </TableCell>
              <TableCell>{record.companyCode}</TableCell>
              <TableCell>
                <Badge variant="outline">{record.subscriptionPlan}</Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant={record.status === 'ACTIVE' ? 'default' : 'secondary'}
                >
                  {record.status}
                </Badge>
              </TableCell>
              <TableCell>{formatDate(record.createdAt)}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}

function AdminUsersTable({ records }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Login ID</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Company</TableHead>
          <TableHead>Position</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Created Date</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {records.length === 0 ? (
          <EmptyRow columnCount={7} />
        ) : (
          records.map((record) => (
            <TableRow key={record.id}>
              <TableCell className="font-medium">{record.name}</TableCell>
              <TableCell>{record.loginId}</TableCell>
              <TableCell>{record.email}</TableCell>
              <TableCell>{record.companyName}</TableCell>
              <TableCell>{record.position}</TableCell>
              <TableCell>
                <Badge
                  variant={record.status === 'ACTIVE' ? 'default' : 'secondary'}
                >
                  {record.status}
                </Badge>
              </TableCell>
              <TableCell>{formatDate(record.createdAt)}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}

function ReportResultsTable({ reportType, records }) {
  if (reportType === 'REVENUE') return <RevenueTable records={records} />
  if (reportType === 'COMPANY') return <CompanyTable records={records} />
  if (reportType === 'USERS') return <AdminUsersTable records={records} />
  return <PaymentTable records={records} />
}

function ReportsPage() {
  const [filters, setFilters] = useState({
    reportType: 'PAYMENT',
    sortDirection: 'ASC',
    fromDate: '',
    toDate: '',
    search: '',
  })
  const [searchValue, setSearchValue] = useState('')
  const [result, setResult] = useState({
    ...emptyReportResult,
    reportType: 'PAYMENT',
  })
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const { hideLoading, showLoading, showNotification } = useAppFeedback()

  useEffect(() => {
    const searchTimer = window.setTimeout(() => {
      setFilters((current) =>
        current.search === searchValue
          ? current
          : { ...current, search: searchValue },
      )
    }, 300)

    return () => window.clearTimeout(searchTimer)
  }, [searchValue])

  useEffect(() => {
    let isActive = true

    setPage(1)
    showLoading('Loading report...')

    getReport(filters.reportType, filters)
      .then((report) => {
        if (isActive) {
          setResult({ ...report, reportType: filters.reportType })
        }
      })
      .catch((error) => {
        if (isActive) {
          setResult({ ...emptyReportResult, reportType: filters.reportType })
          showNotification(error.message || 'Unable to load report.', 'error')
        }
      })
      .finally(() => {
        if (isActive) hideLoading()
      })

    return () => {
      isActive = false
      hideLoading()
    }
  }, [filters, hideLoading, showLoading, showNotification])

  const displayedResult =
    result.reportType === filters.reportType ? result : emptyReportResult
  const totalRecords = displayedResult.records.length
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize))
  const showingStart = totalRecords === 0 ? 0 : (page - 1) * pageSize + 1
  const showingEnd = Math.min(page * pageSize, totalRecords)
  const pageRecords = useMemo(() => {
    const start = (page - 1) * pageSize
    return displayedResult.records.slice(start, start + pageSize)
  }, [displayedResult.records, page, pageSize])

  function updateFilter(key, value) {
    setFilters((current) => ({ ...current, [key]: value }))
  }

  function selectReportType(reportType) {
    setSearchValue('')
    setPage(1)
    setFilters({
      reportType,
      sortDirection: 'ASC',
      fromDate: '',
      toDate: '',
      search: '',
    })
  }

  function resetFilters() {
    selectReportType(filters.reportType)
  }

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Reports</h1>
        <p className="text-muted-foreground">
          Review platform payment, revenue, Company, and admin-user records.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="report-type">Report Type</Label>
            <Select
              value={filters.reportType}
              onValueChange={selectReportType}
            >
              <SelectTrigger id="report-type" className="w-full">
                <SelectValue>
                  {reportTypes.find((item) => item.value === filters.reportType)
                    ?.label}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {reportTypes.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="report-sort">Sort by Name</Label>
            <Select
              value={filters.sortDirection}
              onValueChange={(value) => updateFilter('sortDirection', value)}
            >
              <SelectTrigger id="report-sort" className="w-full">
                <SelectValue>
                  {sortOptions.find(
                    (item) => item.value === filters.sortDirection,
                  )?.label}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="report-date-range">Date Range</Label>
            <DateRangePicker
              id="report-date-range"
              value={{ from: filters.fromDate, to: filters.toDate }}
              onChange={(range) =>
                setFilters((current) => ({
                  ...current,
                  fromDate: range.from,
                  toDate: range.to,
                }))
              }
              placeholder="Select date range"
            />
          </div>

          <div className="space-y-2 sm:col-span-2 lg:col-span-1">
            <Label htmlFor="report-search">Search</Label>
            <Input
              id="report-search"
              type="search"
              placeholder={searchPlaceholders[filters.reportType]}
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:col-span-2 lg:col-span-4">
            <span className="mr-1 text-sm font-medium">Demo Reports</span>
            {reportTypes.map((reportType) => (
              <Button
                key={reportType.value}
                type="button"
                size="sm"
                variant={
                  filters.reportType === reportType.value
                    ? 'default'
                    : 'outline'
                }
                onClick={() => selectReportType(reportType.value)}
              >
                {reportType.label}
              </Button>
            ))}
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={resetFilters}
            >
              Reset Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {reportTypes.find((item) => item.value === filters.reportType)
              ?.label}{' '}
            Report
          </CardTitle>
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
            <span>
              Showing {showingStart}–{showingEnd} of {totalRecords} records
            </span>
            {filters.reportType === 'PAYMENT' && (
              <>
                <span>Paid: {displayedResult.paymentSummary?.paid ?? 0}</span>
                <span>
                  Pending: {displayedResult.paymentSummary?.pending ?? 0}
                </span>
                <span>Failed: {displayedResult.paymentSummary?.failed ?? 0}</span>
              </>
            )}
            {filters.reportType === 'REVENUE' && (
              <span>
                Filtered Revenue:{' '}
                <span className="font-medium text-foreground">
                  {currencyFormatter.format(displayedResult.totalRevenue ?? 0)}
                </span>
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto rounded-lg border">
            <ReportResultsTable
              reportType={filters.reportType}
              records={pageRecords}
            />
          </div>

          <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
              <span>
                Page {page} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <Label htmlFor="report-page-size">Page Size</Label>
                <Select
                  value={String(pageSize)}
                  onValueChange={(value) => {
                    setPageSize(Number(value))
                    setPage(1)
                  }}
                >
                  <SelectTrigger id="report-page-size" className="w-20">
                    <SelectValue>{pageSize}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {pageSizes.map((size) => (
                      <SelectItem key={size} value={String(size)}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage((current) => current - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                disabled={page === totalPages || totalRecords === 0}
                onClick={() => setPage((current) => current + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}

export default ReportsPage
