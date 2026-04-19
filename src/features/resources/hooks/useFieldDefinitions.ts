import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useWorkspace } from '@/features/workspace'
import { fieldDefinitionService } from '../service/fieldDefinitionService'
import type { ResourceFieldDefinitionInsert, ResourceFieldDefinitionUpdate } from '../types'

const QUERY_KEY = (companyId: string) => ['resource_field_definitions', companyId]

export function useFieldDefinitions() {
  const { activeCompanyId } = useWorkspace()

  return useQuery({
    queryKey: QUERY_KEY(activeCompanyId ?? ''),
    queryFn: () => fieldDefinitionService.getAll(activeCompanyId!),
    enabled: !!activeCompanyId,
  })
}

export function useCreateFieldDefinition() {
  const queryClient = useQueryClient()
  const { activeCompanyId } = useWorkspace()

  return useMutation({
    mutationFn: (payload: Omit<ResourceFieldDefinitionInsert, 'company_id'>) =>
      fieldDefinitionService.create({ ...payload, company_id: activeCompanyId! }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY(activeCompanyId ?? '') })
    },
  })
}

export function useUpdateFieldDefinition() {
  const queryClient = useQueryClient()
  const { activeCompanyId } = useWorkspace()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ResourceFieldDefinitionUpdate }) =>
      fieldDefinitionService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY(activeCompanyId ?? '') })
    },
  })
}

export function useDeleteFieldDefinition() {
  const queryClient = useQueryClient()
  const { activeCompanyId } = useWorkspace()

  return useMutation({
    mutationFn: (id: string) => fieldDefinitionService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY(activeCompanyId ?? '') })
    },
  })
}
