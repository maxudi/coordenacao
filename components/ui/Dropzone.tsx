'use client'

import { useState, useRef, useCallback, DragEvent, ChangeEvent } from 'react'
import { cn } from '@/lib/utils'

// ─── TYPES ───────────────────────────────────────────────────────────────────

interface DropzoneFile {
  file:     File
  preview?: string   // URL para imagens
  progress: number   // 0–100
  error?:   string
}

interface DropzoneProps {
  accept?:      string         // ex: "image/*,.pdf"
  maxSizeMB?:   number
  multiple?:    boolean
  label?:       string
  hint?:        string
  onFilesChange?: (files: File[]) => void
  /** Simulação de upload (ou lógica real) */
  onUpload?:    (file: File, onProgress: (p: number) => void) => Promise<void>
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function formatSize(bytes: number): string {
  if (bytes < 1024)          return `${bytes} B`
  if (bytes < 1024 * 1024)   return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function isImage(file: File): boolean {
  return file.type.startsWith('image/')
}

// ─── FILE PREVIEW CARD ───────────────────────────────────────────────────────

function FileCard({
  item,
  onRemove,
}: {
  item:     DropzoneFile
  onRemove: () => void
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-md border border-surface-border bg-surface">
      {/* Thumbnail ou ícone */}
      {item.preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.preview}
          alt={item.file.name}
          className="h-10 w-10 rounded object-cover shrink-0"
        />
      ) : (
        <span className="h-10 w-10 flex items-center justify-center rounded bg-surface-subtle shrink-0">
          <svg className="h-5 w-5 text-ink-muted" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        </span>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-body-sm font-medium text-ink truncate">{item.file.name}</p>
        <p className="text-caption text-ink-muted">{formatSize(item.file.size)}</p>

        {/* Progress bar */}
        {item.progress > 0 && item.progress < 100 && (
          <div className="progress-track mt-1.5">
            <div
              className="progress-fill"
              style={{ width: `${item.progress}%` }}
            />
          </div>
        )}

        {/* Error */}
        {item.error && (
          <p className="text-caption text-danger-600 mt-0.5">{item.error}</p>
        )}

        {/* Done */}
        {item.progress === 100 && !item.error && (
          <p className="text-caption text-success-600 mt-0.5">Upload concluído</p>
        )}
      </div>

      {/* Remove */}
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remover arquivo"
        className="h-7 w-7 flex items-center justify-center rounded
                   text-ink-muted hover:text-danger-600 hover:bg-danger-50
                   transition-colors duration-150 shrink-0"
      >
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
        </svg>
      </button>
    </div>
  )
}

// ─── DROPZONE ────────────────────────────────────────────────────────────────

export default function Dropzone({
  accept      = '*',
  maxSizeMB   = 10,
  multiple    = false,
  label       = 'Arraste arquivos aqui ou clique para selecionar',
  hint,
  onFilesChange,
  onUpload,
}: DropzoneProps) {
  const [files,     setFiles]     = useState<DropzoneFile[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [isDragReject, setIsDragReject] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const maxSizeBytes = maxSizeMB * 1024 * 1024

  const addFiles = useCallback(
    async (rawFiles: FileList | File[]) => {
      const list = Array.from(rawFiles)

      const newEntries: DropzoneFile[] = list.map((file) => ({
        file,
        preview: isImage(file) ? URL.createObjectURL(file) : undefined,
        progress: 0,
        error:
          file.size > maxSizeBytes
            ? `Arquivo muito grande (máx. ${maxSizeMB} MB)`
            : undefined,
      }))

      const validEntries = newEntries.filter((e) => !e.error)
      const allEntries   = multiple ? [...files, ...newEntries] : newEntries

      setFiles(allEntries)
      onFilesChange?.(allEntries.filter((e) => !e.error).map((e) => e.file))

      // Disparar upload se callback fornecido
      if (onUpload) {
        for (const entry of validEntries) {
          setFiles((prev) =>
            prev.map((f) => (f.file === entry.file ? { ...f, progress: 1 } : f)),
          )

          try {
            await onUpload(entry.file, (progress) => {
              setFiles((prev) =>
                prev.map((f) => (f.file === entry.file ? { ...f, progress } : f)),
              )
            })
            setFiles((prev) =>
              prev.map((f) => (f.file === entry.file ? { ...f, progress: 100 } : f)),
            )
          } catch {
            setFiles((prev) =>
              prev.map((f) =>
                f.file === entry.file ? { ...f, error: 'Falha no upload. Tente novamente.' } : f,
              ),
            )
          }
        }
      }
    },
    [files, maxSizeBytes, maxSizeMB, multiple, onFilesChange, onUpload],
  )

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setIsDragOver(false)
      setIsDragReject(false)
      if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files)
    },
    [addFiles],
  )

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false)
    setIsDragReject(false)
  }, [])

  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.length) addFiles(e.target.files)
      e.target.value = ''
    },
    [addFiles],
  )

  const removeFile = useCallback(
    (index: number) => {
      setFiles((prev) => {
        const next = prev.filter((_, i) => i !== index)
        onFilesChange?.(next.filter((e) => !e.error).map((e) => e.file))
        return next
      })
    },
    [onFilesChange],
  )

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Drop area */}
      <div
        className={cn(
          'dropzone',
          isDragOver   && 'dropzone-active',
          isDragReject && 'dropzone-reject',
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        aria-label={label}
      >
        <svg
          className="h-8 w-8 text-ink-faint"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>

        <div>
          <p className="text-body-sm font-medium text-ink">{label}</p>
          {hint && <p className="text-caption text-ink-muted mt-0.5">{hint}</p>}
          {!hint && (
            <p className="text-caption text-ink-muted mt-0.5">
              Máx. {maxSizeMB} MB por arquivo
            </p>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={accept}
          multiple={multiple}
          onChange={handleInputChange}
          tabIndex={-1}
        />
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="flex flex-col gap-2">
          {files.map((item, index) => (
            <FileCard
              key={`${item.file.name}-${index}`}
              item={item}
              onRemove={() => removeFile(index)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── Usage examples ────────────────────────────────────────────────────────
// Upload simples
<Dropzone
  accept="image/*"
  maxSizeMB={5}
  label="Arraste a foto do aluno aqui"
  onFilesChange={(files) => setValue('foto', files[0])}
/>

// Com upload real para Supabase
<Dropzone
  accept=".pdf,.doc,.docx"
  multiple
  maxSizeMB={20}
  onFilesChange={(files) => setDocumentos(files)}
  onUpload={async (file, onProgress) => {
    await uploadToSupabase(file, onProgress)
  }}
/>
─────────────────────────────────────────────────────────────────────────── */
