'use client'

import { useState } from 'react'
import { Avatar, Badge, Button, Input } from '@/components/ui'
import { cn } from '@/lib/utils'

// ─── TIPOS ───────────────────────────────────────────────────────────────────

interface Conversa {
  id:        string
  nome:      string
  papel:     string
  ultima:    string
  tempo:     string
  naoLidas:  number
  online:    boolean
}

interface Mensagem {
  id:      string
  autor:   string
  texto:   string
  tempo:   string
  propria: boolean
}

// ─── DADOS MOCK ───────────────────────────────────────────────────────────────

const CONVERSAS: Conversa[] = [
  { id: '1', nome: 'Ana Lima',       papel: 'Professora',    ultima: 'Certo, enviarei o relatório amanhã.',             tempo: '09:42', naoLidas: 0, online: true  },
  { id: '2', nome: 'Carlos Reis',    papel: 'Professor',     ultima: 'Preciso conversar sobre o aluno Lucas.',          tempo: '08:15', naoLidas: 2, online: false },
  { id: '3', nome: 'Julia Mota',     papel: 'Professora',    ultima: 'A reunião de amanhã ainda está confirmada?',      tempo: 'Ontem', naoLidas: 1, online: true  },
  { id: '4', nome: 'Roberto Dias',   papel: 'Professor',     ultima: 'Ok, obrigado pela informação.',                   tempo: 'Ontem', naoLidas: 0, online: false },
  { id: '5', nome: 'Paula Souza',    papel: 'Professora',    ultima: 'As notas foram lançadas no sistema.',             tempo: 'Seg',   naoLidas: 0, online: false },
  { id: '6', nome: 'Maria Rodrigues',papel: 'Responsável',   ultima: 'Quando será a reunião de pais?',                 tempo: 'Seg',   naoLidas: 3, online: false },
  { id: '7', nome: 'José Lima',      papel: 'Responsável',   ultima: 'Meu filho não virá na quinta-feira.',            tempo: 'Dom',   naoLidas: 0, online: false },
  { id: '8', nome: 'Tiago Almeida',  papel: 'Professor',     ultima: 'Preciso de mais cadeiras na sala 08.',            tempo: 'Dom',   naoLidas: 0, online: true  },
]

