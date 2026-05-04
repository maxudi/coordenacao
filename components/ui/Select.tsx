import { forwardRef, SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import type { InputSize, InputStatus, BaseFieldProps } from './Input'

// ─── TYPES ───────────────────────────────────────────────────────────────────

export interface SelectOption {
  value:     string | number
  label:     string
  disabled?: boolean
}

export interface SelectProps
  extends SelectHTMLAttributes<HTMLSelectElement>,
    BaseFieldProps {
  options:      SelectOption[]
  inputSize?:   InputSize
  placeholder?: string
}

// ─── MAPS ────────────────────────────────────────────────────────────────────

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

// ─── SELECT ──────────────────────────────────────────────────────────────────

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
          aria-describedby={
            errorText  ? `${fieldId}-error`  :
            helperText ? `${fieldId}-helper` : undefined
          }
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {(options ?? []).map((opt) => (
            <option
              key={opt.value}
              value={opt.value}
              disabled={opt.disabled}
            >
              {opt.label}
            </option>
          ))}
        </select>

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

Select.displayName = 'Select'

export default Select

/* ─── Usage examples ────────────────────────────────────────────────────────
// Select básico
<Select
  label="Turma"
  placeholder="Selecione uma turma..."
  options={[
    { value: '1a', label: '1º Ano A' },
    { value: '1b', label: '1º Ano B' },
    { value: '2a', label: '2º Ano A' },
  ]}
  onChange={(e) => setTurma(e.target.value)}
/>

// Obrigatório com erro
<Select
  label="Disciplina"
  required
  placeholder="Selecione..."
  options={disciplinas.map((d) => ({ value: d.id, label: d.nome }))}
  errorText="Selecione uma disciplina"
/>

// Desabilitado
<Select
  label="Série"
  options={series}
  value="fundamental"
  disabled
/>
─────────────────────────────────────────────────────────────────────────── */
