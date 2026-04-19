import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { iamService } from '../services/iam.service'

export function useRoles() {
  return useQuery<any, Error>({ queryKey: ['iam', 'roles'], queryFn: iamService.listRoles })
}

export function useCreateRole() {
  const qc = useQueryClient()
  return useMutation<any, Error, { name: string; description: string }>({
    mutationFn: ({ name, description }: { name: string; description: string }) =>
      iamService.createRole(name, description),
  onMutate: async () => {
      await qc.cancelQueries({ queryKey: ['iam', 'roles'] })
      const previous = qc.getQueryData(['iam', 'roles'])
      return { previous }
    },
    onError: (err, _vars, context: any) => {
      if (context?.previous) qc.setQueryData(['iam', 'roles'], context.previous)
      toast.error((err as Error)?.message || 'Failed to create role')
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['iam', 'roles'] })
      toast.success('Role created.')
    },
  })
}

export function useDeleteRole() {
  const qc = useQueryClient()
  return useMutation<any, Error, string>({
    mutationFn: (roleId: string) => iamService.deleteRole(roleId),
  onMutate: async () => {
      await qc.cancelQueries({ queryKey: ['iam', 'roles'] })
      const previous = qc.getQueryData(['iam', 'roles'])
      return { previous }
    },
    onError: (err, _vars, context: any) => {
      if (context?.previous) qc.setQueryData(['iam', 'roles'], context.previous)
      toast.error((err as Error)?.message || 'Failed to delete role')
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['iam', 'roles'] })
      toast.success('Role deleted.')
    },
  })
}

export function useUpdateRole() {
  const qc = useQueryClient()
  return useMutation<any, Error, { roleId: string; name?: string; description?: string }>({
    mutationFn: ({ roleId, name, description }: { roleId: string; name?: string; description?: string }) =>
      iamService.updateRole(roleId, name, description),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ['iam', 'roles'] })
      const previous = qc.getQueryData(['iam', 'roles'])
      return { previous }
    },
    onError: (err, _vars, context: any) => {
      if (context?.previous) qc.setQueryData(['iam', 'roles'], context.previous)
      toast.error((err as Error)?.message || 'Failed to update role')
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['iam', 'roles'] })
      toast.success('Role updated.')
    },
  })
}

export function useRolePermissions(roleId: string | null) {
  return useQuery<any, Error>({
    queryKey: ['iam', 'permissions', roleId ?? 'null'],
    queryFn: () => iamService.getRolePermissions(roleId!),
    enabled: !!roleId,
  })
}

export function useResources() {
  return useQuery<any, Error>({ queryKey: ['iam', 'resources'], queryFn: iamService.listResources })
}

export function useAddPermission(roleId: string | null) {
  const qc = useQueryClient()
  return useMutation<any, Error, { resource: string; operation: string }>({
    mutationFn: ({ resource, operation }: { resource: string; operation: string }) =>
      iamService.addPermission(roleId!, resource, operation),
  onMutate: async () => {
      await qc.cancelQueries({ queryKey: ['iam', 'permissions', roleId] })
      const previous = qc.getQueryData(['iam', 'permissions', roleId])
      return { previous }
    },
    onError: (err, _vars, context: any) => {
      if (context?.previous) qc.setQueryData(['iam', 'permissions', roleId], context.previous)
      toast.error((err as Error)?.message || 'Failed to add permission')
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['iam', 'permissions', roleId] }),
  })
}

export function useRemovePermission(roleId: string | null) {
  const qc = useQueryClient()
  return useMutation<any, Error, { resource: string; operation: string }>({
    mutationFn: ({ resource, operation }: { resource: string; operation: string }) =>
      iamService.removePermission(roleId!, resource, operation),
  onMutate: async () => {
      await qc.cancelQueries({ queryKey: ['iam', 'permissions', roleId] })
      const previous = qc.getQueryData(['iam', 'permissions', roleId])
      return { previous }
    },
    onError: (err, _vars, context: any) => {
      if (context?.previous) qc.setQueryData(['iam', 'permissions', roleId], context.previous)
      toast.error((err as Error)?.message || 'Failed to remove permission')
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['iam', 'permissions', roleId] }),
  })
}

export function useAssignRole() {
  const qc = useQueryClient()
  return useMutation<any, Error, { userId: string; roleName: string }>({
    mutationFn: ({ userId, roleName }: { userId: string; roleName: string }) =>
      iamService.assignRole(userId, roleName),
  onMutate: async () => {
      await qc.cancelQueries({ queryKey: ['admin', 'users'] })
      const previous = qc.getQueryData(['admin', 'users'])
      return { previous }
    },
    onError: (err, _vars, context: any) => {
      if (context?.previous) qc.setQueryData(['admin', 'users'], context.previous)
      toast.error((err as Error)?.message || 'Failed to assign role')
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] })
      toast.success('Role assigned.')
    },
  })
}

export function useRemoveRole() {
  const qc = useQueryClient()
  return useMutation<any, Error, { userId: string; roleName: string }>({
    mutationFn: ({ userId, roleName }: { userId: string; roleName: string }) =>
      iamService.removeRole(userId, roleName),
  onMutate: async () => {
      await qc.cancelQueries({ queryKey: ['admin', 'users'] })
      const previous = qc.getQueryData(['admin', 'users'])
      return { previous }
    },
    onError: (err, _vars, context: any) => {
      if (context?.previous) qc.setQueryData(['admin', 'users'], context.previous)
      toast.error((err as Error)?.message || 'Failed to remove role')
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] })
      toast.success('Role removed.')
    },
  })
}
