import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { workflowConfigurationApi, type WorkflowConfigPayload } from './api'

const listKey = ['workflowConfigurationApi.getWorkflowConfiguration']

export function useGetWorkflowConfiguration() {
  return useQuery({
    queryFn: () => workflowConfigurationApi.getWorkflowConfiguration(),
    queryKey: listKey,
  })
}

export function useCreateWorkflowConfiguration() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: WorkflowConfigPayload) => workflowConfigurationApi.createWorkflowConfiguration(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: listKey }),
  })
}

export function useUpdateWorkflowConfiguration() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: WorkflowConfigPayload & { id: string }) =>
      workflowConfigurationApi.updateWorkflowConfiguration(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: listKey }),
  })
}

export function useDeactivateWorkflowConfiguration() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id }: { id: string }) => workflowConfigurationApi.deactivateWorkflowConfiguration({ id }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: listKey }),
  })
}
