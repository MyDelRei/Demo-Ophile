import { FileChartColumnIcon } from 'lucide-react'

import GlassPanel from '@/components/glass/GlassPanel'
import SupportPageShell from '@/components/support/SupportPageShell'

function SupportReportsPage() {
  return (
    <SupportPageShell
      title="Reports"
      description="Your approved Support Portal reporting access will be available here."
    >
      <GlassPanel className="py-12 text-center">
        <FileChartColumnIcon className="mx-auto size-10 text-muted-foreground" />
        <h2 className="mt-4 font-semibold">Support reports are not available yet</h2>
        <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
          Report functionality is outside this step. Access to this route is already protected by the View Reports permission.
        </p>
      </GlassPanel>
    </SupportPageShell>
  )
}

export default SupportReportsPage
