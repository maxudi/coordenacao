import { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import { Skeleton } from './Skeleton'

// ─── TYPES ───────────────────────────────────────────────────────────────────

export interface Column<T> {
  key:         string
  header:      React.ReactNode
  /** Render function — use `accessor` or `render` (both work) */
  accessor?:   (row: T) => React.ReactNode
  render?:     (row: T) => React.ReactNode
  className?:  string
  /** Largura fixa, ex: 'w-16' */
  width?:      string
  align?:      'left' | 'center' | 'right'
}

interface TableProps<T> {
  columns:         Column<T>[]
  data:            T[]
  keyExtractor:    (row: T, index: number) => string | number
  isLoading?:      boolean
  skeletonRows?:   number
  emptyTitle?:     string
  emptyDesc?:      string
  emptyAction?:    React.ReactNode
  onRowClick?:     (row: T) => void
  selectedKeys?:   Set<string | number>
  className?:      string
  wrapperClassName?: string
}

// ─── PRIMITIVES ──────────────────────────────────────────────────────────────

function Th({ className, children, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={cn(className)} {...props}>{children}</th>
}

function Td({ className, children, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn(className)} {...props}>{children}</td>
}

// ─── EMPTY STATE ─────────────────────────────────────────────────────────────

function TableEmpty({
  title  = 'Nenhum resultado encontrado',
  desc   = 'Não há itens para exibir.',
  action,
}: { title?: string; desc?: string; action?: React.ReactNode }) {
  return (
    <tr>
      <td colSpan={999}>
        <div className="empty-state py-12">
          <svg className="empty-state-icon" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
          </svg>
          <p className="empty-state-title">{title}</p>
          <p className="empty-state-desc">{desc}</p>
          {action && <div className="mt-4">{action}</div>}
        </div>
      </td>
    </tr>
  )
}

// ─── TABLE ───────────────────────────────────────────────────────────────────

function Table<T>({
  columns,
  data,
  keyExtractor,
  isLoading      = false,
  skeletonRows   = 5,
  emptyTitle,
  emptyDesc,
  emptyAction,
  onRowClick,
  selectedKeys,
  className,
  wrapperClassName,
}: TableProps<T>) {
  const alignClass = { left: 'text-left', center: 'text-center', right: 'text-right' }

  return (
    <div className={cn('table-wrapper', wrapperClassName)}>
      <table className={cn('table', className)}>
        <thead>
          <tr>
            {columns.map((col) => (
              <Th
                key={col.key}
                className={cn(col.width, col.align && alignClass[col.align], col.className)}
              >
                {col.header}
              </Th>
            ))}
          </tr>
        </thead>

        <tbody>
          {/* Loading skeletons */}
          {isLoading &&
            Array.from({ length: skeletonRows }).map((_, i) => (
              <tr key={`skeleton-${i}`}>
                {columns.map((col) => (
                  <Td key={col.key}>
                    <Skeleton className="h-4 w-full" />
                  </Td>
                ))}
              </tr>
            ))}

          {/* Empty state */}
          {!isLoading && data.length === 0 && (
            <TableEmpty title={emptyTitle} desc={emptyDesc} action={emptyAction} />
          )}

          {/* Data rows */}
          {!isLoading &&
            data.map((row, index) => {
              const key      = keyExtractor(row, index)
              const isSelected = selectedKeys?.has(key)

              return (
                <tr
                  key={key}
                  className={cn(
                    isSelected && 'selected',
                    onRowClick && 'cursor-pointer',
                  )}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  {columns.map((col) => (
                    <Td
                      key={col.key}
                      className={cn(col.align && alignClass[col.align], col.className)}
                    >
                      {(col.accessor ?? col.render)?.(row)}
                    </Td>
                  ))}
                </tr>
              )
            })}
        </tbody>
      </table>
    </div>
  )
}

export default Table

/* ─── Usage example ─────────────────────────────────────────────────────────
type Aluno = { id: string; nome: string; turma: string; status: 'ativo' | 'inativo' }

const columns: Column<Aluno>[] = [
  {
    key:      'nome',
    header:   'Nome',
    accessor: (row) => <span className="font-medium text-ink">{row.nome}</span>,
  },
  {
    key:      'turma',
    header:   'Turma',
    accessor: (row) => row.turma,
  },
  {
    key:      'status',
    header:   'Status',
    accessor: (row) => (
      <Badge variant={row.status === 'ativo' ? 'success' : 'danger'} dot>
        {row.status === 'ativo' ? 'Ativo' : 'Inativo'}
      </Badge>
    ),
    width: 'w-28',
    align: 'center',
  },
  {
    key:      'acoes',
    header:   '',
    accessor: (row) => (
      <Button variant="ghost" size="xs" onClick={() => handleEdit(row)}>Editar</Button>
    ),
    width: 'w-20',
    align: 'right',
  },
]

<Table
  columns={columns}
  data={alunos}
  keyExtractor={(row) => row.id}
  isLoading={loading}
  emptyTitle="Nenhum aluno cadastrado"
  emptyDesc="Clique em 'Adicionar aluno' para começar."
  emptyAction={<Button size="sm">Adicionar aluno</Button>}
  onRowClick={(row) => router.push(`/alunos/${row.id}`)}
/>
─────────────────────────────────────────────────────────────────────────── */
