import { useEffect, useState } from 'react'
import { EyeIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { getNegotiations } from '@/api/negotiationApi'
import { getOrganisations } from '@/api/organisationApi'
import IconActionButton from '@/components/common/IconActionButton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

function formatDate(value) {
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(
    new Date(value),
  )
}

function formatPeriod(value, unit) {
  const singular = Number(value) === 1
  const label =
    unit === 'YEARS' ? (singular ? 'Year' : 'Years') : singular ? 'Month' : 'Months'
  return `${value} ${label}`
}

function formatNegotiatedPrice(amount, frequency) {
  const suffixes = {
    MONTHLY: '/month',
    QUARTERLY: '/quarter',
    YEARLY: '/year',
    ONE_TIME: ' one-time',
  }
  return `$${Number(amount).toFixed(2)}${suffixes[frequency]}`
}

function NegotiationsPage() {
  const [rows, setRows] = useState(undefined)
  const navigate = useNavigate()

  useEffect(() => {
    let isActive = true

    async function loadNegotiations() {
      const [negotiations, companies] = await Promise.all([
        getNegotiations(),
        getOrganisations(),
      ])

      if (isActive) {
        setRows(
          negotiations.map((negotiation) => ({
            negotiation,
            company: companies.find(
              (item) => item.id === negotiation.companyId,
            ),
          })),
        )
      }
    }

    loadNegotiations()
    return () => {
      isActive = false
    }
  }, [])

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">
            Negotiations &amp; Contracts
          </h1>
          <p className="text-muted-foreground">
            Manage demo TEAM and Enterprise subscription negotiations.
          </p>
        </div>
        <Button
          onClick={() => navigate('/admin/subscriptions/negotiations/new')}
        >
          Create Negotiation
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Negotiation Reference</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Negotiated Price</TableHead>
              <TableHead>Contract Period</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created Date</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!rows ? (
              <TableRow>
                <TableCell colSpan={8}>Loading negotiations...</TableCell>
              </TableRow>
            ) : (
              rows.map(({ negotiation, company }) => (
                <TableRow key={negotiation.id}>
                  <TableCell className="font-medium">
                    {negotiation.reference}
                  </TableCell>
                  <TableCell>{company?.name ?? 'Unknown Company'}</TableCell>
                  <TableCell>
                    <Badge>{negotiation.plan}</Badge>
                  </TableCell>
                  <TableCell>
                    {formatNegotiatedPrice(
                      negotiation.negotiatedAmount,
                      negotiation.billingFrequency,
                    )}
                  </TableCell>
                  <TableCell>
                    {formatPeriod(
                      negotiation.periodValue,
                      negotiation.periodUnit,
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        negotiation.status === 'ACTIVE'
                          ? 'default'
                          : 'secondary'
                      }
                    >
                      {negotiation.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(negotiation.createdAt)}</TableCell>
                  <TableCell>
                    <IconActionButton
                      icon={EyeIcon}
                      variant="outline"
                      title={`View ${negotiation.reference}`}
                      onClick={() =>
                        navigate(
                          `/admin/subscriptions/negotiations/${negotiation.id}`,
                        )
                      }
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  )
}

export default NegotiationsPage
