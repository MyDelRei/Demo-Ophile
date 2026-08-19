import { Navigate, Outlet } from 'react-router-dom'

import { useAuth } from '@/hooks/useAuth'

function PortalRoute({ allowedRoles, redirectTo, requiredPermission }) {
  const { user } = useAuth()
  const hasRequiredPermission =
    !requiredPermission ||
    user.role === 'SUPER_ADMIN' ||
    user.permissions?.includes(requiredPermission)

  return allowedRoles.includes(user.role) && hasRequiredPermission ? (
    <Outlet />
  ) : (
    <Navigate to={redirectTo} replace />
  )
}

export default PortalRoute
