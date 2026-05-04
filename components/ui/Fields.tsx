import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

// ─── TYPES ───────────────────────────────────────────────────────────────────

type InputSize   = 'sm' | 'md' | 'lg'
type InputStatus = 'default' | 'error' | 'success'

interface BaseFieldProps {
  label?:      string
  required?:   boolean
  helperText?: string
  errorText?:  string
  status?:     InputStatus
}

// ─── INPUT ───────────────────────────────────────────────────────────────────

interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    BaseFieldProps {
  inputSize?:  InputSize
  leftIcon?:   React.ReactNode
  rightIcon?:  React.ReactNode
}

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
    const fieldId     = id ?? `input-${Math.random().toString(36).slice(2, 7)}`
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
          <span id={`${fieldId}-error`} className="input-error-msg" role="alert">
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

// ─── SELECT ──────────────────────────────────────────────────────────────────

interface SelectOption {
  value: string | number
  label: string
  disabled?: boolean
}

interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement>,
    BaseFieldProps {
  options:    SelectOption[]
  inputSize?: InputSize
  placeholder?: string
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      required,
      helperText,
      errorText,
      status      = 'default',
      inputSize   = 'md',
      options,
      placeholder,
      className,
      id,
      ...props
    },
    ref,
  ) => {
    const fieldId        = id ?? `select-${Math.random().toString(36).slice(2, 7)}`
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

        <select
          ref={ref}
          id={fieldId}
          className={cn(
            'select-base',
            sizeClass[inputSize],
            statusClass[resolvedStatus],
            className,
          )}
          aria-invalid={resolvedStatus === 'error'}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>

        {errorText && (
          <span className="input-error-msg" role="alert">
            {errorText}
          </span>
        )}
        {!errorText && helperText && (
          <span className="input-helper">{helperText}</span>
        )}
      </div>
    )
  },
)

Select.displayName = 'Select'

// ─── TEXTAREA ────────────────────────────────────────────────────────────────

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
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
            statusClass[resolvedStatus],
            className,
          )}
          aria-invalid={resolvedStatus === 'error'}
          {...props}
        />

        {errorText && (
          <span className="input-error-msg" role="alert">
            {errorText}
          </span>
        )}
        {!errorText && helperText && (
          <span className="input-helper">{helperText}</span>
        )}
      </div>
    )
  },
)

Textarea.displayName = 'Textarea'

export { Input, Select, Textarea }

/* ─── Usage examples ────────────────────────────────────────────────────────
<Input label="Nome" required placeholder="Digite o nome" />
<Input label="E-mail" errorText="E-mail inválido" status="error" />
<Input label="Senha" inputSize="lg" rightIcon={<EyeIcon />} type="password" />

<Select
  label="Turma"
  placeholder="Selecione..."
  options={[{ value: '1', label: '1º Ano A' }]}
/>

<Textarea label="Observações" helperText="Máx. 500 caracteres" rows={4} />
─────────────────────────────────────────────────────────────────────────── */
