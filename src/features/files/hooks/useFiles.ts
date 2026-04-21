import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useWorkspace } from '@/features/workspace'
import { useAuth } from '@/features/auth'
import { fileService } from '../service/fileService'
import type { EntityType } from '../types'

export function useFiles(entityType: EntityType, entityId: string | null) {
  const { activeCompanyId } = useWorkspace()
  return useQuery({
    queryKey: ['files', entityType, entityId],
    queryFn: () => fileService.list(activeCompanyId!, entityType, entityId!),
    enabled: !!activeCompanyId && !!entityId,
  })
}

export function useUploadFile(entityType: EntityType, entityId: string) {
  const { activeCompanyId } = useWorkspace()
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ file, label }: { file: File; label?: string }) =>
      fileService.upload(activeCompanyId!, entityType, entityId, file, label, user?.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['files', entityType, entityId] }),
  })
}

export function useDeleteFile(entityType: EntityType, entityId: string) {
  const { activeCompanyId } = useWorkspace()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ fileId, filePath }: { fileId: string; filePath: string }) =>
      fileService.delete(activeCompanyId!, fileId, filePath),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['files', entityType, entityId] }),
  })
}
