import { useEffect, useState } from 'react'
import { CheckIcon } from 'lucide-react'

import GlassPanel from '@/components/glass/GlassPanel'
import GlassSection from '@/components/glass/GlassSection'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAppFeedback } from '@/hooks/useAppFeedback'
import { useOrganisationAppearance } from '@/hooks/useOrganisationAppearance'
import { cn } from '@/lib/utils'
import { organisationBackgrounds } from '@/lib/organisationBackgrounds'

function CompanySettingsPage() {
  const { appearance, updateOrganisationBackground } =
    useOrganisationAppearance()
  const { hideLoading, showLoading, showNotification } = useAppFeedback()
  const [selectedBackgroundId, setSelectedBackgroundId] = useState(
    appearance.backgroundId,
  )

  useEffect(() => {
    setSelectedBackgroundId(appearance.backgroundId)
  }, [appearance.backgroundId])

  async function handleSaveBackground(event) {
    event.preventDefault()
    showLoading('Updating Organisation background...')

    try {
      await updateOrganisationBackground(selectedBackgroundId)
      showNotification('Organisation background updated successfully.')
    } catch (error) {
      showNotification(
        error.message || 'Unable to update Organisation background.',
        'error',
      )
    } finally {
      hideLoading()
    }
  }

  return (
    <GlassSection>
      <p className="max-w-2xl text-sm text-muted-foreground">
        Personalise the Organisation Admin workspace while keeping the same
        readable glass interface.
      </p>

      <GlassPanel>
        <div className="mb-5">
          <h2 className="font-semibold">Change Background</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose the background used throughout your Organisation Admin
            workspace. Only these three built-in backgrounds are available.
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSaveBackground}>
          <div className="grid gap-4 md:grid-cols-3">
            {organisationBackgrounds.map((background) => {
              const isSelected = selectedBackgroundId === background.id
              const isCurrent = appearance.backgroundId === background.id

              return (
                <label
                  key={background.id}
                  className={cn(
                    'cursor-pointer overflow-hidden rounded-xl border bg-background/70 transition-[border-color,box-shadow,transform] duration-150 hover:-translate-y-0.5 hover:shadow-md has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring/50',
                    isSelected
                      ? 'border-foreground/30 shadow-sm ring-1 ring-foreground/15'
                      : 'border-border/70',
                  )}
                >
                  <input
                    className="sr-only"
                    type="radio"
                    name="organisation-background"
                    value={background.id}
                    checked={isSelected}
                    onChange={() => setSelectedBackgroundId(background.id)}
                  />

                  <div className="relative aspect-video overflow-hidden">
                    <img
                      className="size-full object-cover"
                      src={background.image}
                      alt=""
                    />
                    {isSelected && (
                      <span className="absolute top-2 right-2 flex size-7 items-center justify-center rounded-full bg-background/90 shadow-sm">
                        <CheckIcon className="size-4" aria-hidden="true" />
                        <span className="sr-only">Selected</span>
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">
                        {background.name}
                      </span>
                      {isCurrent && <Badge variant="outline">Current</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {background.description}
                    </p>
                  </div>
                </label>
              )
            })}
          </div>

          <div className="flex justify-end border-t border-border/60 pt-4">
            <Button
              type="submit"
              disabled={selectedBackgroundId === appearance.backgroundId}
            >
              Save Background
            </Button>
          </div>
        </form>
      </GlassPanel>
    </GlassSection>
  )
}

export default CompanySettingsPage
