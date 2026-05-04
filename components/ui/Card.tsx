import { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

// ─── TYPES ───────────────────────────────────────────────────────────────────

type CardVariant = 'default' | 'flat' | 'elevated' | 'interactive'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant
}

interface CardStatProps extends HTMLAttributes<HTMLDivElement> {
  label:    string
  value:    string | number
  change?:  string
  trend?:   'up' | 'down' | 'neutral'
  icon?:    React.ReactNode
}

// ─── BASE ────────────────────────────────────────────────────────────────────

const variantClass: Record<CardVariant, string> = {
  default:     'card',
  flat:        'card-flat',
  elevated:    'card-elevated',
  interactive: 'card-interactive',
}

function Card({ variant = 'default', className, children, ...props }: CardProps) {
  return (
    <div className={cn(variantClass[variant], className)} {...props}>
      {children}
    </div>
  )
}

// ─── SUB-COMPONENTS ──────────────────────────────────────────────────────────

function CardHeader({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('card-header', className)} {...props}>
      {children}
    </div>
  )
}

function CardBody({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('card-body', className)} {...props}>
      {children}
    </div>
  )
}

function CardFooter({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('card-footer', className)} {...props}>
      {children}
    </div>
  )
}

// ─── STAT CARD ───────────────────────────────────────────────────────────────

function CardStat({ label, value, change, trend = 'neutral', icon, className, ...props }: CardStatProps) {
  const changeClass =
    trend === 'up'   ? 'card-stat-change-up'   :
    trend === 'down' ? 'card-stat-change-down' :
    'card-stat-change text-ink-muted'

  return (
    <div className={cn('card-stat', className)} {...props}>
      <div className="flex items-center justify-between">
        <span className="card-stat-label">{label}</span>
        {icon && (
          <span className="h-8 w-8 flex items-center justify-center rounded-md bg-primary-50 text-primary-600">
            {icon}
          </span>
        )}
      </div>
      <span className="card-stat-value">{value}</span>
      {change && <span className={changeClass}>{change}</span>}
    </div>
  )
}

// ─── EXPORTS ─────────────────────────────────────────────────────────────────

Card.Header = CardHeader
Card.Body   = CardBody
Card.Footer = CardFooter
Card.Stat   = CardStat

export default Card

/* ─── Usage examples ────────────────────────────────────────────────────────
// Card com seções
<Card>
  <Card.Header>
    <h3 className="text-heading font-semibold">Título</h3>
  </Card.Header>
  <Card.Body>Conteúdo</Card.Body>
  <Card.Footer>
    <Button variant="outline" size="sm">Cancelar</Button>
    <Button size="sm">Salvar</Button>
  </Card.Footer>
</Card>

// Card clicável
<Card variant="interactive" onClick={() => router.push('/turma/1')}>
  <Card.Body>...</Card.Body>
</Card>

// Stat card
<Card.Stat
  label="Alunos matriculados"
  value="248"
  change="↑ 12 este mês"
  trend="up"
  icon={<UsersIcon className="h-4 w-4" />}
/>
─────────────────────────────────────────────────────────────────────────── */
