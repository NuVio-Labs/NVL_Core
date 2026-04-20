import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import SignaturePadLib from 'signature_pad'

export interface SignaturePadHandle {
  getDataUrl: () => string | null
  isEmpty: () => boolean
  clear: () => void
}

interface Props {
  label: string
  width?: number
  height?: number
}

export const SignaturePad = forwardRef<SignaturePadHandle, Props>(
  ({ label, width = 400, height = 150 }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const padRef = useRef<SignaturePadLib | null>(null)

    useEffect(() => {
      if (!canvasRef.current) return
      const canvas = canvasRef.current
      const ratio = Math.max(window.devicePixelRatio || 1, 1)
      canvas.width = canvas.offsetWidth * ratio
      canvas.height = canvas.offsetHeight * ratio
      canvas.getContext('2d')?.scale(ratio, ratio)
      padRef.current = new SignaturePadLib(canvas, {
        backgroundColor: 'rgb(255,255,255)',
        penColor: 'rgb(0,0,0)',
      })
      return () => padRef.current?.off()
    }, [])

    useImperativeHandle(ref, () => ({
      getDataUrl: () => {
        if (!padRef.current || padRef.current.isEmpty()) return null
        return padRef.current.toDataURL('image/png')
      },
      isEmpty: () => padRef.current?.isEmpty() ?? true,
      clear: () => padRef.current?.clear(),
    }))

    return (
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <div className="border border-border rounded-md bg-white overflow-hidden" style={{ width, height }}>
          <canvas ref={canvasRef} style={{ width: '100%', height: '100%', touchAction: 'none' }} />
        </div>
        <button
          type="button"
          onClick={() => padRef.current?.clear()}
          className="text-xs text-muted-foreground underline text-left w-fit"
        >
          Zurücksetzen
        </button>
      </div>
    )
  }
)

SignaturePad.displayName = 'SignaturePad'
