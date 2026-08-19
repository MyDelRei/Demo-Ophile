import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import GlobalLoading from '@/components/common/GlobalLoading'
import GlobalNotification from '@/components/common/GlobalNotification'
import { AppFeedbackContext } from '@/context/app-feedback-context'

export function AppFeedbackProvider({ children }) {
  const [loading, setLoading] = useState({
    isLoading: false,
    message: 'Processing...',
  })
  const [notification, setNotification] = useState(null)
  const notificationTimer = useRef(null)

  useEffect(
    () => () => {
      if (notificationTimer.current) {
        window.clearTimeout(notificationTimer.current)
      }
    },
    [],
  )

  const showLoading = useCallback(
    function showLoading(message = 'Processing...') {
      setLoading({ isLoading: true, message })
    },
    [],
  )

  const hideLoading = useCallback(function hideLoading() {
    setLoading((current) => ({ ...current, isLoading: false }))
  }, [])

  const dismissNotification = useCallback(function dismissNotification() {
    if (notificationTimer.current) {
      window.clearTimeout(notificationTimer.current)
      notificationTimer.current = null
    }
    setNotification(null)
  }, [])

  const showNotification = useCallback(function showNotification(
    message,
    variant = 'success',
  ) {
    if (notificationTimer.current) {
      window.clearTimeout(notificationTimer.current)
    }

    setNotification({ message, variant })
    notificationTimer.current = window.setTimeout(() => {
      setNotification(null)
      notificationTimer.current = null
    }, 3500)
  }, [])

  const contextValue = useMemo(
    () => ({
      isLoading: loading.isLoading,
      loadingMessage: loading.message,
      showLoading,
      hideLoading,
      showNotification,
    }),
    [hideLoading, loading, showLoading, showNotification],
  )

  return (
    <AppFeedbackContext.Provider value={contextValue}>
      {children}
      {loading.isLoading && <GlobalLoading message={loading.message} />}
      {notification && (
        <GlobalNotification
          message={notification.message}
          variant={notification.variant}
          onDismiss={dismissNotification}
        />
      )}
    </AppFeedbackContext.Provider>
  )
}
