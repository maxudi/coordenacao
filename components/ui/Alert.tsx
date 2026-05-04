import { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

// ─── ALERT ───────────────────────────────────────────────────────────────────

type AlertVariant = 'info' | 'success' | 'warning' | 'danger'

interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant:      AlertVariant
  title?:       string
  description?: string
  onDismiss?:   () => void
}

const alertClass: Record<AlertVariant, string> = {
  info:    'alert-info',
  success: 'alert-success',
  warning: 'alert-warning',
  danger:  'alert-danger',
}

const AlertIcon = ({ variant }: { variant: AlertVariant }) => {
  const paths: Record<AlertVariant, string> = {
    info:    'M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z',
    success: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    warning: 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z',
    danger:  'M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z',
  }

  return (
    <svg
      className="alert-icon"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d={paths[variant]} />
    </svg>
  )
}

function Alert({
  variant,
  title,
  description,
  onDismiss,
  className,
  children,
  ...props
}: AlertProps) {
  return (
    <div
      className={cn(alertClass[variant], className)}
      role={variant === 'danger' ? 'alert' : 'status'}
      {...props}
    >
      <AlertIcon variant={variant} />

      <div className="flex-1 min-w-0">
        {title       && <p className="alert-title">{title}</p>}
        {description && <p className="alert-desc">{description}</p>}
        {children}
      </div>

      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Fechar"
          className="ml-2 shrink-0 h-5 w-5 flex items-center justify-center rounded
                     opacity-60 hover:opacity-100 transition-opacity"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        </button>
      )}
    </div>
  )
}

// ─── BADGE ───────────────────────────────────────────────────────────────────

type BadgeVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'neutral'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  dot?:     boolean
}

const badgeClass: Record<BadgeVariant, string> = {
  primary:   'badge-primary',
  secondary: 'badge-secondary',
  success:   'badge-success',
  danger:    'badge-danger',
  warning:   'badge-warning',
  neutral:   'badge-neutral',
}

const dotColor: Record<BadgeVariant, string> = {
  primary:   'bg-primary-500',
  secondary: 'bg-secondary-500',
  success:   'bg-success-500',
  danger:    'bg-danger-500',
  warning:   'bg-warning-500',
  neutral:   'bg-ink-faint',
}

function Badge({ variant = 'neutral', dot = false, className, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeClass[variant], className)} {...props}>
      {dot && (
        <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', dotColor[variant])} />
      )}
      {children}
    </span>
  )
}

export { Alert, Badge }

/* ─── Usage examples ────────────────────────────────────────────────────────
<Alert variant="success" title="Salvo com sucesso" description="As alterações foram salvas." />
<Alert variant="danger"  title="Erro ao salvar" description="Verifique os campos e tente novamente." />
<Alert variant="warning" title="Atenção" description="Este aluno possui pendências." onDismiss={() => setShow(false)} />
<Alert variant="info"    title="Dica" description="Você pode importar alunos em lote via CSV." />

<Badge variant="success" dot>Ativo</Badge>
<Badge variant="danger">Inativo</Badge>
<Badge variant="warning">Pendente</Badge>
<Badge variant="neutral">Rascunho</Badge>
─────────────────────────────────────────────────────────────────────────── */
