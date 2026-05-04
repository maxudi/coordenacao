import { forwardRef, InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, className, ...props }, ref) => {
    return (
      <label className="inline-flex items-center gap-2 cursor-pointer">
        <input
          ref={ref}
          type="checkbox"
          className={cn(
            'h-4 w-4 rounded border border-surface-border text-primary-600',
            'focus:ring-2 focus:ring-primary-500 focus:ring-offset-0',
            className,
          )}
          {...props}
        />
        {label && <span className="text-body-sm text-ink">{label}</span>}
      </label>
    )
  },
)

Checkbox.displayName = 'Checkbox'

export default Checkbox
export type { CheckboxProps }
