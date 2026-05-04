'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button, Card, Badge, Alert } from '@/components/ui'
import { cn } from '@/lib/utils'

// ─── TIPOS ───────────────────────────────────────────────────────────────────

interface AutomacaoCondicao {
  gatilho?: string
  limiar?:  number
  tipo?:    string
  [key: string]: unknown
}

interface AutomacaoAcao {
  tipo?:       string
  descricao?:  string
  [key: string]: unknown
}

interface Automacao {
  id:        string
  nome:      string
  condicao:  AutomacaoCondicao
  acao:      AutomacaoAcao
  ativo:     boolean
  created_at: string
}

interface ResultadoExec {
  nome:    string
  criadas: number
  itens:   string[]
}

// ─── LABELS ───────────────────────────────────────────────────────────────────

const gatilhoLabel: Record<string, string> = {
  frequencia: 'Frequência',
  nota:       'Nota',
  data:       'Data/Calendário',
  matricula:  'Matrícula',
}

const acaoLabel: Record<string, string> = {
  notificacao: 'Ocorrência',
  mensagem:    'Mensagem',
  tarefa:      'Tarefa',
}

// ─── ÍCONES ───────────────────────────────────────────────────────────────────

function IconBolt({ className }: { className?: string }) {
  return (
    <svg className={cn('h-5 w-5', className)} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
  )
}
function IconMail() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
    </svg>
  )
}
function IconBell() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
    </svg>
  )
}
function IconClipboard() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
    </svg>
  )
}
function IconPlay() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
    </svg>
  )
}
function IconRefresh({ spinning }: { spinning?: boolean }) {
  return (
    <svg className={cn('h-4 w-4', spinning && 'animate-spin')} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
    </svg>
  )
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function AutomacoesPage() {
  const [automacoes, setAutomacoes]   = useState<Automacao[]>([])
  const [loading, setLoading]         = useState(true)
  const [executando, setExecutando]   = useState<string | null>(null) // id ou 'all'
  const [resultado, setResultado]     = useState<{ total: number; detalhes: ResultadoExec[] } | null>(null)
  const [erro, setErro]               = useState<string | null>(null)
  const [toggling, setToggling]       = useState<string | null>(null)

  const acaoIcon: Record<string, React.ReactNode> = {
    mensagem:    <IconMail />,
    notificacao: <IconBell />,
    tarefa:      <IconClipboard />,
  }

  // ─── Carregar automações ──────────────────────────────────────────────────
  const carregar = useCallback(async () => {
    setLoading(true)
    setErro(null)
    try {
      const res  = await fetch('/api/automacoes/executar')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erro ao carregar')
      setAutomacoes(json.automacoes ?? [])
    } catch (e) {
      setErro((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { carregar() }, [carregar])

  // ─── Toggle ativo ─────────────────────────────────────────────────────────
  async function toggleAtivo(id: string, ativo: boolean) {
    setToggling(id)
    try {
      const res  = await fetch('/api/automacoes/executar', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ id, ativo: !ativo }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setAutomacoes((prev) => prev.map((a) => a.id === id ? { ...a, ativo: !ativo } : a))
    } catch (e) {
      setErro((e as Error).message)
    } finally {
      setToggling(null)
    }
  }

  // ─── Executar automação(ões) ──────────────────────────────────────────────
  async function executar(id?: string) {
    setExecutando(id ?? 'all')
    setResultado(null)
    setErro(null)
    try {
      const res  = await fetch('/api/automacoes/executar', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(id ? { id } : {}),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setResultado({ total: json.totalCriadas ?? 0, detalhes: json.resultados ?? [] })
      await carregar()
    } catch (e) {
      setErro((e as Error).message)
    } finally {
      setExecutando(null)
    }
  }

  const ativas    = automacoes.filter((a) => a.ativo).length
  const pausadas  = automacoes.filter((a) => !a.ativo).length

  return (
    <div className="p-8 space-y-6 max-w-[1280px]">

      {/* Cabeçalho */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-display font-bold text-ink">Automações</h1>
          <p className="text-body text-ink-muted mt-0.5">Regras automáticas de notificação e ação</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={carregar} leftIcon={<IconRefresh spinning={loading} />}>
            Atualizar
          </Button>
          <Button
            leftIcon={<IconBolt />}
            size="sm"
            onClick={() => executar()}
            disabled={executando === 'all' || ativas === 0}
          >
            {executando === 'all' ? 'Executando…' : 'Executar todas'}
          </Button>
        </div>
      </div>

      {/* Alert de erro */}
      {erro && <Alert variant="error" title="Erro" description={erro} />}

      {/* Resultado da execução */}
      {resultado && (
        <Alert
          variant={resultado.total > 0 ? 'success' : 'info'}
          title={resultado.total > 0
            ? `${resultado.total} registro${resultado.total !== 1 ? 's' : ''} gerado${resultado.total !== 1 ? 's' : ''}`
            : 'Execução concluída — nenhuma ação necessária'}
          description={
            resultado.detalhes
              .filter((r) => r.criadas > 0)
              .map((r) => `${r.nome}: ${r.criadas} ação${r.criadas !== 1 ? 'ões' : ''}`)
              .join(' · ') || 'Todos os dados já estão atualizados.'
          }
        />
      )}

      {/* Vazio */}
      {!loading && automacoes.length === 0 && !erro && (
        <Alert
          variant="info"
          title="Nenhuma automação encontrada"
          description="Clique em «Executar todas» para inicializar as automações padrão do sistema."
        />
      )}

      {/* Resumo */}
      {!loading && automacoes.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Regras ativas', value: ativas,   color: 'text-success-600' },
            { label: 'Pausadas',      value: pausadas, color: 'text-warning-600' },
          ].map((c) => (
            <Card key={c.label}>
              <Card.Body>
                <p className="text-caption text-ink-muted">{c.label}</p>
                <p className={cn('text-display-sm font-bold mt-1', c.color)}>{c.value}</p>
              </Card.Body>
            </Card>
          ))}
        </div>
      )}

      {/* Skeleton */}
      {loading && (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <Card.Body>
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-surface-hover animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-48 rounded bg-surface-hover animate-pulse" />
                    <div className="h-3 w-80 rounded bg-surface-hover animate-pulse" />
                  </div>
                </div>
              </Card.Body>
            </Card>
          ))}
        </div>
      )}

      {/* Lista de automações */}
      {!loading && automacoes.length > 0 && (
        <div className="space-y-3">
          {automacoes.map((a) => (
            <Card key={a.id} className={cn(!a.ativo && 'opacity-60')}>
              <Card.Body>
                <div className="flex items-start gap-4">
                  <span className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                    a.acao?.tipo === 'mensagem'    ? 'bg-primary-50 text-primary-600' :
                    a.acao?.tipo === 'notificacao' ? 'bg-warning-50 text-warning-600' :
                                                    'bg-success-50 text-success-600',
                  )}>
                    {acaoIcon[a.acao?.tipo ?? ''] ?? <IconBolt className="h-4 w-4" />}
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-body font-semibold text-ink">{a.nome}</h3>
                      <Badge variant={a.ativo ? 'success' : 'warning'}>
                        {a.ativo ? 'Ativa' : 'Pausada'}
                      </Badge>
                    </div>
                    {a.acao?.descricao && (
                      <p className="text-body-sm text-ink-muted mt-1">{a.acao.descricao}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-caption text-ink-faint flex-wrap">
                      <span>Gatilho: <strong className="text-ink-muted">{gatilhoLabel[a.condicao?.gatilho ?? ''] ?? a.condicao?.gatilho ?? '—'}</strong></span>
                      <span>Ação: <strong className="text-ink-muted">{acaoLabel[a.acao?.tipo ?? ''] ?? a.acao?.tipo ?? '—'}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {a.ativo && (
                      <Button
                        variant="outline-primary"
                        size="xs"
                        leftIcon={<IconPlay />}
                        onClick={() => executar(a.id)}
                        disabled={executando === a.id}
                      >
                        {executando === a.id ? 'Exec…' : 'Executar'}
                      </Button>
                    )}
                    <Button
                      variant={a.ativo ? 'outline' : 'outline-primary'}
                      size="xs"
                      onClick={() => toggleAtivo(a.id, a.ativo)}
                      disabled={toggling === a.id}
                    >
                      {toggling === a.id ? '…' : a.ativo ? 'Pausar' : 'Ativar'}
                    </Button>
                  </div>
                </div>
              </Card.Body>
            </Card>
          ))}
        </div>
      )}

      {/* Info triggers SQL */}
      {!loading && automacoes.length > 0 && (
        <Card>
          <Card.Body>
            <div className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-hover">
                <svg className="h-4 w-4 text-ink-muted" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                </svg>
              </span>
              <div>
                <p className="text-body-sm font-medium text-ink">Automações em tempo real</p>
                <p className="text-caption text-ink-muted mt-0.5">
                  O banco também possui triggers SQL que criam ocorrências automaticamente ao inserir frequências ou notas.
                  Para ativar, execute <code className="px-1 py-0.5 rounded bg-surface-hover font-mono text-xs">supabase/migrations/001_automacao_triggers.sql</code> no SQL Editor do Supabase.
                </p>
              </div>
            </div>
          </Card.Body>
        </Card>
      )}

    </div>
  )
}
