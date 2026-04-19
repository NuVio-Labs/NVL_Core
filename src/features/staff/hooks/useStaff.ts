import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useWorkspace } from '@/features/workspace'
import { staffService } from '../service/staffService'
import type { StaffFieldDefinitionInsert, StaffFieldDefinitionUpdate, StaffMembershipUpdate } from '../types'

const MEMBERS_KEY = (companyId: string) => ['staff_members', companyId]
const FIELDS_KEY = (companyId: string) => ['staff_field_definitions', companyId]

export function useStaffMembers() {
  const { activeCompanyId } = useWorkspace()
  return useQuery({
    queryKey: MEMBERS_KEY(activeCompanyId ?? ''),
    queryFn: () => staffService.getMembers(activeCompanyId!),
    enabled: !!activeCompanyId,
  })
}

export function useUpdateStaffMember() {
  const queryClient = useQueryClient()
  const { activeCompanyId } = useWorkspace()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: StaffMembershipUpdate }) =>
      staffService.updateMember(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: MEMBERS_KEY(activeCompanyId ?? '') }),
  })
}

export function useDeleteStaffMember() {
  const queryClient = useQueryClient()
  const { activeCompanyId } = useWorkspace()
  return useMutation({
    mutationFn: (id: string) => staffService.deleteMember(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: MEMBERS_KEY(activeCompanyId ?? '') }),
  })
}

export function useStaffFieldDefinitions() {
  const { activeCompanyId } = useWorkspace()
  return useQuery({
    queryKey: FIELDS_KEY(activeCompanyId ?? ''),
    queryFn: () => staffService.getFieldDefinitions(activeCompanyId!),
    enabled: !!activeCompanyId,
  })
}

export function useCreateStaffFieldDefinition() {
  const queryClient = useQueryClient()
  const { activeCompanyId } = useWorkspace()
  return useMutation({
    mutationFn: (payload: Omit<StaffFieldDefinitionInsert, 'company_id'>) =>
      staffService.createFieldDefinition({ ...payload, company_id: activeCompanyId! }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: FIELDS_KEY(activeCompanyId ?? '') }),
  })
}

export function useUpdateStaffFieldDefinition() {
  const queryClient = useQueryClient()
  const { activeCompanyId } = useWorkspace()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: StaffFieldDefinitionUpdate }) =>
      staffService.updateFieldDefinition(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: FIELDS_KEY(activeCompanyId ?? '') }),
  })
}

export function useDeleteStaffFieldDefinition() {
  const queryClient = useQueryClient()
  const { activeCompanyId } = useWorkspace()
  return useMutation({
    mutationFn: (id: string) => staffService.deleteFieldDefinition(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: FIELDS_KEY(activeCompanyId ?? '') }),
  })
}
