import { Navigate, Route, Routes, useParams } from 'react-router-dom'

import PortalRoute from '@/components/common/PortalRoute'
import ProtectedRoute from '@/components/common/ProtectedRoute'
import OrganisationAdminLayout from '@/layouts/OrganisationAdminLayout'
import SuperAdminLayout from '@/layouts/SuperAdminLayout'
import SupportLayout from '@/layouts/SupportLayout'
import { useAuth } from '@/hooks/useAuth'
import AdminHome from '@/pages/admin/AdminHome'
import GroupDetailPage from '@/pages/admin/GroupDetailPage'
import GroupsPage from '@/pages/admin/GroupsPage'
import ReportsPage from '@/pages/admin/ReportsPage'
import RolesPermissionsPage from '@/pages/admin/RolesPermissionsPage'
import TicketCategoriesPage from '@/pages/admin/TicketCategoriesPage'
import CompaniesPage from '@/pages/admin/CompaniesPage'
import CompanyAdminDetailPage from '@/pages/admin/CompanyAdminDetailPage'
import CompanyAdminUserDetailPage from '@/pages/admin/CompanyAdminUserDetailPage'
import CompanyAdminsPage from '@/pages/admin/CompanyAdminsPage'
import CompanyDetailPage from '@/pages/admin/CompanyDetailPage'
import CompanySettingsPage from '@/pages/admin/CompanySettingsPage'
import CreateUserPage from '@/pages/admin/CreateUserPage'
import CreateHelpDeskPage from '@/pages/admin/CreateHelpDeskPage'
import EditUserPage from '@/pages/admin/EditUserPage'
import EditHelpDeskPage from '@/pages/admin/EditHelpDeskPage'
import HelpDeskDetailPage from '@/pages/admin/HelpDeskDetailPage'
import HelpDeskManagementPage from '@/pages/admin/HelpDeskManagementPage'
import CompanySubscriptionDetailPage from '@/pages/admin/subscriptions/CompanySubscriptionDetailPage'
import CompanySubscriptionsPage from '@/pages/admin/subscriptions/CompanySubscriptionsPage'
import CreateNegotiationPage from '@/pages/admin/subscriptions/CreateNegotiationPage'
import NegotiationDetailPage from '@/pages/admin/subscriptions/NegotiationDetailPage'
import NegotiationsPage from '@/pages/admin/subscriptions/NegotiationsPage'
import PaymentTransactionDetailPage from '@/pages/admin/subscriptions/PaymentTransactionDetailPage'
import SubscriptionPaymentDetailPage from '@/pages/admin/subscriptions/SubscriptionPaymentDetailPage'
import SubscriptionPaymentsPage from '@/pages/admin/subscriptions/SubscriptionPaymentsPage'
import UserDetailPage from '@/pages/admin/UserDetailPage'
import UserAccessDetailPage from '@/pages/admin/UserAccessDetailPage'
import UsersPage from '@/pages/admin/UsersPage'
import LoginPage from '@/pages/auth/LoginPage'
import LogTicketPage from '@/pages/support/LogTicketPage'
import GroupListPage from '@/pages/support/GroupListPage'
import SupportReportsPage from '@/pages/support/SupportReportsPage'
import TicketDetailPage from '@/pages/support/TicketDetailPage'
import TicketsPage from '@/pages/support/TicketsPage'

const adminRoles = ['SUPER_ADMIN', 'ORGANISATION_ADMIN']
const supportRoles = ['ORGANISATION_ADMIN', 'HELP_DESK', 'USER']

function AdminPortalLayout() {
  const { user } = useAuth()

  return user.role === 'SUPER_ADMIN' ? (
    <SuperAdminLayout />
  ) : (
    <OrganisationAdminLayout />
  )
}

