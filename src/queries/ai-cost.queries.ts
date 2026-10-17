import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export type EngineMode = 'stable' | 'lean'
export type LayerMode = 'off' | 'shadow' | 'on'

export interface AceAuditEntry {
  at: string
  adminId: string | null
  field: string
  from: unknown
  to: unknown
}

export interface AceSettings {
  engineMode: EngineMode
  storeOverrides: Record<string, EngineMode>
  overrides: Array<{ storeId: string; mode: EngineMode; store: { id: string; name: string; slug: string } | null }>
  audit: AceAuditEntry[]
  lastChange: AceAuditEntry | null
  layers: Record<string, LayerMode>
  params: Record<string, number>
}

export interface BotChangelogEntry {
  date: string
  item: string
  commit: string
  tag: string
  sql: string
  change: string
  answerImpact: string
  layerKey: string | null
  rollback: string
}

const KEY = ['admin', 'ai-cost'] as const

export function useAceSettings() {
  return useQuery({ queryKey: [...KEY, 'settings'], queryFn: () => api.get<AceSettings>('/admin/ai-cost/settings').then((r) => r.data) })
}

export function useBotChangelog() {
  return useQuery({ queryKey: [...KEY, 'changelog'], queryFn: () => api.get<BotChangelogEntry[]>('/admin/ai-cost/changelog').then((r) => r.data) })
}

export function useAceStoreSearch(q: string) {
  return useQuery({
    queryKey: [...KEY, 'stores', q],
    queryFn: () => api.get<Array<{ id: string; name: string; slug: string }>>('/admin/ai-cost/stores', { params: { q } }).then((r) => r.data),
  })
}

export interface AceSettingsPatch {
  engineMode?: EngineMode
  layers?: Record<string, LayerMode>
  params?: Record<string, number>
  storeOverride?: { storeId: string; mode: EngineMode | null }
}

function useAceMutation<T>(fn: (v: T) => Promise<unknown>) {
  const qc = useQueryClient()
  return useMutation({ mutationFn: fn, onSuccess: () => qc.invalidateQueries({ queryKey: KEY }) })
}

export const useUpdateAceSettings = () => useAceMutation((p: AceSettingsPatch) => api.patch('/admin/ai-cost/settings', p))
export const useEmergencyRevert = () => useAceMutation((_: void) => api.post('/admin/ai-cost/emergency-revert'))
export const useUndoEmergencyRevert = () => useAceMutation((_: void) => api.post('/admin/ai-cost/undo-emergency-revert'))
