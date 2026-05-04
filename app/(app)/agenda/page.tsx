'use client'

import { useState } from 'react'
import { Button, Card, Badge, Modal } from '@/components/ui'
import { cn } from '@/lib/utils'

// ─── TIPOS ───────────────────────────────────────────────────────────────────

type TipoEvento = 'reuniao' | 'administrativo' | 'feriado' | 'pedagogico' | 'outro'

interface Evento {
  id:        string
  titulo:    string
  descricao: string
  data:      string       // YYYY-MM-DD
  hora:      string | null
  tipo:      TipoEvento
  local:     string | null
  turmas:    string[]
}

// ─── DADOS MOCK ───────────────────────────────────────────────────────────────

const MOCK: Evento[] = [
  { id: '1',  titulo: 'Conselho de Classe — 1º Ano',         descricao: 'Reunião do conselho para avaliar desempenho dos alunos.',   data: '2026-05-07', hora: '09:00', tipo: 'reuniao',       local: 'Sala de Reuniões', turmas: ['1º Ano A', '1º Ano B', '1º Ano C'] },
  { id: '2',  titulo: 'Entrega de boletins',                  descricao: 'Entrega dos boletins do 1º bimestre aos responsáveis.',    data: '2026-05-10', hora: null,    tipo: 'administrativo', local: null,               turmas: [] },
  { id: '3',  titulo: 'Reunião de pais — 3º Ano B',           descricao: 'Reunião para discutir desempenho da turma.',              data: '2026-05-14', hora: '18:00', tipo: 'reuniao',       local: 'Auditório',        turmas: ['3º Ano B'] },
  { id: '4',  titulo: 'Formação pedagógica',                  descricao: 'Capacitação dos professores sobre metodologias ativas.',  data: '2026-05-20', hora: '08:00', tipo: 'pedagogico',    local: 'Sala de Reuniões', turmas: [] },
  { id: '5',  titulo: 'Feriado — Corpus Christi',             descricao: 'Feriado nacional.',                                      data: '2026-06-19', hora: null,    tipo: 'feriado',       local: null,               turmas: [] },
  { id: '6',  titulo: 'Conselho de Classe — 2º Ano',         descricao: 'Reunião do conselho para avaliar desempenho dos alunos.',   data: '2026-06-03', hora: '09:00', tipo: 'reuniao',       local: 'Sala de Reuniões', turmas: ['2º Ano A', '2º Ano B', '2º Ano C'] },
  { id: '7',  titulo: 'Encerramento 1º Bimestre',             descricao: 'Prazo final para lançamento de notas do 1º bimestre.',    data: '2026-05-30', hora: null,    tipo: 'administrativo', local: null,               turmas: [] },
  { id: '8',  titulo: 'Visita técnica — 4º Ano B',            descricao: 'Visita ao Museu de Ciências.',                           data: '2026-05-22', hora: '07:30', tipo: 'outro',         local: 'Saída da escola',  turmas: ['4º Ano B'] },
]

const tipoLabel: Record<TipoEvento, string> = {
  reuniao:       'Reunião',
  administrativo:'Administrativo',
  feriado:       'Feriado',
  pedagogico:    'Pedagógico',
  outro:         'Outro',
}

const tipoColor: Record<TipoEvento, string> = {
  reuniao:       'bg-primary-100 text-primary-700',
  administrativo:'bg-secondary-100 text-secondary-700',
  feriado:       'bg-danger-100 text-danger-700',
  pedagogico:    'bg-success-100 text-success-700',
  outro:         'bg-warning-100 text-warning-700',
}

const tipoVariant: Record<TipoEvento, 'primary' | 'secondary' | 'danger' | 'success' | 'warning'> = {
  reuniao:       'primary',
  administrativo:'secondary',
  feriado:       'danger',
  pedagogico:    'success',
  outro:         'warning',
}

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

function fmtData(iso: string) {
  const [, m, d] = iso.split('-')
  return `${parseInt(d)} ${MESES[parseInt(m) - 1]}`
}

function diasAte(iso: string) {
  const hoje = new Date('2026-05-03')
  const data = new Date(iso)
  const diff = Math.ceil((data.getTime() - hoje.getTime()) / 86400000)
  if (diff < 0)  return { label: 'Passou',     cor: 'text-ink-faint' }
  if (diff === 0) return { label: 'Hoje',      cor: 'text-success-600 font-semibold' }
  if (diff === 1) return { label: 'Amanhã',    cor: 'text-warning-600 font-semibold' }
  return { label: `em ${diff} dias`, cor: 'text-ink-muted' }
}

// ─── ÍCONE ────────────────────────────────────────────────────────────────────

