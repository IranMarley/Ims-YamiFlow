import { api } from '../lib/axios'

export interface RoleItem {
  id: string
  name: string
  description: string
}

export interface PermissionItem {
  resource: string
  operation: string
}

export interface ResourceDef {
  resource: string
  operations: string[]
}

export const iamService = {
  async listRoles(): Promise<RoleItem[]> {
    const r = await api.get<RoleItem[]>('/api/iam/roles')
    return r.data
  },
  async createRole(name: string, description: string): Promise<void> {
    await api.post('/api/iam/roles', { name, description })
  },
  async deleteRole(roleId: string): Promise<void> {
    await api.delete(`/api/iam/roles/${roleId}`)
  },
  async updateRole(roleId: string, name?: string, description?: string): Promise<void> {
    const body: Record<string, any> = {}
    if (name !== undefined) body.name = name
    if (description !== undefined) body.description = description
    await api.put(`/api/iam/roles/${roleId}`, body)
  },
  async getRolePermissions(roleId: string): Promise<PermissionItem[]> {
    const r = await api.get<PermissionItem[]>(`/api/iam/roles/${roleId}/permissions`)
    return r.data
  },
  async addPermission(roleId: string, resource: string, operation: string): Promise<void> {
    await api.post(`/api/iam/roles/${roleId}/permissions`, { resource, operation })
  },
  async removePermission(roleId: string, resource: string, operation: string): Promise<void> {
    await api.delete(`/api/iam/roles/${roleId}/permissions`, { data: { resource, operation } })
  },
  async listResources(): Promise<ResourceDef[]> {
    const r = await api.get<ResourceDef[]>('/api/iam/resources')
    return r.data
  },
  async assignRole(userId: string, roleName: string): Promise<void> {
    await api.post(`/api/iam/users/${userId}/roles`, { roleName })
  },
  async removeRole(userId: string, roleName: string): Promise<void> {
    await api.delete(`/api/iam/users/${userId}/roles/${roleName}`)
  },
}
