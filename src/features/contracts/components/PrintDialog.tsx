import { useRef, useState } from 'react'
import { X, Printer, Download, Loader2 } from 'lucide-react'
import { SignaturePad, type SignaturePadHandle } from './SignaturePad'
import { generateContractPdf } from '../service/contractPdfService'
import type { ContractWithDetails } from '../types'

interface Props {
  contract: ContractWithDetails
  onClose: () => void
}

export function PrintDialog({ contract, onClose }: Props) {
  const renter1Ref = useRef<SignaturePadHandle>(null)
  const renter2Ref = useRef<SignaturePadHandle>(null)
  const lessorRef = useRef<SignaturePadHandle>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hasSecondRenter = !!contract.second_renter

  async function buildPdf() {
    setError(null)
    setLoading(true)
    try {
      const bytes = await generateContractPdf(contract, {
        renter1: renter1Ref.current?.getDataUrl() ?? null,
        renter2: hasSecondRenter ? (renter2Ref.current?.getDataUrl() ?? null) : null,
        lessor: lessorRef.current?.getDataUrl() ?? null,
      })
      return bytes
    } catch (e) {
      setError(e instanceof Error ? e.message : 'PDF-Generierung fehlgeschlagen')
      return null
    } finally {
      setLoading(false)
    }
  }

  async function handlePrint() {
    const bytes = await buildPdf()
    if (!bytes) return
    const blob = new Blob([bytes], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const win = window.open(url, '_blank')
    win?.addEventListener('load', () => {
      win.print()
      setTimeout(() => URL.revokeObjectURL(url), 10000)
    })
  }

  async function handleDownload() {
    const bytes = await buildPdf()
    if (!bytes) return
    const blob = new Blob([bytes], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Mietvertrag-${String(contract.contract_number).padStart(4, '0')}.pdf`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 5000)
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 bg-background border border-border rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div>
            <h2 className="text-lg font-semibold">Vertrag drucken</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Vertrag #{String(contract.contract_number).padStart(4, '0')} — {contract.first_name} {contract.last_name}
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">
          <p className="text-sm text-muted-foreground">
            Bitte alle Unterschriften einholen und dann drucken oder herunterladen.
          </p>

          <div className="flex flex-col gap-6">
            <SignaturePad ref={renter1Ref} label="Unterschrift Mieter (1)" width={520} height={140} />
            {hasSecondRenter && (
              <SignaturePad ref={renter2Ref} label="Unterschrift Mieter (2)" width={520} height={140} />
            )}
            <SignaturePad ref={lessorRef} label="Unterschrift Vermieter" width={520} height={140} />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-md border border-border hover:bg-muted transition-colors"
          >
            Abbrechen
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm rounded-md border border-border hover:bg-muted transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            PDF speichern
          </button>
          <button
            type="button"
            onClick={handlePrint}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
            Drucken
          </button>
        </div>

      </div>
    </div>
  )
}
