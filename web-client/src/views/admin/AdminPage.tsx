'use client'
import { useState } from 'react'

import { useAuthStore } from '../../store/authStore'
import Header from '../../components/layout/Header'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Spinner from '../../components/ui/Spinner'
import {
  useAdminStats,
  useAdminUsers,
  useCreateUser,
  useToggleUserStatus,
  useUpdateUser,
  useConfirmUserEmail,
  useAdminSubscriptionPlans,
  useUpdateSubscriptionPlan,
  useAdminInstructors,
  useAdminCourses,
  useSetCourseStatus,
  useAdminAuditLogs,
  useAdminAuthLogs,
} from '../../hooks/useAdmin'
import {
  useRoles,
  useCreateRole,
  useDeleteRole,
  useRolePermissions,
  useResources,
  useAddPermission,
  useRemovePermission,
  useUpdateRole,
} from '../../hooks/useIam'

type Tab = 'overview' | 'roles' | 'permissions' | 'subscriptions' | 'courses' | 'logs'

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

function toDateFrom(date: string): string {
  return `${date}T00:00:00.000Z`
}

function toDateTo(date: string): string {
  return `${date}T23:59:59.999Z`
}

interface StatCardProps {
  label: string
  value: string | number
  icon: React.ReactNode
  color: string
}

function StatCard({ label, value, icon, color }: StatCardProps) {
  return (
    <Card className="flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-text">{value}</p>
        <p className="text-sm text-subtle">{label}</p>
      </div>
    </Card>
  )
}

// ── Edit User Modal ───────────────────────────────────────────────────────────

interface EditUserModalProps {
  user: { userId: string; fullName: string; roles: string[] }
  onClose: () => void
}

