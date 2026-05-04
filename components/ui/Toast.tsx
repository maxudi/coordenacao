'use client'

import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

// ─── TYPES ───────────────────────────────────────────────────────────────────

type ToastVariant = 'success' | 'danger' | 'warning' | 'info'

interface ToastItem {
  id:       string
  variant:  ToastVariant
  title:    string
  desc?:    string
  duration: number   // ms
}

interface ToastContextValue {
  toast: (options: Omit<ToastItem, 'id'>) => void
  success: (title: string, desc?: string) => void
  danger:  (title: string, desc?: string) => void
  warning: (title: string, desc?: string) => void
  info:    (title: string, desc?: string) => void
}

// ─── CONTEXT ─────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast deve ser usado dentro de <ToastProvider>')
  return ctx
}

// ─── SINGLE TOAST ────────────────────────────────────────────────────────────

const variantClass: Record<ToastVariant, string> = {
  success: 'toast-success',
  danger:  'toast-danger',
  warning: 'toast-warning',
  info:    'toast-info',
}

const ToastIcon = ({ variant }: { variant: ToastVariant }) => {
  const paths: Record<ToastVariant, string> = {
    success: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    danger:  'M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z',
    warning: 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z',
    info:    'M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z',
  }

  return (
    <svg className="h-4 w-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d={paths[variant]} />
    </svg>
  )
}

function ToastItem({ item, onDismiss }: { item: ToastItem; onDismiss: (id: string) => void }) {
  const [visible, setVisible] = useState(true)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const dismiss = useCallback(() => {
    setVisible(false)
    setTimeout(() => onDismiss(item.id), 300)
  }, [item.id, onDismiss])

  useEffect(() => {
    timerRef.current = setTimeout(dismiss, item.duration)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [dismiss, item.duration])

  return (
    <div
      className={cn(
        variantClass[item.variant],
        'transition-all duration-300',
        visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full',
      )}
      role="status"
      aria-live="polite"
    >
      <ToastIcon variant={item.variant} />

      <div className="flex-1 min-w-0">
        <p className="text-body-sm font-semibold">{item.title}</p>
        {item.desc && <p className="text-caption mt-0.5 opacity-90">{item.desc}</p>}
      </div>

      <button
        type="button"
        onClick={dismiss}
        aria-label="Fechar notificação"
        className="ml-1 shrink-0 h-5 w-5 flex items-center justify-center
                   rounded opacity-70 hover:opacity-100 transition-opacity"
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
        </svg>
      </button>
    </div>
  )
}

// ─── PROVIDER ────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addToast = useCallback((options: Omit<ToastItem, 'id'>) => {
    const id = Math.random().toString(36).slice(2, 9)
    setToasts((prev) => [...prev, { ...options, id }])
  }, [])

  const value: ToastContextValue = {
    toast: addToast,
    success: (title, desc) => addToast({ variant: 'success', title, desc, duration: 4000 }),
    danger:  (title, desc) => addToast({ variant: 'danger',  title, desc, duration: 6000 }),
    warning: (title, desc) => addToast({ variant: 'warning', title, desc, duration: 5000 }),
    info:    (title, desc) => addToast({ variant: 'info',    title, desc, duration: 4000 }),
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      {typeof window !== 'undefined' &&
        createPortal(
          <div className="toast-container" aria-label="Notificações">
            {toasts.map((t) => (
              <ToastItem key={t.id} item={t} onDismiss={dismiss} />
            ))}
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  )
}

/* ─── Usage ──────────────────────────────────────────────────────────────────
// 1. Envolver o layout raiz
// app/layout.tsx
<ToastProvider>
  {children}
</ToastProvider>

// 2. Usar em qualquer componente
const { success, danger, warning, info } = useToast()

success('Aluno salvo com sucesso')
danger('Erro ao excluir', 'Tente novamente mais tarde.')
warning('Atenção', 'Existem campos incompletos.')
info('Dica', 'Você pode importar alunos via CSV.')
─────────────────────────────────────────────────────────────────────────── */
