'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Avatar, Badge } from '@/components/ui'

// --- �CONES -------------------------------------------------------------------

function IconBell({ className }: { className?: string }) {
  return (
    <svg className={cn('h-5 w-5', className)} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
    </svg>
  )
}

function IconSearch({ className }: { className?: string }) {
  return (
    <svg className={cn('h-4 w-4', className)} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  )
}

function IconChevronDown({ className }: { className?: string }) {
  return (
    <svg className={cn('h-3.5 w-3.5', className)} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  )
}

function IconMenu({ className }: { className?: string }) {
  return (
    <svg className={cn('h-5 w-5', className)} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
  )
}

function IconAcademic({ className }: { className?: string }) {
  return (
    <svg className={cn('h-4 w-4', className)} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
    </svg>
  )
}

// --- ROTA ? T�TULO ------------------------------------------------------------

const ROUTE_LABELS: Record<string, string> = {
  '/':              'Dashboard',
  '/alunos':        'Alunos',
  '/professores':   'Professores',
  '/turmas':        'Turmas',
  '/mensagens':     'Mensagens',
  '/automacoes':    'Automações',
  '/agenda':        'Agenda',
  '/configuracoes':  'Configurações',
  '/relatorios':     'Relatórios',
  '/perfil':         'Meu Perfil',
  '/administracao':  'Administração',
}

function usePageTitle(): string {
  const pathname = usePathname()
  if (ROUTE_LABELS[pathname]) return ROUTE_LABELS[pathname]
  const base = '/' + pathname.split('/')[1]
  return ROUTE_LABELS[base] ?? 'Coordenação'
}

// --- NOTIFICA��O MOCK ---------------------------------------------------------

const notificacoes = [
  { id: 1, texto: 'Lucas Ferreira com 3 faltas esta semana',      tempo: '5 min',  lida: false },
  { id: 2, texto: 'Novo aluno matriculado: Sofia Alves',          tempo: '42 min', lida: false },
  { id: 3, texto: 'Relatório de abril disponível para download',  tempo: '2 h',    lida: true  },
]

// --- TOPBAR -------------------------------------------------------------------

interface TopbarProps {
  onMenuToggle?: () => void
}

export default function Topbar({ onMenuToggle }: TopbarProps) {
  const pageTitle = usePageTitle()
  const [notifOpen, setNotifOpen] = useState(false)
  const [userOpen,  setUserOpen]  = useState(false)

  const naoLidas = notificacoes.filter((n) => !n.lida).length

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-surface-border bg-surface px-4 gap-4">

      {/* -- Esquerda --------------------------------------------------------- */}
      <div className="flex items-center gap-3 min-w-0">

        {/* Burger (mobile) */}
        {onMenuToggle && (
          <button
            type="button"
            onClick={onMenuToggle}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md
                       text-ink-muted hover:bg-surface-subtle hover:text-ink
                       transition-colors lg:hidden"
            aria-label="Abrir menu"
          >
            <IconMenu />
          </button>
        )}

        {/* Logo � apenas mobile (sidebar está oculta) */}
        <Link href="/" className="flex items-center gap-2 shrink-0 lg:hidden">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary-600">
            <IconAcademic className="h-4 w-4 text-white" />
          </span>
          <span className="text-heading-sm font-semibold text-ink">Coordenação</span>
        </Link>

        {/* Título da página � apenas desktop */}
        <h1 className="hidden lg:block text-heading font-semibold text-ink truncate">
          {pageTitle}
        </h1>

        {/* Campo de busca � apenas desktop */}
        <div className="relative hidden lg:flex items-center ml-2">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-ink-faint">
            <IconSearch />
          </span>
          <input
            type="search"
            placeholder="Buscar alunos, turmas..."
            className="input-base input-sm pl-9 w-56 bg-surface-muted"
          />
        </div>
      </div>

      {/* -- Direita ---------------------------------------------------------- */}
      <div className="flex items-center gap-1 shrink-0">

        {/* Notificações */}
        <div className="relative">
          <button
            type="button"
            onClick={() => { setNotifOpen((v) => !v); setUserOpen(false) }}
            className="relative flex h-9 w-9 items-center justify-center rounded-md
                       text-ink-muted hover:bg-surface-subtle hover:text-ink
                       transition-colors duration-150"
            aria-label="Notificações"
          >
            <IconBell />
            {naoLidas > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-danger-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-danger-500" />
              </span>
            )}
          </button>

          {notifOpen && (
            <>
              <div className="fixed inset-0 z-dropdown" onClick={() => setNotifOpen(false)} />
              <div
                className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-surface-border bg-surface"
                style={{ zIndex: 'var(--z-dropdown)', boxShadow: 'var(--shadow-lg)' }}
              >
                <div className="flex items-center justify-between border-b border-surface-border px-4 py-3">
                  <span className="text-body-sm font-semibold text-ink">Notificações</span>
                  {naoLidas > 0 && <Badge variant="danger">{naoLidas} novas</Badge>}
                </div>
                <ul className="divide-y divide-surface-border">
                  {notificacoes.map((n) => (
                    <li
                      key={n.id}
                      className={cn(
                        'flex items-start gap-3 px-4 py-3 transition-colors hover:bg-surface-subtle cursor-pointer',
                        !n.lida && 'bg-primary-50/50',
                      )}
                    >
                      {!n.lida && (
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-500" />
                      )}
                      <div className={cn('min-w-0 flex-1', n.lida && 'pl-4')}>
                        <p className="text-body-sm text-ink">{n.texto}</p>
                        <p className="text-caption text-ink-faint mt-0.5">{n.tempo} atrás</p>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="border-t border-surface-border px-4 py-2.5">
                  <button className="text-body-sm font-medium text-primary-600 hover:text-primary-700 transition-colors">
                    Ver todas as notificações
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Divider */}
        <span className="mx-1 h-5 w-px bg-surface-border" />

        {/* Usuário */}
        <div className="relative">
          <button
            type="button"
            onClick={() => { setUserOpen((v) => !v); setNotifOpen(false) }}
            className="flex items-center gap-2.5 rounded-md px-2 py-1.5
                       hover:bg-surface-subtle transition-colors duration-150"
          >
            <Avatar name="Graziele de Oliveira" size="sm" />
            <div className="hidden sm:block text-left">
              <p className="text-body-sm font-medium text-ink leading-tight">Graziele de Oliveira</p>
              <p className="text-caption text-ink-muted leading-tight">Coordenadora</p>
            </div>
            <IconChevronDown className="hidden sm:block text-ink-faint" />
          </button>

          {userOpen && (
            <>
              <div className="fixed inset-0 z-dropdown" onClick={() => setUserOpen(false)} />
              <div
                className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-surface-border bg-surface py-1"
                style={{ zIndex: 'var(--z-dropdown)', boxShadow: 'var(--shadow-lg)' }}
              >
                {[
                  { label: 'Meu perfil',    href: '/perfil' },
                  { label: 'Configurações', href: '/configuracoes' },
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block px-4 py-2 text-body-sm text-ink hover:bg-surface-subtle transition-colors"
                    onClick={() => setUserOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="my-1 border-t border-surface-border" />
                <button
                  type="button"
                  className="w-full px-4 py-2 text-left text-body-sm text-danger-600
                             hover:bg-danger-50 transition-colors"
                >
                  Sair
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

// --- �CONES -------------------------------------------------------------------

