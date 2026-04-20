import { useCompanySettings } from '@/features/workspace'

export function useFeatureOcrScan(): boolean {
  const settings = useCompanySettings()
  return settings.feature_ocr_scan === true
}
