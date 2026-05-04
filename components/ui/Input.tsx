import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

// ─── TYPES ───────────────────────────────────────────────────────────────────

export type InputSize   = 'sm' | 'md' | 'lg'
export type InputStatus = 'default' | 'error' | 'success'

export interface BaseFieldProps {
  label?:      string
  required?:   boolean
  helperText?: string
  errorText?:  string
  status?:     InputStatus
}

// ─── SIZE MAP ────────────────────────────────────────────────────────────────

const sizeClass: Record<InputSize, string> = {
  sm: 'input-sm',
  md: 'input-md',
  lg: 'input-lg',
}

const statusClass: Record<InputStatus, string> = {
  default: '',
  error:   'input-error',
  success: 'input-success',
}

// ─── INPUT ───────────────────────────────────────────────────────────────────

export interface InputProps
  extends InputHTMLAttributes<HTMLInputElement>,
    BaseFieldProps {
  inputSize?: InputSize
  leftIcon?:  React.ReactNode
  rightIcon?: React.ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      required,
      helperText,
      errorText,
      status    = 'default',
      inputSize = 'md',
      leftIcon,
      rightIcon,
      className,
      id,
      ...props
    },
    ref,
  ) => {
    const fieldId        = id ?? `input-${Math.random().toString(36).slice(2, 7)}`
    const resolvedStatus = errorText ? 'error' : status

    return (
      <div className="flex flex-col w-full">
        {label && (
          <label
            htmlFor={fieldId}
            className={cn('input-label', required && 'input-label-required')}
          >
            {label}
          </label>
        )}

        <div className="input-group">
          {leftIcon && (
            <span className="input-group-icon-left">{leftIcon}</span>
          )}
          <input
            ref={ref}
            id={fieldId}
            className={cn(
              'input-base',
              sizeClass[inputSize],
              statusClass[resolvedStatus],
              leftIcon  && 'input-with-icon-left',
              rightIcon && 'input-with-icon-right',
              className,
            )}
            aria-invalid={resolvedStatus === 'error'}
            aria-describedby={
              errorText  ? `${fieldId}-error`  :
              helperText ? `${fieldId}-helper` : undefined
            }
            {...props}
          />
          {rightIcon && (
            <span className="input-group-icon-right">{rightIcon}</span>
          )}
        </div>

        {errorText && (
          <span
            id={`${fieldId}-error`}
            className="input-error-msg"
            role="alert"
          >
            {errorText}
          </span>
        )}
        {!errorText && helperText && (
          <span id={`${fieldId}-helper`} className="input-helper">
            {helperText}
          </span>
        )}
      </div>
    )
  },
)

Input.displayName = 'Input'

// ─── TEXTAREA ────────────────────────────────────────────────────────────────

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement>,
    BaseFieldProps {}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      required,
      helperText,
      errorText,
      status  = 'default',
      className,
      id,
      ...props
    },
    ref,
  ) => {
    const fieldId        = id ?? `textarea-${Math.random().toString(36).slice(2, 7)}`
    const resolvedStatus = errorText ? 'error' : status

    return (
      <div className="flex flex-col w-full">
        {label && (
          <label
            htmlFor={fieldId}
            className={cn('input-label', required && 'input-label-required')}
          >
            {label}
          </label>
        )}

        <textarea
          ref={ref}
          id={fieldId}
          className={cn(
            'textarea-base',
            resolvedStatus === 'error'   && 'input-error',
            resolvedStatus === 'success' && 'input-success',
            className,
          )}
          aria-invalid={resolvedStatus === 'error'}
          aria-describedby={
            errorText  ? `${fieldId}-error`  :
            helperText ? `${fieldId}-helper` : undefined
          }
          {...props}
        />

        {errorText && (
          <span
            id={`${fieldId}-error`}
            className="input-error-msg"
            role="alert"
          >
            {errorText}
          </span>
        )}
        {!errorText && helperText && (
          <span id={`${fieldId}-helper`} className="input-helper">
            {helperText}
          </span>
        )}
      </div>
    )
  },
)

Textarea.displayName = 'Textarea'

export { Input, Textarea }
export default Input

/* ─── Usage examples ────────────────────────────────────────────────────────
// Input básico
<Input label="Nome" required placeholder="Digite o nome completo" />

// Com ícone
<Input
  label="E-mail"
  type="email"
  leftIcon={<MailIcon className="h-4 w-4" />}
  placeholder="voce@escola.com"
/>

// Com erro
<Input
  label="CPF"
  errorText="CPF inválido"
  value={cpf}
  onChange={(e) => setCpf(e.target.value)}
/>

// Desabilitado
<Input label="Código" value="ALU-001" disabled />

// Textarea
<Textarea
  label="Observações"
  helperText="Máx. 500 caracteres"
  placeholder="Descreva..."
  rows={4}
/>
─────────────────────────────────────────────────────────────────────────── */