function EditUserModal({ user, onClose }: EditUserModalProps) {
  const [fullName, setFullName] = useState(user.fullName)
  const [role, setRole]         = useState(user.roles[0] ?? 'Student')
  const updateUser = useUpdateUser()

  const handleSave = () => {
    updateUser.mutate(
      { userId: user.userId, fullName, role },
      { onSuccess: onClose },
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="w-full max-w-md bg-surface border border-border rounded-2xl shadow-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-text">Edit User</h3>
          <button onClick={onClose} className="text-subtle hover:text-text transition-colors p-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Full name</label>
            <input
              suppressHydrationWarning
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="Student">Student</option>
              <option value="Instructor">Instructor</option>
              <option value="Admin">Admin</option>
            </select>
          </div>
        </div>

        {updateUser.isError && (
          <p className="mt-3 text-sm text-danger">Failed to save changes.</p>
        )}

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-border text-text text-sm hover:bg-surface-hover transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={updateUser.isPending || !fullName.trim()}
            className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-hover disabled:opacity-50 transition-colors"
          >
            {updateUser.isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Create User Modal ─────────────────────────────────────────────────────────

function CreateUserModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail]       = useState('')
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole]         = useState('Student')
  const createUser = useCreateUser()

  const handleSave = () => {
    createUser.mutate(
      { email, fullName, password, role },
      { onSuccess: onClose },
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="w-full max-w-md bg-surface border border-border rounded-2xl shadow-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-text">Create User</h3>
          <button onClick={onClose} className="text-subtle hover:text-text transition-colors p-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Email</label>
            <input
              suppressHydrationWarning
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Full name</label>
            <input
              suppressHydrationWarning
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Password</label>
            <input
              suppressHydrationWarning
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="Student">Student</option>
              <option value="Instructor">Instructor</option>
              <option value="Admin">Admin</option>
            </select>
          </div>
        </div>

        {createUser.isError && (
          <p className="mt-3 text-sm text-danger">Failed to create user.</p>
        )}

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-border text-text text-sm hover:bg-surface-hover transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={createUser.isPending || !email.trim() || !fullName.trim() || !password.trim()}
            className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-hover disabled:opacity-50 transition-colors"
          >
            {createUser.isPending ? 'Creating…' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Overview Tab ──────────────────────────────────────────────────────────────

function OverviewTab() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [editingUser, setEditingUser] = useState<{ userId: string; fullName: string; roles: string[] } | null>(null)
  const [showCreateUser, setShowCreateUser] = useState(false)
  const pageSize = 20

  const { data: stats, isLoading: loadingStats } = useAdminStats()
  const { data: users, isLoading: loadingUsers } = useAdminUsers({ search: search || undefined, page, pageSize })
  const toggleStatusMutation = useToggleUserStatus()
  const confirmEmailMutation = useConfirmUserEmail()

  const handleToggle = (userId: string, currentStatus: boolean) => {
    toggleStatusMutation.mutate({ userId, isActive: !currentStatus })
  }

  return (
    <>
      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {loadingStats ? (
          [...Array(4)].map((_, i) => <div key={i} className="h-24 skeleton rounded-2xl" />)
        ) : (
          <>
            <StatCard
              label="Total Users"
              value={stats?.totalUsers ?? 0}
              color="bg-primary/15 text-primary"
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              }
            />
            <StatCard
              label="Total Courses"
              value={stats?.totalCourses ?? 0}
              color="bg-success/15 text-success"
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              }
            />
            <StatCard
              label="Total Enrollments"
              value={stats?.totalEnrollments ?? 0}
              color="bg-warning/15 text-warning"
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              }
            />
            <StatCard
              label="Total Revenue"
              value={`$${(stats?.totalRevenue ?? 0).toFixed(2)}`}
              color="bg-danger/15 text-danger"
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
          </>
        )}
      </div>

      {/* User management */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-semibold text-text">User Management</h2>
          <Button size="sm" onClick={() => setShowCreateUser(true)}>New User</Button>
        </div>

        <div className="mb-4 max-w-sm">
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            leftIcon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />
        </div>

        {loadingUsers ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="bg-surface border border-border rounded-2xl overflow-hidden">
            {users?.items.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-subtle">No users found.</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-5 py-3 text-subtle font-medium">User</th>
                    <th className="text-left px-5 py-3 text-subtle font-medium">Status</th>
                    <th className="text-left px-5 py-3 text-subtle font-medium">Email</th>
                    <th className="text-left px-5 py-3 text-subtle font-medium">Roles</th>
                    <th className="text-left px-5 py-3 text-subtle font-medium">Joined</th>
                    <th className="text-right px-5 py-3 text-subtle font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users?.items.map((user: any) => (
                    <tr key={user.userId} className="border-b border-border/50 last:border-0 hover:bg-surface-hover/50 transition-colors">
                      <td className="px-5 py-3">
                        <div>
                          <p className="font-medium text-text">{user.fullName}</p>
                          <p className="text-subtle text-xs">{user.email}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.isActive
                            ? 'bg-success/15 text-success'
                            : 'bg-danger/15 text-danger'
                        }`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.emailConfirmed
                            ? 'bg-success/15 text-success'
                            : 'bg-warning/15 text-warning'
                        }`}>
                          {user.emailConfirmed ? 'Confirmed' : 'Unconfirmed'}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex flex-wrap gap-1">
                          {user.roles.length > 0 ? user.roles.map((role: string) => (
                            <span key={role} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                              {role}
                            </span>
                          )) : (
                            <span className="text-subtle text-xs">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-subtle">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setEditingUser({ userId: user.userId, fullName: user.fullName, roles: user.roles })}
                          >
                            Edit
                          </Button>
                          {!user.emailConfirmed && (
                            <Button
                              size="sm"
                              variant="secondary"
                              loading={
                                confirmEmailMutation.isPending &&
                                (confirmEmailMutation.variables as string) === user.userId
                              }
                              onClick={() => confirmEmailMutation.mutate(user.userId)}
                            >
                              Confirm Email
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant={user.isActive ? 'danger' : 'secondary'}
                            loading={
                              toggleStatusMutation.isPending &&
                              (toggleStatusMutation.variables as { userId: string })?.userId === user.userId
                            }
                            onClick={() => handleToggle(user.userId, user.isActive)}
                          >
                            {user.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Pagination */}
            {users && users.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 px-5 py-4 border-t border-border">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <span className="text-sm text-subtle">
                  Page {page} of {users.totalPages}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page === users.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}
      </section>

      {editingUser && (
        <EditUserModal user={editingUser} onClose={() => setEditingUser(null)} />
      )}
      {showCreateUser && (
        <CreateUserModal onClose={() => setShowCreateUser(false)} />
      )}
    </>
  )
}

// ── Roles Tab ─────────────────────────────────────────────────────────────────

function RolesTab() {
  const { data: roles, isLoading } = useRoles()
  const createRole = useCreateRole()
  const deleteRole = useDeleteRole()
  const updateRole = useUpdateRole()

  const [editingRole, setEditingRole] = useState<{ id: string; name: string; originalName: string; description: string } | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')

  const handleCreate = () => {
    if (!newName.trim()) return
    createRole.mutate(
      { name: newName.trim(), description: newDesc.trim() },
      {
        onSuccess: () => {
          setNewName('')
          setNewDesc('')
          setShowNew(false)
        },
      },
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-semibold text-text">Roles</h2>
        <Button size="sm" onClick={() => setShowNew((v) => !v)}>
          {showNew ? 'Cancel' : 'New Role'}
        </Button>
      </div>

      {showNew && (
        <div className="mb-5 bg-surface border border-border rounded-2xl p-5 flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="Role name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <Input
            placeholder="Description (optional)"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
          />
          <Button
            size="sm"
            loading={createRole.isPending}
            disabled={!newName.trim()}
            onClick={handleCreate}
            className="shrink-0"
          >
            Save
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          {!roles || roles.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-subtle">No roles found.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-5 py-3 text-subtle font-medium">Name</th>
                  <th className="text-left px-5 py-3 text-subtle font-medium">Description</th>
                  <th className="text-right px-5 py-3 text-subtle font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((role: any) => (
                  <tr key={role.id} className="border-b border-border/50 last:border-0 hover:bg-surface-hover/50 transition-colors">
                    <td className="px-5 py-3 font-medium text-text">{role.name}</td>
                    <td className="px-5 py-3 text-subtle">{role.description || '—'}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setEditingRole({ id: role.id, name: role.name, originalName: role.name, description: role.description ?? '' })}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          loading={deleteRole.isPending && (deleteRole.variables as string) === role.id}
                          onClick={() => deleteRole.mutate(role.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
      {editingRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="w-full max-w-md bg-surface border border-border rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-text">Edit Role</h3>
              <button onClick={() => setEditingRole(null)} className="text-subtle hover:text-text transition-colors p-1">×</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">Role name</label>
                <input
                  suppressHydrationWarning
                  value={editingRole.name}
                  onChange={(e) => setEditingRole({ ...editingRole, name: e.target.value })}
                  disabled={['Admin', 'Instructor', 'Student'].includes(editingRole.originalName)}
                  className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-1.5">Description</label>
                <textarea suppressHydrationWarning
                  value={editingRole.description}
                  onChange={(e) => setEditingRole({ ...editingRole, description: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditingRole(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-border text-text text-sm hover:bg-surface-hover transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const payload: any = { roleId: editingRole.id, description: editingRole.description }
                  const reserved = ['Admin', 'Instructor', 'Student']
                  if (!reserved.includes(editingRole.originalName) && editingRole.name !== editingRole.originalName) {
                    payload.name = editingRole.name
                  }
                  updateRole.mutate(payload)
                  setEditingRole(null)
                }}
                disabled={updateRole.isPending}
                className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-hover disabled:opacity-50 transition-colors"
              >
                {updateRole.isPending ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Permissions Tab ───────────────────────────────────────────────────────────

function PermissionsTab() {
  const { data: roles, isLoading: loadingRoles } = useRoles()
  const { data: resources, isLoading: loadingResources } = useResources()
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null)
  const { data: permissions, isLoading: loadingPerms } = useRolePermissions(selectedRoleId)
  const addPermission = useAddPermission(selectedRoleId)
  const removePermission = useRemovePermission(selectedRoleId)

  const hasPermission = (resource: string, operation: string) =>
    permissions?.some((p: any) => p.resource === resource && p.operation === operation) ?? false

  const handleToggle = (resource: string, operation: string, checked: boolean) => {
    if (checked) {
      addPermission.mutate({ resource, operation })
    } else {
      removePermission.mutate({ resource, operation })
    }
  }

  const isPending = addPermission.isPending || removePermission.isPending

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-semibold text-text">Permissions Matrix</h2>
      </div>

      <div className="mb-6 max-w-xs">
        <label className="block text-sm font-medium text-text mb-1.5">Select Role</label>
        {loadingRoles ? (
          <div className="h-10 skeleton rounded-xl" />
        ) : (
          <select
            value={selectedRoleId ?? ''}
            onChange={(e) => setSelectedRoleId(e.target.value || null)}
            className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="">-- Choose a role --</option>
            {roles?.map((role: any) => (
              <option key={role.id} value={role.id}>{role.name}</option>
            ))}
          </select>
        )}
      </div>

      {!selectedRoleId && (
        <div className="py-16 text-center bg-surface border border-border rounded-2xl">
          <p className="text-subtle">Select a role to manage its permissions.</p>
        </div>
      )}

      {selectedRoleId && (loadingResources || loadingPerms) && (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      )}

      {selectedRoleId && !loadingResources && !loadingPerms && resources && (
        <div className="bg-surface border border-border rounded-2xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-5 py-3 text-subtle font-medium">Resource</th>
                {['Create', 'Read', 'Update', 'Delete'].map((op) => (
                  <th key={op} className="text-center px-4 py-3 text-subtle font-medium">{op}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {resources.map((res: any) => (
                <tr key={res.resource} className="border-b border-border/50 last:border-0 hover:bg-surface-hover/50 transition-colors">
                  <td className="px-5 py-3 font-medium text-text">{res.resource}</td>
                  {['Create', 'Read', 'Update', 'Delete'].map((op) => {
                    const supported = res.operations.includes(op)
                    const checked = hasPermission(res.resource, op)
                    return (
                      <td key={op} className="px-4 py-3 text-center">
                        {supported ? (
                          <div className="flex items-center justify-center">
                            {isPending ? (
                              <Spinner size="sm" />
                            ) : (
                              <input
                                suppressHydrationWarning
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => handleToggle(res.resource, op, e.target.checked)}
                                className="w-4 h-4 rounded accent-primary cursor-pointer"
                              />
                            )}
                          </div>
                        ) : (
                          <span className="text-border">—</span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Subscriptions Tab ─────────────────────────────────────────────────────────

function SubscriptionsTab() {
  const { data: plans, isLoading } = useAdminSubscriptionPlans()
  const updatePlan = useUpdateSubscriptionPlan()
  const [editingPlan, setEditingPlan] = useState<any | null>(null)

  const handleSave = () => {
    if (!editingPlan) return
    updatePlan.mutate(
      {
        planId: editingPlan.id,
        name: editingPlan.name,
        description: editingPlan.description,
        amount: Number(editingPlan.amount),
        sortOrder: Number(editingPlan.sortOrder),
      },
      { onSuccess: () => setEditingPlan(null) },
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-semibold text-text">Subscription Plans</h2>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          {!plans || plans.length === 0 ? (
            <div className="py-16 text-center"><p className="text-subtle">No plans found.</p></div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-5 py-3 text-subtle font-medium">Name</th>
                  <th className="text-left px-5 py-3 text-subtle font-medium">Interval</th>
                  <th className="text-left px-5 py-3 text-subtle font-medium">Price</th>
                  <th className="text-left px-5 py-3 text-subtle font-medium">Status</th>
                  <th className="text-right px-5 py-3 text-subtle font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {plans.map((plan: any) => (
                  <tr key={plan.id} className="border-b border-border/50 last:border-0 hover:bg-surface-hover/50 transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-medium text-text">{plan.name}</p>
                      <p className="text-subtle text-xs">{plan.description}</p>
                    </td>
                    <td className="px-5 py-3 text-subtle capitalize">{plan.interval}</td>
                    <td className="px-5 py-3 font-medium text-text">
                      {plan.currency.toUpperCase()} {plan.amount.toFixed(2)}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        plan.isActive ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'
                      }`}>
                        {plan.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Button size="sm" variant="secondary" onClick={() => setEditingPlan({ ...plan })}>
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {editingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="w-full max-w-md bg-surface border border-border rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-text">Edit Plan</h3>
              <button onClick={() => setEditingPlan(null)} className="text-subtle hover:text-text p-1">×</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">Name</label>
                <input
                  suppressHydrationWarning
                  value={editingPlan.name}
                  onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">Description</label>
                <textarea
                  suppressHydrationWarning
                  value={editingPlan.description}
                  onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">
                  Price ({editingPlan.currency.toUpperCase()})
                </label>
                <input
                  suppressHydrationWarning
                  type="number"
                  min="0"
                  step="0.01"
                  value={editingPlan.amount}
                  onChange={(e) => setEditingPlan({ ...editingPlan, amount: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">Sort Order</label>
                <input
                  suppressHydrationWarning
                  type="number"
                  min="0"
                  value={editingPlan.sortOrder}
                  onChange={(e) => setEditingPlan({ ...editingPlan, sortOrder: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditingPlan(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-border text-text text-sm hover:bg-surface-hover transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={updatePlan.isPending || !editingPlan.name.trim()}
                className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-hover disabled:opacity-50 transition-colors"
              >
                {updatePlan.isPending ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Courses Tab ───────────────────────────────────────────────────────────────

const COURSE_STATUSES: Record<number, { label: string; color: string }> = {
  0: { label: 'Draft',     color: 'bg-subtle/20 text-subtle' },
  1: { label: 'Published', color: 'bg-success/15 text-success' },
  2: { label: 'Archived',  color: 'bg-warning/15 text-warning' },
}

function CoursesTab() {
  const [search, setSearch]               = useState('')
  const [instructorId, setInstructorId]   = useState('')
  const [status, setStatus]               = useState<number | undefined>(undefined)
  const [page, setPage]                   = useState(1)
  const pageSize = 20

  const { data: instructors } = useAdminInstructors()
  const setCourseStatus = useSetCourseStatus()
  const { data, isLoading } = useAdminCourses({
    search: search || undefined,
    instructorId: instructorId || undefined,
    status,
    page,
    pageSize,
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-semibold text-text">Course Management</h2>
      </div>

      <div className="flex flex-wrap gap-3 mb-5">
        <Input
          placeholder="Search courses..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="max-w-xs"
          leftIcon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          }
        />
        <select
          value={instructorId}
          onChange={(e) => { setInstructorId(e.target.value); setPage(1) }}
          className="px-4 py-2.5 rounded-xl bg-background border border-border text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          <option value="">All instructors</option>
          {instructors?.map((i: any) => (
            <option key={i.userId} value={i.userId}>{i.fullName}</option>
          ))}
        </select>
        <select
          value={status ?? ''}
          onChange={(e) => { setStatus(e.target.value === '' ? undefined : Number(e.target.value)); setPage(1) }}
          className="px-4 py-2.5 rounded-xl bg-background border border-border text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          <option value="">All statuses</option>
          <option value="0">Draft</option>
          <option value="1">Published</option>
          <option value="2">Archived</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          {!data?.items.length ? (
            <div className="py-16 text-center"><p className="text-subtle">No courses found.</p></div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-5 py-3 text-subtle font-medium">Title</th>
                  <th className="text-left px-5 py-3 text-subtle font-medium">Instructor</th>
                  <th className="text-left px-5 py-3 text-subtle font-medium">Status</th>
                  <th className="text-left px-5 py-3 text-subtle font-medium">Type</th>
                  <th className="text-left px-5 py-3 text-subtle font-medium">Enrollments</th>
                  <th className="text-left px-5 py-3 text-subtle font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((course: any) => {
                  const st = COURSE_STATUSES[course.status] ?? { label: String(course.status), color: 'bg-subtle/20 text-subtle' }
                  return (
                    <tr key={course.courseId} className="border-b border-border/50 last:border-0 hover:bg-surface-hover/50 transition-colors">
                      <td className="px-5 py-3">
                        <p className="font-medium text-text">{course.title}</p>
                        <p className="text-subtle text-xs">{course.slug}</p>
                      </td>
                      <td className="px-5 py-3 text-subtle text-xs">
                        {course.instructorName ?? course.instructorId}
                      </td>
                      <td className="px-5 py-3">
                        <select
                          value={course.status}
                          disabled={setCourseStatus.isPending && (setCourseStatus.variables as any)?.courseId === course.courseId}
                          onChange={(e) => setCourseStatus.mutate({ courseId: course.courseId, status: Number(e.target.value) })}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium border-0 focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer ${st.color} bg-transparent`}
                        >
                          <option value={0}>Draft</option>
                          <option value={1}>Published</option>
                          <option value={2}>Archived</option>
                        </select>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          course.isFree ? 'bg-success/15 text-success' : 'bg-primary/10 text-primary'
                        }`}>
                          {course.isFree ? 'Free' : 'Subscription'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-subtle">{course.enrollmentCount}</td>
                      <td className="px-5 py-3 text-subtle text-xs">
                        {new Date(course.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}

          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 px-5 py-4 border-t border-border">
              <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <span className="text-sm text-subtle">Page {page} of {data.totalPages}</span>
              <Button variant="secondary" size="sm" disabled={page === data.totalPages} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Logs Tab (Audit + Auth) ───────────────────────────────────────────────────

type LogSubTab = 'audit' | 'auth'

function AuditTab() {
  const [entityFilter, setEntityFilter] = useState('')
  const [userNameFilter, setUserNameFilter] = useState('')
  const [dateFrom, setDateFrom] = useState(todayIso)
  const [dateTo, setDateTo]     = useState(todayIso)
  const [sortAsc, setSortAsc]   = useState(false)
  const [page, setPage]         = useState(1)
  const pageSize = 50

  const { data, isLoading } = useAdminAuditLogs({
    entityName: entityFilter || undefined,
    userName:   userNameFilter || undefined,
    dateFrom:   dateFrom ? toDateFrom(dateFrom) : undefined,
    dateTo:     dateTo   ? toDateTo(dateTo)     : undefined,
    sortAsc,
    page,
    pageSize,
  })

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-5">
        <Input
          placeholder="Filter by entity (e.g. Course)"
          value={entityFilter}
          onChange={(e) => { setEntityFilter(e.target.value); setPage(1) }}
          className="max-w-xs"
        />
        <Input
          placeholder="Filter by username"
          value={userNameFilter}
          onChange={(e) => { setUserNameFilter(e.target.value); setPage(1) }}
          className="max-w-xs"
        />
        <div className="flex items-center gap-2">
          <input
            suppressHydrationWarning
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
            className="px-3 py-2 rounded-xl bg-background border border-border text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <span className="text-subtle text-sm">—</span>
          <input
            suppressHydrationWarning
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
            className="px-3 py-2 rounded-xl bg-background border border-border text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <button
            onClick={() => { setDateFrom(''); setDateTo(''); setPage(1) }}
            className="text-xs text-subtle hover:text-text transition-colors px-2 py-1"
          >
            Clear dates
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          {!data?.items.length ? (
            <div className="py-16 text-center"><p className="text-subtle">No audit logs found.</p></div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 text-subtle font-medium">
                    <button
                      onClick={() => setSortAsc((v) => !v)}
                      className="flex items-center gap-1 hover:text-text transition-colors"
                    >
                      Time
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d={sortAsc ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'} />
                      </svg>
                    </button>
                  </th>
                  <th className="text-left px-4 py-3 text-subtle font-medium">Entity</th>
                  <th className="text-left px-4 py-3 text-subtle font-medium">Action</th>
                  <th className="text-left px-4 py-3 text-subtle font-medium">User</th>
                  <th className="text-left px-4 py-3 text-subtle font-medium">Source</th>
                  <th className="text-left px-4 py-3 text-subtle font-medium">IP</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((log: any) => (
                  <tr key={log.id} className="border-b border-border/50 last:border-0 hover:bg-surface-hover/50 transition-colors">
                    <td className="px-4 py-3 text-subtle text-xs whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-medium text-text">{log.entityName ?? '—'}</td>
                    <td className="px-4 py-3">
                      {log.action && (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          log.action === 'Insert' ? 'bg-success/15 text-success' :
                          log.action === 'Delete' ? 'bg-danger/15 text-danger' :
                          'bg-primary/10 text-primary'
                        }`}>
                          {log.action}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-subtle text-xs">
                      {log.userName ?? log.userId ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-subtle text-xs">{log.source}</td>
                    <td className="px-4 py-3 text-subtle text-xs">{log.ipAddress ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 px-5 py-4 border-t border-border">
              <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <span className="text-sm text-subtle">Page {page} of {data.totalPages}</span>
              <Button variant="secondary" size="sm" disabled={page === data.totalPages} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function AuthLogsPanel() {
  const [emailFilter, setEmailFilter]     = useState('')
  const [successFilter, setSuccessFilter] = useState<boolean | undefined>(undefined)
  const [dateFrom, setDateFrom]           = useState(todayIso)
  const [dateTo, setDateTo]               = useState(todayIso)
  const [page, setPage]                   = useState(1)
  const pageSize = 50

  const { data, isLoading } = useAdminAuthLogs({
    email:    emailFilter || undefined,
    success:  successFilter,
    dateFrom: dateFrom ? toDateFrom(dateFrom) : undefined,
    dateTo:   dateTo   ? toDateTo(dateTo)     : undefined,
    page,
    pageSize,
  })

  return (
    <>
      <div className="flex flex-wrap gap-3 mb-5">
        <Input
          placeholder="Filter by email"
          value={emailFilter}
          onChange={(e) => { setEmailFilter(e.target.value); setPage(1) }}
          className="max-w-xs"
        />
        <select
          value={successFilter === undefined ? '' : String(successFilter)}
          onChange={(e) => {
            setSuccessFilter(e.target.value === '' ? undefined : e.target.value === 'true')
            setPage(1)
          }}
          className="px-4 py-2.5 rounded-xl bg-background border border-border text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          <option value="">All results</option>
          <option value="true">Success</option>
          <option value="false">Failed</option>
        </select>
        <div className="flex items-center gap-2">
          <input
            suppressHydrationWarning
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
            className="px-3 py-2 rounded-xl bg-background border border-border text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <span className="text-subtle text-sm">—</span>
          <input
            suppressHydrationWarning
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
            className="px-3 py-2 rounded-xl bg-background border border-border text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <button
            onClick={() => { setDateFrom(''); setDateTo(''); setPage(1) }}
            className="text-xs text-subtle hover:text-text transition-colors px-2 py-1"
          >
            Clear dates
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          {!data?.items.length ? (
            <div className="py-16 text-center"><p className="text-subtle">No auth logs found.</p></div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 text-subtle font-medium">Time</th>
                  <th className="text-left px-4 py-3 text-subtle font-medium">Event</th>
                  <th className="text-left px-4 py-3 text-subtle font-medium">Email</th>
                  <th className="text-left px-4 py-3 text-subtle font-medium">Result</th>
                  <th className="text-left px-4 py-3 text-subtle font-medium">Failure reason</th>
                  <th className="text-left px-4 py-3 text-subtle font-medium">IP</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((log: any) => (
                  <tr key={log.id} className="border-b border-border/50 last:border-0 hover:bg-surface-hover/50 transition-colors">
                    <td className="px-4 py-3 text-subtle text-xs whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-medium text-text text-xs">{log.eventType}</td>
                    <td className="px-4 py-3 text-subtle text-xs">{log.email ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        log.success ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'
                      }`}>
                        {log.success ? 'Success' : 'Failed'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-subtle text-xs">{log.failureReason ?? '—'}</td>
                    <td className="px-4 py-3 text-subtle text-xs">{log.ipAddress ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 px-5 py-4 border-t border-border">
              <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <span className="text-sm text-subtle">Page {page} of {data.totalPages}</span>
              <Button variant="secondary" size="sm" disabled={page === data.totalPages} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          )}
        </div>
      )}
    </>
  )
}

function LogsTab() {
  const [subTab, setSubTab] = useState<LogSubTab>('audit')

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-semibold text-text">Logs</h2>
      </div>

      <div className="flex gap-0 mb-6 border-b border-border">
        {(['audit', 'auth'] as LogSubTab[]).map((s) => (
          <button
            key={s}
            onClick={() => setSubTab(s)}
            className={`px-4 py-2.5 text-sm font-medium transition-all duration-150 border-b-2 -mb-px capitalize ${
              subTab === s
                ? 'border-primary text-primary'
                : 'border-transparent text-subtle hover:text-text'
            }`}
          >
            {s === 'audit' ? 'Audit' : 'Auth Events'}
          </button>
        ))}
      </div>

      {subTab === 'audit' && <AuditTab />}
      {subTab === 'auth' && <AuthLogsPanel />}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function AdminPage() {
  const { user } = useAuthStore()
  const [tab, setTab] = useState<Tab>('overview')

  if (user?.role !== 'Admin') return null

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'overview', label: 'Overview' },
    { key: 'courses', label: 'Courses' },
    { key: 'roles', label: 'Roles' },
    { key: 'permissions', label: 'Permissions' },
    { key: 'subscriptions', label: 'Subscriptions' },
    { key: 'logs', label: 'Logs' },
  ]

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text">Admin Dashboard</h1>
          <p className="text-subtle mt-1">Platform overview and management</p>
        </div>

        <div className="flex gap-0 mb-8 border-b border-border">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-5 py-3 text-sm font-medium transition-all duration-150 border-b-2 -mb-px ${
                tab === t.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-subtle hover:text-text'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'overview'     && <OverviewTab />}
        {tab === 'courses'      && <CoursesTab />}
        {tab === 'roles'        && <RolesTab />}
        {tab === 'permissions'  && <PermissionsTab />}
        {tab === 'subscriptions'&& <SubscriptionsTab />}
        {tab === 'logs'         && <LogsTab />}
      </main>
    </div>
  )
}
