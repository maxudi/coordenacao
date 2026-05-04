import { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

// ─── SKELETON ────────────────────────────────────────────────────────────────

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'heading' | 'avatar' | 'button' | 'block'
  /** Sobrescreve largura para variant='text'/'heading'/'button' */
  width?: string
}

function Skeleton({ variant = 'block', width, className, ...props }: SkeletonProps) {
  const base = 'skeleton'

  const variantClass: Record<string, string> = {
    text:    'skeleton-text',
    heading: 'skeleton-heading',
    avatar:  'skeleton-avatar',
    button:  'skeleton-btn',
    block:   'skeleton',
  }

  return (
    <div
      className={cn(variantClass[variant], width, className)}
      aria-hidden="true"
      {...props}
    />
  )
}

/** Linha de skeleton para imitar uma linha de texto */
function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-2', className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          className={i === lines - 1 ? 'w-2/3' : 'w-full'}
        />
      ))}
    </div>
  )
}

/** Linha de skeleton para imitar uma linha de tabela */
function SkeletonRow({ columns = 4, className }: { columns?: number; className?: string }) {
  return (
    <div className={cn('flex items-center gap-4 py-3 px-6', className)} aria-hidden="true">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} className="h-4 flex-1" />
      ))}
    </div>
  )
}

// ─── AVATAR ──────────────────────────────────────────────────────────────────

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

interface AvatarProps {
  name?:      string   // para gerar iniciais
  src?:       string   // URL da imagem
  size?:      AvatarSize
  className?: string
}

const sizeClass: Record<AvatarSize, string> = {
  xs: 'avatar-xs',
  sm: 'avatar-sm',
  md: 'avatar-md',
  lg: 'avatar-lg',
  xl: 'avatar-xl',
}

/** Gera iniciais a partir de um nome completo */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/** Gera cor HSL determinística a partir do nome */
function nameToColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  const h = Math.abs(hash) % 360
  return `hsl(${h}, 55%, 40%)`
}

function Avatar({ name = '', src, size = 'md', className }: AvatarProps) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name || 'Avatar'}
        className={cn('avatar object-cover', sizeClass[size], className)}
      />
    )
  }

  return (
    <span
      className={cn('avatar', sizeClass[size], className)}
      style={{ background: nameToColor(name) }}
      title={name}
      aria-label={name}
    >
      {name ? getInitials(name) : '?'}
    </span>
  )
}

// ─── SPINNER ─────────────────────────────────────────────────────────────────

type SpinnerSize = 'sm' | 'md' | 'lg'

interface SpinnerProps {
  size?:      SpinnerSize
  className?: string
}

const spinnerSize: Record<SpinnerSize, string> = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-8 w-8 border-[3px]',
}

function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <span
      className={cn(
        'block rounded-full border-primary-200 border-t-primary-600 animate-spin',
        spinnerSize[size],
        className,
      )}
      role="status"
      aria-label="Carregando"
    />
  )
}

// ─── PROGRESS ────────────────────────────────────────────────────────────────

interface ProgressProps {
  value:      number   // 0–100
  variant?:   'default' | 'success' | 'danger'
  showLabel?: boolean
  className?: string
}

const fillVariant: Record<string, string> = {
  default: 'progress-fill',
  success: 'progress-fill-success',
  danger:  'progress-fill-danger',
}

function Progress({ value, variant = 'default', showLabel = false, className }: ProgressProps) {
  const clamped = Math.min(100, Math.max(0, value))

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="progress-track flex-1" role="progressbar" aria-valuenow={clamped} aria-valuemin={0} aria-valuemax={100}>
        <div
          className={fillVariant[variant]}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-caption text-ink-muted tabular-nums w-9 text-right">
          {clamped}%
        </span>
      )}
    </div>
  )
}

export { Skeleton, SkeletonText, SkeletonRow, Avatar, Spinner, Progress }

/* ─── Usage examples ────────────────────────────────────────────────────────
<Skeleton variant="heading" />
<Skeleton variant="text" />
<SkeletonText lines={4} />
<SkeletonRow columns={5} />

<Avatar name="Ana Lima" size="md" />
<Avatar src="/foto.jpg" name="João Silva" size="lg" />

<Spinner size="md" />

<Progress value={72} showLabel />
<Progress value={100} variant="success" showLabel />
<Progress value={30} variant="danger" showLabel />
─────────────────────────────────────────────────────────────────────────── */
