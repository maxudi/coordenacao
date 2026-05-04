import { forwardRef, ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'outline' | 'outline-primary' | 'outline-danger' | 'ghost'
type ButtonSize    = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:   ButtonVariant
  size?:      ButtonSize
  isLoading?: boolean
  leftIcon?:  React.ReactNode
  rightIcon?: React.ReactNode
}

const variantClass: Record<ButtonVariant, string> = {
  primary:         'btn-primary',
  secondary:       'btn-secondary',
  success:         'btn-success',
  danger:          'btn-danger',
  warning:         'btn-warning',
  outline:         'btn-outline',
  'outline-primary': 'btn-outline-primary',
  'outline-danger':  'btn-outline-danger',
  ghost:           'btn-ghost',
}

const sizeClass: Record<ButtonSize, string> = {
  xs: 'btn-xs',
  sm: 'btn-sm',
  md: 'btn-md',
  lg: 'btn-lg',
  xl: 'btn-xl',
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant   = 'primary',
      size      = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'btn',
          variantClass[variant],
          sizeClass[size],
          isLoading && 'btn-loading',
          className,
        )}
        {...props}
      >
        {!isLoading && leftIcon && (
          <span className="h-4 w-4 shrink-0">{leftIcon}</span>
        )}
        {children}
        {!isLoading && rightIcon && (
          <span className="h-4 w-4 shrink-0">{rightIcon}</span>
        )}
      </button>
    )
  },
)

Button.displayName = 'Button'
export default Button

/* ─── Usage examples ────────────────────────────────────────────────────────
<Button>Salvar</Button>
<Button variant="outline">Cancelar</Button>
<Button variant="danger">Excluir</Button>
<Button variant="ghost" size="sm">Ver mais</Button>
<Button isLoading>Salvando...</Button>
<Button leftIcon={<PlusIcon />}>Adicionar</Button>
─────────────────────────────────────────────────────────────────────────── */
