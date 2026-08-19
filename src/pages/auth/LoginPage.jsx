import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  EyeIcon,
  EyeOffIcon,
  LockIcon,
  ShieldCheckIcon,
  UserRoundIcon,
} from 'lucide-react'

import GlassPanel from '@/components/glass/GlassPanel'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAppFeedback } from '@/hooks/useAppFeedback'
import { useAuth } from '@/hooks/useAuth'

const destinationByRole = {
  SUPER_ADMIN: '/admin',
  ORGANISATION_ADMIN: '/admin',
  HELP_DESK: '/support',
  USER: '/support',
}

function LoginPage() {
  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { login } = useAuth()
  const { showLoading, hideLoading } = useAppFeedback()
  const navigate = useNavigate()

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)
    showLoading('Signing in...')

    try {
      const user = await login(loginId, password)
      navigate(destinationByRole[user.role], { replace: true })
    } catch {
      setError('Invalid Login ID or password.')
    } finally {
      hideLoading()
      setIsSubmitting(false)
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 p-4 sm:p-6 text-foreground">
      {/* Ambient background flowing bottom-right to top-left */}
      <div className="support-ambient-background" aria-hidden="true">
        <div className="support-ambient-blob support-ambient-blob-one" />
        <div className="support-ambient-blob support-ambient-blob-two" />
        <div className="support-ambient-blob support-ambient-blob-three" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Subtle top ambient glow */}
        <div
          className="pointer-events-none absolute -top-10 left-1/2 h-20 w-3/4 -translate-x-1/2 rounded-full bg-sky-200/40 blur-2xl dark:bg-sky-500/15"
          aria-hidden="true"
        />

        <GlassPanel className="relative rounded-2xl border border-white/60 p-6 shadow-[0_12px_36px_rgb(0_0_0/0.07)] backdrop-blur-2xl sm:p-8 dark:border-white/10 dark:shadow-[0_12px_36px_rgb(0_0_0/0.3)]">
          {/* Branding Header */}
          <div className="mb-6 space-y-1.5 text-center">
            <div className="inline-flex items-center justify-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                <ShieldCheckIcon className="size-5" aria-hidden="true" />
              </div>
              <span className="text-2xl font-bold tracking-tight text-foreground">
                Ophile
              </span>
            </div>
            <p className="text-xs font-medium text-muted-foreground">
              Internal IT Support & Accountability
            </p>
          </div>

          {/* Form */}
          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            <div className="space-y-1.5">
              <Label
                htmlFor="loginId"
                className="text-xs font-semibold text-foreground/85"
              >
                Login ID
              </Label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                  <UserRoundIcon className="size-4" aria-hidden="true" />
                </div>
                <Input
                  id="loginId"
                  type="text"
                  autoComplete="username"
                  autoFocus
                  placeholder="Enter your Login ID"
                  value={loginId}
                  onChange={(event) => setLoginId(event.target.value)}
                  disabled={isSubmitting}
                  className="h-10 border-border/80 bg-background/70 pl-9.5 text-sm transition-colors focus-visible:bg-background"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="password"
                className="text-xs font-semibold text-foreground/85"
              >
                Password
              </Label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                  <LockIcon className="size-4" aria-hidden="true" />
                </div>
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={isSubmitting}
                  className="h-10 border-border/80 bg-background/70 pl-9.5 pr-10 text-sm transition-colors focus-visible:bg-background"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOffIcon className="size-4" aria-hidden="true" />
                  ) : (
                    <EyeIcon className="size-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div
                className="rounded-lg border border-destructive/20 bg-destructive/10 p-2.5 text-center text-xs font-medium text-destructive animate-in fade-in-50"
                role="alert"
              >
                {error}
              </div>
            )}

            <Button
              className="h-10 w-full text-sm font-medium transition-all"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </GlassPanel>
      </div>
    </main>
  )
}

export default LoginPage
