import { useMutation, useQuery } from '@tanstack/vue-query'
import { dataExportApi } from './api'

export function useGenerateExport() {
  return useMutation({
    mutationFn: dataExportApi.generate,
  })
}

export function useGetExportHistory() {
  return useQuery({
    queryFn: dataExportApi.getExportHistory,
    queryKey: ['dataExportApi.getExportHistory'],
    retry: false, // ponytail: history endpoint may not exist yet — fail quietly, list just stays empty
  })
}
