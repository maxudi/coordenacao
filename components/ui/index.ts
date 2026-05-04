// ─── UI COMPONENT LIBRARY ─────────────────────────────────────────────────
// Importar sempre daqui. Nunca importar direto dos arquivos individuais
// para garantir consistência e facilitar refatorações futuras.

// Core
export { default as Button }               from './Button'
export { default as Input, Textarea }      from './Input'
export type { InputProps, TextareaProps }  from './Input'
export { default as Select }               from './Select'
export type { SelectProps, SelectOption }  from './Select'

// Layout
export { default as Card }                 from './Card'

// Feedback
export { default as Modal, ConfirmModal }  from './Modal'
export { Alert, Badge }                    from './Alert'
export { ToastProvider, useToast }         from './Toast'

// Data display
export { default as Table }                from './Table'
export type { Column }                     from './Table'

// File upload
export { default as Upload }               from './Upload'
export type { UploadProps, UploadFile }    from './Upload'

// Utility
export {
  Skeleton,
  SkeletonText,
  SkeletonRow,
  Avatar,
  Spinner,
  Progress,
}                                          from './Skeleton'
