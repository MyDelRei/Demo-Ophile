import { Outlet } from 'react-router-dom'

import SupportNavbar from '@/components/support/SupportNavbar'

function SupportLayout() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 text-foreground">
      <div className="support-ambient-background" aria-hidden="true">
        <div className="support-ambient-blob support-ambient-blob-one" />
        <div className="support-ambient-blob support-ambient-blob-two" />
        <div className="support-ambient-blob support-ambient-blob-three" />
      </div>

      <div className="relative z-10 min-h-screen">
        <SupportNavbar />
        <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default SupportLayout
