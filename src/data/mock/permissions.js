export const mockPredefinedPermissions = [
  {
    key: 'VIEW_REPORTS',
    label: 'View Reports',
    description:
      'Allows this user to access reporting screens available to their Company.',
    requires: [],
  },
  {
    key: 'VIEW_GROUP_REPORTS',
    label: 'View Group Reports',
    description:
      'Allows reporting for Groups within the user’s authorised Company scope.',
    requires: ['VIEW_REPORTS'],
  },
  {
    key: 'EXPORT_REPORTS',
    label: 'Export Reports',
    description:
      'Allows future report export actions when export functionality is available.',
    requires: ['VIEW_REPORTS'],
  },
]

export const mockRoleDefinitions = [
  {
    key: 'USER',
    label: 'User',
    description: 'Standard organisation employee with personal support access.',
  },
  {
    key: 'HELP_DESK',
    label: 'Help Desk',
    description:
      'Standard User capabilities plus Help Desk support operations.',
  },
  {
    key: 'ORGANISATION_ADMIN',
    label: 'Organisation Admin',
    description:
      'Standard User capabilities plus Company administration.',
  },
]

export const mockRoleCapabilityGroups = [
  {
    key: 'SUPPORT_REQUESTS',
    label: 'Support Requests',
    roles: ['USER', 'HELP_DESK', 'ORGANISATION_ADMIN'],
    capabilities: [
      'Create Own Ticket',
      'View Own Tickets',
      'Comment on Own Tickets',
      'Track Ticket Status',
      'View Current Help Desk Assignee',
      'Confirm Resolution',
      'Reject Resolution',
      'Reopen Own Closed Ticket',
      'View Own Profile',
    ],
  },
  {
    key: 'HELP_DESK_OPERATIONS',
    label: 'Help Desk Operations',
    roles: ['HELP_DESK'],
    capabilities: [
      'View All Company Tickets',
      'Classify Ticket',
      'Route Open Ticket',
      'Re-route Pending Ticket',
      'Assign Ticket',
      'Self-Assign Ticket',
      'Start Work',
      'Comment as Assigned Help Desk',
      'Mark Ticket Resolved',
      'Drop Open / Pending Ticket',
      'Close Resolved Ticket for Requester',
    ],
  },
  {
    key: 'ORGANISATION_ADMINISTRATION',
    label: 'Organisation Administration',
    roles: ['ORGANISATION_ADMIN'],
    capabilities: [
      'Manage Users',
      'Create Users',
      'Activate / Deactivate Users',
      'Assign Organisation Roles',
      'Manage Help Desk Users',
      'Manage Groups',
      'Create Groups',
      'Edit Groups',
      'Activate / Deactivate Groups',
      'Assign Users to Groups',
      'Remove Users from Groups',
      'Manage Organisation Settings',
      'Manage Roles & Additional Permissions',
    ],
  },
]

export const mockUserPermissions = [
  {
    userId: 'user-002',
    permission: 'VIEW_REPORTS',
    enabled: true,
  },
]

export const mockAccessChanges = [
  {
    id: 'access-change-001',
    organisationId: 'organisation-001',
    userId: 'user-003',
    userName: 'Maya Patel',
    changedByUserId: 'user-002',
    changedByName: 'Daniel Kim',
    changeType: 'ROLE_CHANGED',
    previousValue: 'USER',
    newValue: 'HELP_DESK',
    createdAt: '2026-08-12T10:15:00.000Z',
  },
  {
    id: 'access-change-002',
    organisationId: 'organisation-001',
    userId: 'user-002',
    userName: 'Daniel Kim',
    changedByUserId: 'user-002',
    changedByName: 'Daniel Kim',
    changeType: 'PERMISSION_ENABLED',
    permission: 'VIEW_REPORTS',
    previousValue: 'No',
    newValue: 'Yes',
    createdAt: '2026-08-13T14:30:00.000Z',
  },
]
