import { useQuery } from '@tanstack/react-query'
import { useWorkspace } from '@/features/workspace'
import { auditLogService } from '../service/auditLogService'

export function useContractAuditLog(contractId: string | null) {
  const { activeCompanyId } = useWorkspace()
  return useQuery({
    queryKey: ['audit_logs', 'contracts', contractId],
    queryFn: () => auditLogService.listForRecord(activeCompanyId!, 'contracts', contractId!),
    enabled: !!activeCompanyId && !!contractId,
  })
}
