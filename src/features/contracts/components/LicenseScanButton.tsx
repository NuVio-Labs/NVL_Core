import { useRef, useState } from 'react'
import { ScanLine, Loader2, AlertCircle, ShieldCheck } from 'lucide-react'

// Camera-only: on desktop (no touch) we block upload and show a hint
const isMobileDevice = () => typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0
import { supabase } from '@/lib/supabase'

export interface ScannedLicenseData {
  last_name?: string
  first_name?: string
  date_of_birth?: string
  license_number?: string
  license_class?: string
  street?: string
  city?: string
}

interface Props {
  onResult: (data: ScannedLicenseData, mode: 'license_front' | 'id_back') => void
  disabled?: boolean
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // Entferne "data:image/...;base64," Präfix
      resolve(result.split(',')[1])
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function callOcrEdgeFunction(file: File, mode: 'license_front' | 'id_back'): Promise<ScannedLicenseData> {
  const base64 = await fileToBase64(file)
  const { data, error } = await supabase.functions.invoke('ocr-license', {
    body: { image_base64: base64, mime_type: file.type, mode },
  })
  if (error) {
    // Versuche den response body zu lesen für bessere Fehlermeldung
    const detail = (error as { context?: { text?: () => Promise<string> } }).context?.text
      ? await (error as { context: { text: () => Promise<string> } }).context.text()
      : error.message
    throw new Error(detail)
  }
  if (data?.error) throw new Error(data.error)
  return data as ScannedLicenseData
}

interface ScanButtonProps {
  label: string
  mode: 'license_front' | 'id_back'
  consented: boolean
  onResult: (data: ScannedLicenseData, mode: 'license_front' | 'id_back') => void
  disabled?: boolean
}

function SingleScanButton({ label, mode, consented, onResult, disabled }: ScanButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isMobile = isMobileDevice()

  async function handleFile(file: File) {
    setError(null)
    setLoading(true)
    try {
      const parsed = await callOcrEdgeFunction(file, mode)
      onResult(parsed, mode)
      if (Object.values(parsed).filter(Boolean).length === 0)
        setError('Keine Felder erkannt — bitte manuell prüfen.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Scannen.')
    } finally {
      setLoading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        {...(isMobile ? { capture: 'environment' } : {})}
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
      />
      <button
        type="button"
        disabled={disabled || loading || !consented}
        onClick={() => inputRef.current?.click()}
        className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md border border-blue-300 text-blue-700 hover:bg-blue-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanLine className="w-4 h-4" />}
        {loading ? 'Wird erkannt…' : label}
      </button>
      {error && (
        <div className="flex items-center gap-1.5 text-xs text-amber-700">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </div>
      )}
    </div>
  )
}

export function LicenseScanButton({ onResult, disabled }: Props) {
  const [consented, setConsented] = useState(false)

  return (
    <div className="col-span-full space-y-3 border border-blue-200 bg-blue-50 rounded-md px-4 py-3">
      <div className="flex items-start gap-2 text-xs text-blue-700">
        <ScanLine className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span>
          <strong>Dokumente scannen (KI):</strong> Fotos werden zur Texterkennung einmalig an OpenAI übertragen und nicht gespeichert. Nur die extrahierten Felder werden übernommen.
        </span>
      </div>

      <label className="flex items-start gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={consented}
          onChange={e => setConsented(e.target.checked)}
          className="mt-0.5 w-4 h-4 rounded border-border"
        />
        <span className="text-xs text-foreground">
          Ich willige ein, dass die Dokumentenfotos zur automatischen Felderkennung einmalig an OpenAI übertragen werden. Die Bilder werden nicht gespeichert.
        </span>
      </label>

      <div className="flex flex-wrap gap-3">
        <SingleScanButton
          label="Führerschein (Vorderseite)"
          mode="license_front"
          consented={consented}
          onResult={onResult}
          disabled={disabled}
        />
        <SingleScanButton
          label="Ausweis Rückseite (Adresse)"
          mode="id_back"
          consented={consented}
          onResult={onResult}
          disabled={disabled}
        />
      </div>
    </div>
  )
}