function IconPlus() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  )
}
function IconLocation() {
  return (
    <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
    </svg>
  )
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function AgendaPage() {
  const [filtroTipo, setFiltroTipo] = useState<TipoEvento | ''>('')
  const [eventoAtivo, setEventoAtivo] = useState<Evento | null>(null)

  const hoje = new Date('2026-05-03')
  const proximosMes = new Date('2026-06-03')

  const eventos = MOCK
    .filter((e) => !filtroTipo || e.tipo === filtroTipo)
    .sort((a, b) => a.data.localeCompare(b.data))

  const proximos = eventos.filter((e) => {
    const d = new Date(e.data)
    return d >= hoje && d <= proximosMes
  })
  const futuros = eventos.filter((e) => new Date(e.data) > proximosMes)

  return (
    <div className="p-8 space-y-6 max-w-[1280px]">

      {/* Cabeçalho */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-display font-bold text-ink">Agenda</h1>
          <p className="text-body text-ink-muted mt-0.5">Maio · Junho 2026</p>
        </div>
        <Button leftIcon={<IconPlus />}>Novo evento</Button>
      </div>

      {/* Filtros de tipo */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFiltroTipo('')}
          className={cn(
            'px-3 py-1.5 rounded-full text-body-sm font-medium transition-colors border',
            filtroTipo === ''
              ? 'bg-primary-600 text-white border-primary-600'
              : 'bg-surface border-surface-border text-ink-muted hover:bg-surface-subtle',
          )}
        >
          Todos
        </button>
        {(Object.keys(tipoLabel) as TipoEvento[]).map((t) => (
          <button
            key={t}
            onClick={() => setFiltroTipo(t === filtroTipo ? '' : t)}
            className={cn(
              'px-3 py-1.5 rounded-full text-body-sm font-medium transition-colors border',
              filtroTipo === t
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-surface border-surface-border text-ink-muted hover:bg-surface-subtle',
            )}
          >
            {tipoLabel[t]}
          </button>
        ))}
      </div>

      {/* Próximos 30 dias */}
      {proximos.length > 0 && (
        <section>
          <h2 className="text-heading font-semibold text-ink mb-3">Próximos 30 dias</h2>
          <div className="space-y-2">
            {proximos.map((e) => {
              const prazo = diasAte(e.data)
              return (
                <Card
                  key={e.id}
                  variant="interactive"
                  className="cursor-pointer"
                  onClick={() => setEventoAtivo(e)}
                >
                  <Card.Body>
                    <div className="flex items-start gap-4">
                      {/* Data */}
                      <div className="flex flex-col items-center justify-center rounded-lg bg-surface-subtle px-3 py-2 shrink-0 min-w-[56px] text-center">
                        <span className="text-caption font-semibold text-ink-muted uppercase">{fmtData(e.data).split(' ')[1]}</span>
                        <span className="text-heading font-bold text-ink leading-none">{fmtData(e.data).split(' ')[0]}</span>
                      </div>
                      {/* Detalhes */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-body font-semibold text-ink">{e.titulo}</h3>
                          <span className={cn('text-caption font-medium rounded-full px-2 py-0.5', tipoColor[e.tipo])}>
                            {tipoLabel[e.tipo]}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-caption text-ink-muted flex-wrap">
                          {e.hora && <span>{e.hora}</span>}
                          {e.local && (
                            <span className="flex items-center gap-1">
                              <IconLocation />{e.local}
                            </span>
                          )}
                          {e.turmas.length > 0 && (
                            <span>{e.turmas.join(', ')}</span>
                          )}
                        </div>
                      </div>
                      {/* Prazo */}
                      <span className={cn('text-caption shrink-0', prazo.cor)}>{prazo.label}</span>
                    </div>
                  </Card.Body>
                </Card>
              )
            })}
          </div>
        </section>
      )}

      {/* Futuros */}
      {futuros.length > 0 && (
        <section>
          <h2 className="text-heading font-semibold text-ink mb-3">Próximos meses</h2>
          <div className="space-y-2">
            {futuros.map((e) => (
              <Card
                key={e.id}
                variant="interactive"
                className="cursor-pointer opacity-75 hover:opacity-100"
                onClick={() => setEventoAtivo(e)}
              >
                <Card.Body>
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center justify-center rounded-lg bg-surface-subtle px-3 py-2 shrink-0 min-w-[56px] text-center">
                      <span className="text-caption font-semibold text-ink-muted uppercase">{fmtData(e.data).split(' ')[1]}</span>
                      <span className="text-heading font-bold text-ink leading-none">{fmtData(e.data).split(' ')[0]}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-body font-medium text-ink">{e.titulo}</h3>
                        <Badge variant={tipoVariant[e.tipo]}>{tipoLabel[e.tipo]}</Badge>
                      </div>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            ))}
          </div>
        </section>
      )}

      {eventos.length === 0 && (
        <div className="text-center py-16 text-ink-muted">
          <p className="text-body">Nenhum evento encontrado para o filtro selecionado.</p>
        </div>
      )}

      {/* Modal de detalhe */}
      <Modal
        open={!!eventoAtivo}
        onClose={() => setEventoAtivo(null)}
        title={eventoAtivo?.titulo ?? ''}
      >
        {eventoAtivo && (
          <div className="space-y-4 mt-2">
            <div className="flex items-center gap-2">
              <span className={cn('text-caption font-medium rounded-full px-2.5 py-1', tipoColor[eventoAtivo.tipo])}>
                {tipoLabel[eventoAtivo.tipo]}
              </span>
              <span className="text-body-sm text-ink-muted">
                {fmtData(eventoAtivo.data)}{eventoAtivo.hora ? ` às ${eventoAtivo.hora}` : ''}
              </span>
            </div>
            <p className="text-body text-ink">{eventoAtivo.descricao}</p>
            {eventoAtivo.local && (
              <p className="flex items-center gap-2 text-body-sm text-ink-muted">
                <IconLocation />
                {eventoAtivo.local}
              </p>
            )}
            {eventoAtivo.turmas.length > 0 && (
              <div>
                <p className="text-caption text-ink-faint mb-1.5">Turmas envolvidas</p>
                <div className="flex flex-wrap gap-1">
                  {eventoAtivo.turmas.map((t) => <Badge key={t} variant="secondary">{t}</Badge>)}
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setEventoAtivo(null)}>Fechar</Button>
              <Button>Editar evento</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
