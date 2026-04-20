import { useRef, useState } from 'react'
import { ScanLine, Loader2, X } from 'lucide-react'
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

  for (const line of lines) {
    // Feld 1: Nachname (beginnt mit "1.")
    const nameMatch = line.match(/^1\.\s*(.+)/)
    if (nameMatch) result.last_name = nameMatch[1].trim()

    // Feld 2: Vorname
    const firstMatch = line.match(/^2\.\s*(.+)/)
    if (firstMatch) result.first_name = firstMatch[1].trim()

    // Feld 3: Geburtsdatum DD.MM.YY oder DD.MM.YYYY
    const dobMatch = line.match(/^3\.\s*(\d{2}\.\d{2}\.\d{2,4})/)
    if (dobMatch) {
      const parts = dobMatch[1].split('.')
      const year = parts[2].length === 2 ? `19${parts[2]}` : parts[2]
      result.date_of_birth = `${year}-${parts[1]}-${parts[0]}`
    }

    // Feld 5: Führerscheinnummer
    const numMatch = line.match(/^5\.\s*([A-Z0-9]+)/i)
    if (numMatch) result.license_number = numMatch[1].trim()

    // Feld 9: Klassen (AM/A1/A/B/L/...)
    const classMatch = line.match(/^9\.\s*([A-Z0-9/,\s]+)/i)
    if (classMatch) {
      // Höchste relevante Klasse extrahieren: Reihenfolge CE > C > BE > B
      const raw = classMatch[1].toUpperCase()
      const order = ['CE', 'C1E', 'C1', 'C', 'BE', 'B', 'L', 'T', 'AM', 'A', 'A1', 'A2']
      const found = order.find((cls) => raw.includes(cls))
      if (found) result.license_class = found
    }
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
      if (Object.keys(parsed).length === 0) {
        setError('Keine Felder erkannt. Bitte deutlicheres Foto.')
        return
      }
      onResult(parsed)
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
        <div className="flex items-center gap-1.5 mt-2 text-xs text-destructive">
          <X className="w-3.5 h-3.5" />
          {error}
        </div>
      )}
    </div>
  )
}
