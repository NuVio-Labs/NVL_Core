import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useWorkspace } from './useWorkspace'
import { companyService } from '../service/companyService'

const QUERY_KEY = (companyId: string) => ['company_settings', companyId]

export function useCompanySettings() {
  const { activeCompanyId, activeCompany } = useWorkspace()

  const { data } = useQuery({
    queryKey: QUERY_KEY(activeCompanyId ?? ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('settings')
        .eq('id', activeCompanyId!)
        .single()
      if (error) throw error
      return (data.settings ?? {}) as Record<string, unknown>
    },
    enabled: !!activeCompanyId,
    placeholderData: activeCompany
      ? (activeCompany.settings ?? {}) as Record<string, unknown>
      : undefined,
  })

  return data ?? {}
}

export function useUpdateCompanySettings() {
  const { activeCompanyId } = useWorkspace()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (patch: Record<string, unknown>) =>
      companyService.updateSettings(activeCompanyId!, patch),
    onMutate: async (patch) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY(activeCompanyId ?? '') })
      const previous = queryClient.getQueryData<Record<string, unknown>>(QUERY_KEY(activeCompanyId ?? ''))
      queryClient.setQueryData(QUERY_KEY(activeCompanyId ?? ''), (old: Record<string, unknown> = {}) => ({
        ...old,
        ...patch,
      }))
      return { previous }
    },
    onError: (_err, _patch, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(QUERY_KEY(activeCompanyId ?? ''), context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY(activeCompanyId ?? '') })
    },
  })
}
