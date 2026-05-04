'use client'

import {
  useState,
  useRef,
  useCallback,
  DragEvent,
  ChangeEvent,
} from 'react'
import { cn } from '@/lib/utils'

// ─── TYPES ───────────────────────────────────────────────────────────────────

export type UploadStatus = 'idle' | 'uploading' | 'done' | 'error'

export interface UploadFile {
  id:       string
  file:     File
  preview?: string     // object URL para imagens
  progress: number     // 0–100
  status:   UploadStatus
  error?:   string
}

export interface UploadProps {
  /** Tipos aceitos, ex: "image/*,.pdf" */
  accept?:        string
  /** Tamanho máximo por arquivo em MB */
  maxSizeMB?:     number
  /** Permitir múltiplos arquivos */
  multiple?:      boolean
  /** Texto principal da área de drop */
  label?:         string
  /** Texto de apoio */
  hint?:          string
  /** Chamado sempre que a lista de arquivos válidos muda */
  onFilesChange?: (files: File[]) => void
  /**
   * Função de upload real. Receba o File e um callback de progresso (0–100).
   * Se não fornecida, os arquivos ficam apenas em estado "pronto".
   */
  onUpload?: (
    file: File,
    onProgress: (percent: number) => void,
  ) => Promise<void>
  className?: string
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function uid(): string {
  return Math.random().toString(36).slice(2, 9)
}

function formatBytes(bytes: number): string {
  if (bytes < 1024)        return `${bytes} B`
  if (bytes < 1_048_576)   return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1_048_576).toFixed(1)} MB`
}

function isImageFile(file: File): boolean {
  return file.type.startsWith('image/')
}

// ─── FILE CARD ───────────────────────────────────────────────────────────────

function UploadFileCard({
  item,
  onRemove,
}: {
  item:     UploadFile
  onRemove: (id: string) => void
}) {
  const isDone    = item.status === 'done'
  const isError   = item.status === 'error'
  const isLoading = item.status === 'uploading'

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-md border bg-surface p-3 transition-colors duration-150',
        isError ? 'border-danger-200 bg-danger-50' : 'border-surface-border',
      )}
    >
      {/* Thumbnail ou ícone genérico */}
      {item.preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.preview}
          alt={item.file.name}
          className="h-10 w-10 shrink-0 rounded object-cover"
        />
      ) : (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-surface-subtle">
          <svg
            className="h-5 w-5 text-ink-muted"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
            />
          </svg>
        </span>
      )}

      {/* Info + progress */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-body-sm font-medium text-ink">
          {item.file.name}
        </p>

        <div className="mt-0.5 flex items-center gap-2">
          <span className="text-caption text-ink-muted">
            {formatBytes(item.file.size)}
          </span>

          {isDone && (
            <span className="text-caption font-medium text-success-600">
              ✓ Concluído
            </span>
          )}
          {isError && (
            <span className="text-caption font-medium text-danger-600">
              {item.error ?? 'Erro no upload'}
            </span>
          )}
        </div>

        {/* Barra de progresso durante upload */}
        {isLoading && (
          <div className="progress-track mt-1.5">
            <div
              className="progress-fill transition-all duration-300"
              style={{ width: `${item.progress}%` }}
            />
          </div>
        )}
      </div>

      {/* Botão remover */}
      <button
        type="button"
        onClick={() => onRemove(item.id)}
        aria-label="Remover arquivo"
        disabled={isLoading}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded
                   text-ink-muted transition-colors duration-150
                   hover:bg-danger-50 hover:text-danger-600
                   disabled:cursor-not-allowed disabled:opacity-40"
      >
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
        </svg>
      </button>
    </div>
  )
}

// ─── UPLOAD ──────────────────────────────────────────────────────────────────

export default function Upload({
  accept     = '*',
  maxSizeMB  = 10,
  multiple   = false,
  label      = 'Arraste arquivos aqui ou clique para selecionar',
  hint,
  onFilesChange,
  onUpload,
  className,
}: UploadProps) {
  const [files,      setFiles]      = useState<UploadFile[]>([])
  const [dragOver,   setDragOver]   = useState(false)
  const [dragReject, setDragReject] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const maxBytes = maxSizeMB * 1_048_576

  // ── Processa e enfileira arquivos ──────────────────────────────────────────
  const processFiles = useCallback(
    async (raw: File[]) => {
      const entries: UploadFile[] = raw.map((file) => ({
        id:      uid(),
        file,
        preview: isImageFile(file) ? URL.createObjectURL(file) : undefined,
        progress: 0,
        status:  file.size > maxBytes ? 'error' : 'idle',
        error:   file.size > maxBytes ? `Tamanho excede ${maxSizeMB} MB` : undefined,
      }))

      setFiles((prev) => {
        const next = multiple ? [...prev, ...entries] : entries
        onFilesChange?.(
          next
            .filter((e) => e.status !== 'error')
            .map((e) => e.file),
        )
        return next
      })

      // Upload opcional
      if (!onUpload) return

      for (const entry of entries.filter((e) => e.status === 'idle')) {
        // Marcar como uploading
        setFiles((prev) =>
          prev.map((f) =>
            f.id === entry.id ? { ...f, status: 'uploading', progress: 1 } : f,
          ),
        )

        try {
          await onUpload(entry.file, (percent) => {
            setFiles((prev) =>
              prev.map((f) =>
                f.id === entry.id ? { ...f, progress: percent } : f,
              ),
            )
          })
          setFiles((prev) =>
            prev.map((f) =>
              f.id === entry.id
                ? { ...f, status: 'done', progress: 100 }
                : f,
            ),
          )
        } catch {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === entry.id
                ? { ...f, status: 'error', error: 'Falha no upload. Tente novamente.' }
                : f,
            ),
          )
        }
      }
    },
    [maxBytes, maxSizeMB, multiple, onFilesChange, onUpload],
  )

  // ── Drag handlers ──────────────────────────────────────────────────────────
  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(true)
    setDragReject(false)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragOver(false)
    setDragReject(false)
  }, [])

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setDragOver(false)
      setDragReject(false)
      const raw = Array.from(e.dataTransfer.files)
      if (raw.length) processFiles(raw)
    },
    [processFiles],
  )

  // ── Input handler ──────────────────────────────────────────────────────────
  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const raw = Array.from(e.target.files ?? [])
      if (raw.length) processFiles(raw)
      e.target.value = '' // reset para permitir re-selecionar mesmo arquivo
    },
    [processFiles],
  )

  // ── Remove ─────────────────────────────────────────────────────────────────
  const removeFile = useCallback(
    (id: string) => {
      setFiles((prev) => {
        const next = prev.filter((f) => f.id !== id)
        onFilesChange?.(
          next
            .filter((e) => e.status !== 'error')
            .map((e) => e.file),
        )
        return next
      })
    },
    [onFilesChange],
  )

  return (
    <div className={cn('flex w-full flex-col gap-3', className)}>
      {/* ── Área de drop ──────────────────────────────────────────────────── */}
      <div
        role="button"
        tabIndex={0}
        aria-label={label}
        className={cn(
          'dropzone',
          dragOver   && 'dropzone-active',
          dragReject && 'dropzone-reject',
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            inputRef.current?.click()
          }
        }}
      >
        {/* Ícone */}
        <svg
          className={cn(
            'h-8 w-8 transition-colors duration-150',
            dragOver ? 'text-primary-500' : 'text-ink-faint',
          )}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
          />
        </svg>

        {/* Texto */}
        <div className="space-y-0.5 text-center">
          <p className="text-body-sm font-medium text-ink">{label}</p>
          <p className="text-caption text-ink-muted">
            {hint ?? `Máx. ${maxSizeMB} MB por arquivo${multiple ? ' • múltiplos permitidos' : ''}`}
          </p>
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

      {/* ── Lista de arquivos ─────────────────────────────────────────────── */}
      {files.length > 0 && (
        <ul className="flex flex-col gap-2" role="list" aria-label="Arquivos selecionados">
          {files.map((item) => (
            <li key={item.id}>
              <UploadFileCard item={item} onRemove={removeFile} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/* ─── Usage examples ────────────────────────────────────────────────────────
// Upload de imagem única
<Upload
  accept="image/*"
  maxSizeMB={5}
  label="Foto do aluno"
  hint="PNG, JPG ou WEBP até 5 MB"
  onFilesChange={(files) => setFoto(files[0])}
/>

// Upload múltiplo com progresso real (Supabase)
<Upload
  accept=".pdf,.doc,.docx"
  multiple
  maxSizeMB={20}
  label="Documentos do processo"
  onFilesChange={setDocumentos}
  onUpload={async (file, onProgress) => {
    const { error } = await supabase.storage
      .from('documentos')
      .upload(`processos/${file.name}`, file, {
        onUploadProgress: ({ loaded, total }) =>
          onProgress(Math.round((loaded / total) * 100)),
      })
    if (error) throw error
  }}
/>
─────────────────────────────────────────────────────────────────────────── */
