import { useRef, useState } from 'react'
import { ScanLine, Loader2, AlertCircle } from 'lucide-react'
import { createWorker } from 'tesseract.js'

export interface ScannedLicenseData {
  last_name?: string
  first_name?: string
  date_of_birth?: string
  license_number?: string
  license_class?: string
}

interface Props {
  onResult: (data: ScannedLicenseData) => void
  disabled?: boolean
}

function parseLicenseText(text: string): ScannedLicenseData {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
  const result: ScannedLicenseData = {}

  // Führerschein-Felder: Nummern können als "1." "1," "1" erkannt werden
  // Zusätzlich: kompletten Text als Fallback durchsuchen
  const fullText = lines.join(' ')

  for (const line of lines) {
    // Feld 1: Nachname — flexibles Matching auf "1." / "1," / "1 "
    if (!result.last_name) {
      const m = line.match(/^[1l|]\s*[.,]?\s*([A-ZÄÖÜ][a-zA-ZäöüÄÖÜß-]+)/)
      if (m) result.last_name = m[1].trim()
    }

    // Feld 2: Vorname
    if (!result.first_name) {
      const m = line.match(/^2\s*[.,]?\s*([A-ZÄÖÜ][a-zA-ZäöüÄÖÜß-]+)/)
      if (m) result.first_name = m[1].trim()
    }

    // Feld 3: Geburtsdatum — DD.MM.YY oder DD.MM.YYYY anywhere in line starting with 3
    if (!result.date_of_birth) {
      const m = line.match(/^3\s*[.,]?\s*(\d{2}[.\-/]\d{2}[.\-/]\d{2,4})/)
      if (m) {
        const parts = m[1].split(/[.\-/]/)
        const year = parts[2].length === 2 ? `19${parts[2]}` : parts[2]
        result.date_of_birth = `${year}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`
      }
    }

    // Feld 5: Führerscheinnummer (alphanumerisch, mind. 6 Zeichen)
    if (!result.license_number) {
      const m = line.match(/^5\s*[.,]?\s*([A-Z0-9]{6,})/i)
      if (m) result.license_number = m[1].trim()
    }

    // Feld 9: Klassen
    if (!result.license_class) {
      const m = line.match(/^9\s*[.,]?\s*([A-Z0-9/,\s]{2,})/i)
      if (m) {
        const raw = m[1].toUpperCase()
        const order = ['CE', 'C1E', 'C1', 'C', 'BE', 'B', 'L', 'T', 'AM', 'A2', 'A1', 'A']
        const found = order.find((cls) => new RegExp(`\\b${cls}\\b`).test(raw) || raw.includes(cls))
        if (found) result.license_class = found
      }
    }
  }

  // Fallback: Datum irgendwo im Text suchen wenn noch nicht gefunden
  if (!result.date_of_birth) {
    const m = fullText.match(/(\d{2})[.\-/](\d{2})[.\-/](\d{2,4})/)
    if (m) {
      const year = m[3].length === 2 ? `19${m[3]}` : m[3]
      result.date_of_birth = `${year}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`
    }
  }

  // Fallback: FS-Nummer irgendwo im Text (Muster: J11003AI222)
  if (!result.license_number) {
    const m = fullText.match(/\b([A-Z]\d{5,}[A-Z0-9]*)\b/)
    if (m) result.license_number = m[1]
  }

  // Fallback: Klassen irgendwo im Text
  if (!result.license_class) {
    const order = ['CE', 'C1E', 'C1', 'C', 'BE', 'B', 'L', 'T', 'AM', 'A2', 'A1', 'A']
    const upper = fullText.toUpperCase()
    const found = order.find((cls) => new RegExp(`\\b${cls}\\b`).test(upper))
    if (found) result.license_class = found
  }

  return result
}

export function LicenseScanButton({ onResult, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(file: File) {
    setError(null)
    setLoading(true)
    try {
      const worker = await createWorker('deu')
      const { data: { text } } = await worker.recognize(file)
      await worker.terminate()

      // Bild sofort freigeben — nie gespeichert
      const parsed = parseLicenseText(text)
      onResult(parsed)
      if (Object.keys(parsed).length === 0) {
        setError('Wenige Felder erkannt — bitte manuell prüfen.')
      }
    } catch {
      setError('OCR fehlgeschlagen. Bitte erneut versuchen.')
    } finally {
      setLoading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="col-span-full">
      <div className="flex items-start gap-2 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-md px-3 py-2 mb-2">
        <ScanLine className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span>
          <strong>Führerschein scannen:</strong> Das Foto wird nur lokal verarbeitet und nicht gespeichert oder übertragen.
        </span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
        }}
      />

      <button
        type="button"
        disabled={disabled || loading}
        onClick={() => inputRef.current?.click()}
        className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md border border-blue-300 text-blue-700 hover:bg-blue-50 transition-colors disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanLine className="w-4 h-4" />}
        {loading ? 'Wird erkannt…' : 'Führerschein scannen'}
      </button>

      {error && (
        <div className="flex items-center gap-1.5 mt-2 text-xs text-amber-700">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </div>
      )}
    </div>
  )
}