function LegacyTicketRedirect() {
  const { issueId } = useParams()
  return <Navigate to={`/support/tickets/${issueId}`} replace />
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/support" replace />} />
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route
          element={
            <PortalRoute allowedRoles={adminRoles} redirectTo="/support" />
          }
        >
          <Route path="/admin" element={<AdminPortalLayout />}>
            <Route index element={<AdminHome />} />

            <Route
              element={
                <PortalRoute allowedRoles={['SUPER_ADMIN']} redirectTo="/admin" />
              }
            >
              <Route path="organisations" element={<CompaniesPage />} />
              <Route
                path="organisations/:organisationId"
                element={<CompanyDetailPage />}
              />
              <Route
                path="organisation-admins"
                element={<CompanyAdminsPage />}
              />
              <Route
                path="organisation-admins/:organisationId"
                element={<CompanyAdminDetailPage />}
              />
              <Route
                path="organisation-admins/:companyId/users/:userId"
                element={<CompanyAdminUserDetailPage />}
              />
              <Route
                path="subscriptions/companies"
                element={<CompanySubscriptionsPage />}
              />
              <Route
                path="subscriptions/companies/:companyId"
                element={<CompanySubscriptionDetailPage />}
              />
              <Route
                path="subscriptions/payments"
                element={<SubscriptionPaymentsPage />}
              />
              <Route
                path="subscriptions/payments/:companyId"
                element={<SubscriptionPaymentDetailPage />}
              />
              <Route
                path="subscriptions/payments/:companyId/transactions/:transactionId"
                element={<PaymentTransactionDetailPage />}
              />
              <Route
                path="subscriptions/negotiations"
                element={<NegotiationsPage />}
              />
              <Route
                path="subscriptions/negotiations/new"
                element={<CreateNegotiationPage />}
              />
              <Route
                path="subscriptions/negotiations/:negotiationId"
                element={<NegotiationDetailPage />}
              />
            </Route>

            <Route
              element={
                <PortalRoute
                  allowedRoles={adminRoles}
                  requiredPermission="VIEW_REPORTS"
                  redirectTo="/admin"
                />
              }
            >
              <Route path="reports" element={<ReportsPage />} />
            </Route>

            <Route
              element={
                <PortalRoute
                  allowedRoles={['ORGANISATION_ADMIN']}
                  redirectTo="/admin"
                />
              }
            >
              <Route path="users" element={<UsersPage />} />
              <Route path="users/new" element={<CreateUserPage />} />
              <Route path="users/:userId" element={<UserDetailPage />} />
              <Route path="users/:userId/edit" element={<EditUserPage />} />
              <Route
                path="helpdesk"
                element={<HelpDeskManagementPage />}
              />
              <Route
                path="helpdesk/new"
                element={<CreateHelpDeskPage />}
              />
              <Route
                path="helpdesk/:userId"
                element={<HelpDeskDetailPage />}
              />
              <Route
                path="helpdesk/:userId/edit"
                element={<EditHelpDeskPage />}
              />
              <Route path="groups" element={<GroupsPage />} />
              <Route path="groups/:groupId" element={<GroupDetailPage />} />
              <Route
                path="ticket-categories"
                element={<TicketCategoriesPage />}
              />
              <Route
                path="roles-permissions"
                element={<RolesPermissionsPage />}
              />
              <Route
                path="roles-permissions/users/:userId"
                element={<UserAccessDetailPage />}
              />
              <Route
                path="settings"
                element={<CompanySettingsPage />}
              />
            </Route>
          </Route>
        </Route>

        <Route
          element={
            <PortalRoute allowedRoles={supportRoles} redirectTo="/admin" />
          }
        >
          <Route path="/support" element={<SupportLayout />}>
            <Route index element={<Navigate to="/support/tickets" replace />} />
            <Route path="tickets" element={<TicketsPage />} />
            <Route path="tickets/new" element={<LogTicketPage />} />
            <Route path="tickets/:ticketId" element={<TicketDetailPage />} />
            <Route
              element={
                <PortalRoute
                  allowedRoles={['USER', 'HELP_DESK']}
                  redirectTo="/support/tickets"
                />
              }
            >
              <Route path="groups" element={<GroupListPage />} />
            </Route>
            <Route
              element={
                <PortalRoute
                  allowedRoles={supportRoles}
                  requiredPermission="VIEW_REPORTS"
                  redirectTo="/support/tickets"
                />
              }
            >
              <Route path="reports" element={<SupportReportsPage />} />
            </Route>

            <Route path="issues" element={<Navigate to="/support/tickets" replace />} />
            <Route path="issues/group" element={<Navigate to="/support/tickets" replace />} />
            <Route path="issues/new" element={<Navigate to="/support/tickets/new" replace />} />
            <Route path="issues/:issueId" element={<LegacyTicketRedirect />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  )
}

export default App
