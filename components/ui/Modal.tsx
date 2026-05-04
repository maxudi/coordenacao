'use client'

import { useEffect, useCallback, HTMLAttributes } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import Button from './Button'

// ─── TYPES ───────────────────────────────────────────────────────────────────

type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full'

interface ModalProps {
  open:         boolean
  onClose:      () => void
  size?:        ModalSize
  /** Fechar ao clicar no overlay */
  closeOnOverlay?: boolean
  /** Fechar com Escape */
  closeOnEsc?:     boolean
  children:     React.ReactNode
  className?:   string
}

interface ConfirmModalProps {
  open:        boolean
  onClose:     () => void
  onConfirm:   () => void | Promise<void>
  title:       string
  description: string
  confirmLabel?:  string
  cancelLabel?:   string
  variant?:    'danger' | 'primary'
  isLoading?:  boolean
}

// ─── MODAL BASE ──────────────────────────────────────────────────────────────

const sizeClass: Record<ModalSize, string> = {
  sm:   'modal-sm',
  md:   'modal-md',
  lg:   'modal-lg',
  xl:   'modal-xl',
  full: 'modal-full',
}

function Modal({
  open,
  onClose,
  size             = 'md',
  closeOnOverlay   = true,
  closeOnEsc       = true,
  children,
  className,
}: ModalProps) {
  // Fechar com Escape
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (closeOnEsc && e.key === 'Escape') onClose()
    },
    [closeOnEsc, onClose],
  )

  useEffect(() => {
    if (!open) return
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, handleKeyDown])

  if (!open) return null

  return createPortal(
    <div
      className="modal-overlay"
      onClick={closeOnOverlay ? onClose : undefined}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={cn(sizeClass[size], className)}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body,
  )
}

// ─── SUB-COMPONENTS ──────────────────────────────────────────────────────────

function ModalHeader({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('modal-header', className)} {...props}>
      {children}
    </div>
  )
}

function ModalBody({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('modal-body', className)} {...props}>
      {children}
    </div>
  )
}

function ModalFooter({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('modal-footer', className)} {...props}>
      {children}
    </div>
  )
}

function ModalTitle({ className, children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2 className={cn('modal-title', className)} {...props}>
      {children}
    </h2>
  )
}

// Botão X de fechar
function ModalClose({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      onClick={onClose}
      aria-label="Fechar"
      className="h-8 w-8 flex items-center justify-center rounded-md text-ink-muted
                 hover:bg-surface-subtle hover:text-ink transition-colors duration-150"
    >
      <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
      </svg>
    </button>
  )
}

// ─── CONFIRM MODAL ───────────────────────────────────────────────────────────

function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel  = 'Cancelar',
  variant      = 'danger',
  isLoading    = false,
}: ConfirmModalProps) {
  const iconColor = variant === 'danger' ? 'text-danger-600' : 'text-primary-600'
  const iconBg    = variant === 'danger' ? 'bg-danger-50' : 'bg-primary-50'

  return (
    <Modal open={open} onClose={onClose} size="sm" closeOnOverlay={!isLoading}>
      <ModalBody className="flex flex-col items-center text-center pt-8 pb-6">
        {/* Ícone */}
        <span className={cn('mb-4 h-12 w-12 flex items-center justify-center rounded-full', iconBg, iconColor)}>
          {variant === 'danger' ? (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          ) : (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
            </svg>
          )}
        </span>

        <h2 className="text-heading-sm font-semibold text-ink mb-2">{title}</h2>
        <p className="text-body-sm text-ink-muted">{description}</p>
      </ModalBody>

      <ModalFooter className="justify-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={onClose}
          disabled={isLoading}
        >
          {cancelLabel}
        </Button>
        <Button
          variant={variant}
          size="sm"
          isLoading={isLoading}
          onClick={async () => {
            await onConfirm()
          }}
        >
          {confirmLabel}
        </Button>
      </ModalFooter>
    </Modal>
  )
}

// ─── EXPORTS ─────────────────────────────────────────────────────────────────

Modal.Header  = ModalHeader
Modal.Body    = ModalBody
Modal.Footer  = ModalFooter
Modal.Title   = ModalTitle
Modal.Close   = ModalClose

export default Modal
export { ConfirmModal }

/* ─── Usage examples ────────────────────────────────────────────────────────
// Modal genérico
<Modal open={isOpen} onClose={() => setIsOpen(false)} size="lg">
  <Modal.Header>
    <Modal.Title>Editar aluno</Modal.Title>
    <Modal.Close onClose={() => setIsOpen(false)} />
  </Modal.Header>
  <Modal.Body>
    <form>...</form>
  </Modal.Body>
  <Modal.Footer>
    <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
    <Button>Salvar</Button>
  </Modal.Footer>
</Modal>

// Modal de confirmação de exclusão
<ConfirmModal
  open={deleteOpen}
  onClose={() => setDeleteOpen(false)}
  onConfirm={handleDelete}
  title="Excluir aluno"
  description="Esta ação não pode ser desfeita. O aluno será removido permanentemente."
  confirmLabel="Sim, excluir"
  variant="danger"
  isLoading={isDeleting}
/>
─────────────────────────────────────────────────────────────────────────── */