const HISTORICO: Record<string, Mensagem[]> = {
  '1': [
    { id: 'm1', autor: 'Ana Lima',     texto: 'Bom dia! Você pode me dizer quando acontecerá a próxima reunião pedagógica?', tempo: '09:00', propria: false },
    { id: 'm2', autor: 'Você',         texto: 'Bom dia, Ana! A reunião está marcada para quinta-feira às 14h na sala de reuniões.',  tempo: '09:15', propria: true  },
    { id: 'm3', autor: 'Ana Lima',     texto: 'Perfeito. Vou preparar os materiais. Preciso também entregar as avaliações até lá?', tempo: '09:30', propria: false },
    { id: 'm4', autor: 'Você',         texto: 'Sim, por favor. Envie via sistema até quarta-feira.',                                 tempo: '09:38', propria: true  },
    { id: 'm5', autor: 'Ana Lima',     texto: 'Certo, enviarei o relatório amanhã.',                                                 tempo: '09:42', propria: false },
  ],
  '2': [
    { id: 'm1', autor: 'Carlos Reis',  texto: 'Boa tarde! Preciso conversar sobre o aluno Lucas Ferreira.', tempo: '07:50', propria: false },
    { id: 'm2', autor: 'Carlos Reis',  texto: 'Ele faltou quatro vezes esta semana.',                        tempo: '08:15', propria: false },
  ],
  '3': [
    { id: 'm1', autor: 'Julia Mota',   texto: 'A reunião de amanhã ainda está confirmada?', tempo: 'Ontem 16:20', propria: false },
  ],
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function MensagensPage() {
  const [conversaAtiva, setConversaAtiva] = useState<string>('1')
  const [busca, setBusca]                = useState('')
  const [texto, setTexto]               = useState('')
  const [historicos, setHistoricos]     = useState(HISTORICO)

  const conversasFiltradas = CONVERSAS.filter((c) =>
    c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    c.papel.toLowerCase().includes(busca.toLowerCase()),
  )

  const conversa  = CONVERSAS.find((c) => c.id === conversaAtiva)
  const mensagens = historicos[conversaAtiva] ?? []

  function enviar() {
    if (!texto.trim()) return
    const nova: Mensagem = {
      id:      'new-' + Date.now(),
      autor:   'Você',
      texto:   texto.trim(),
      tempo:   new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      propria: true,
    }
    setHistoricos((prev) => ({
      ...prev,
      [conversaAtiva]: [...(prev[conversaAtiva] ?? []), nova],
    }))
    setTexto('')
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">

      {/* ── Lista de conversas ─────────────────────────────────────────────── */}
      <aside className="w-72 shrink-0 flex flex-col border-r border-surface-border bg-surface">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-border px-4 py-3 h-14">
          <h1 className="text-heading font-semibold text-ink">Mensagens</h1>
          <Badge variant="danger">{CONVERSAS.reduce((s, c) => s + c.naoLidas, 0)}</Badge>
        </div>

        {/* Busca */}
        <div className="px-3 py-2 border-b border-surface-border">
          <Input
            placeholder="Buscar conversa..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            size="sm"
          />
        </div>

        {/* Lista */}
        <ul className="flex-1 overflow-y-auto">
          {conversasFiltradas.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => setConversaAtiva(c.id)}
                className={cn(
                  'w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-subtle',
                  conversaAtiva === c.id && 'bg-primary-50 border-r-2 border-primary-600',
                )}
              >
                <div className="relative shrink-0">
                  <Avatar name={c.nome} size="sm" />
                  {c.online && (
                    <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-success-500 ring-1 ring-surface" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-body-sm font-medium text-ink truncate">{c.nome}</span>
                    <span className="text-caption text-ink-faint shrink-0 ml-1">{c.tempo}</span>
                  </div>
                  <p className="text-caption text-ink-muted">{c.papel}</p>
                  <p className="text-caption text-ink-faint truncate mt-0.5">{c.ultima}</p>
                </div>
                {c.naoLidas > 0 && (
                  <span className="shrink-0 flex h-4 w-4 items-center justify-center rounded-full bg-primary-600 text-[10px] font-bold text-white">
                    {c.naoLidas}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* ── Área de chat ───────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden">

        {/* Header da conversa */}
        {conversa && (
          <div className="flex items-center gap-3 border-b border-surface-border bg-surface px-6 h-14 shrink-0">
            <div className="relative">
              <Avatar name={conversa.nome} size="sm" />
              {conversa.online && (
                <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-success-500 ring-1 ring-surface" />
              )}
            </div>
            <div>
              <p className="text-body-sm font-semibold text-ink">{conversa.nome}</p>
              <p className="text-caption text-ink-muted">{conversa.papel} {conversa.online ? '· Online' : ''}</p>
            </div>
          </div>
        )}

        {/* Mensagens */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 bg-surface-muted">
          {mensagens.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-ink-muted">
              <p className="text-body">Nenhuma mensagem ainda.</p>
              <p className="text-caption mt-1">Envie a primeira mensagem abaixo.</p>
            </div>
          )}
          {mensagens.map((m) => (
            <div
              key={m.id}
              className={cn('flex gap-3', m.propria ? 'flex-row-reverse' : 'flex-row')}
            >
              {!m.propria && <Avatar name={m.autor} size="xs" className="shrink-0 mt-1" />}
              <div
                className={cn(
                  'max-w-[70%] rounded-2xl px-4 py-2.5',
                  m.propria
                    ? 'rounded-tr-sm bg-primary-600 text-white'
                    : 'rounded-tl-sm bg-surface border border-surface-border',
                )}
              >
                <p className={cn('text-body-sm', m.propria ? 'text-white' : 'text-ink')}>{m.texto}</p>
                <p className={cn('text-caption mt-1', m.propria ? 'text-primary-200' : 'text-ink-faint')}>{m.tempo}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Input de mensagem */}
        <div className="border-t border-surface-border bg-surface px-4 py-3">
          <div className="flex items-end gap-3">
            <Input
              placeholder="Escreva uma mensagem..."
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), enviar())}
              className="flex-1"
            />
            <Button onClick={enviar} disabled={!texto.trim()}>
              Enviar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
