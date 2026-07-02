import { useRef, useState } from 'react'
import { Upload, Trash2, FileText, Image, Download, Loader2 } from 'lucide-react'
import { useFiles, useUploadFile, useDeleteFile } from '../hooks/useFiles'
import { fileService } from '../service/fileService'
import { useConfirm } from '@/components/ConfirmDialog'
import type { EntityType, CompanyFile } from '../types'

interface Props {
  entityType: EntityType
  entityId: string
  readonly?: boolean
}

function FileIcon({ mime }: { mime: string | null }) {
  if (mime?.startsWith('image/')) return <Image className="w-4 h-4 text-blue-500 shrink-0" />
  return <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
}

function formatBytes(b: number | null) {
  if (!b) return ''
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`
  return `${(b / (1024 * 1024)).toFixed(1)} MB`
}

function FileRow({ file, onDelete, readonly }: { file: CompanyFile; onDelete: () => void; readonly?: boolean }) {
  const [loadingUrl, setLoadingUrl] = useState(false)

  async function openFile() {
    setLoadingUrl(true)
    try {
      const url = await fileService.getSignedUrl(file.file_path)
      window.open(url, '_blank')
    } finally {
      setLoadingUrl(false)
    }
  }

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors group">
      <FileIcon mime={file.mime_type} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{file.label ?? file.file_name}</p>
        <p className="text-xs text-muted-foreground truncate">
          {file.file_name}{file.file_size ? ` · ${formatBytes(file.file_size)}` : ''} · {new Date(file.created_at).toLocaleDateString('de-DE')}
        </p>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={openFile}
          disabled={loadingUrl}
          className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          title="Öffnen / Herunterladen"
        >
          {loadingUrl ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
        </button>
        {!readonly && (
          <button
            onClick={onDelete}
            className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-destructive"
            title="Löschen"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}

export function FileManager({ entityType, entityId, readonly }: Props) {
  const { data: files = [], isLoading } = useFiles(entityType, entityId)
  const upload = useUploadFile(entityType, entityId)
  const deleteFile = useDeleteFile(entityType, entityId)
  const confirm = useConfirm()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFiles(list: FileList | null) {
    if (!list) return
    setError(null)
    setUploading(true)
    try {
      for (const file of Array.from(list)) {
        await upload.mutateAsync({ file })
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload fehlgeschlagen')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function handleDelete(file: CompanyFile) {
    const ok = await confirm({ message: `„${file.label ?? file.file_name}" wirklich löschen?` })
    if (!ok) return
    deleteFile.mutate({ fileId: file.id, filePath: file.file_path })
  }

  return (
    <div className="space-y-3">
      {!readonly && (
        <div
          className="border-2 border-dashed border-border rounded-lg px-4 py-5 text-center hover:border-primary/50 transition-colors cursor-pointer"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files) }}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
            accept="image/*,.pdf,.doc,.docx"
          />
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            {uploading
              ? <Loader2 className="w-5 h-5 animate-spin" />
              : <Upload className="w-5 h-5" />
            }
            <p className="text-sm">{uploading ? 'Wird hochgeladen…' : 'Dateien hier ablegen oder klicken zum Auswählen'}</p>
            <p className="text-xs">PDF, Bilder, Word · max. 10 MB pro Datei</p>
          </div>
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Laden…</p>
      ) : files.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">Noch keine Dateien hochgeladen.</p>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          {files.map((f) => (
            <FileRow key={f.id} file={f} onDelete={() => handleDelete(f)} readonly={readonly} />
          ))}
        </div>
      )}
    </div>
  )
}
