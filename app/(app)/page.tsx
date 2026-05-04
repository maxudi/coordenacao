'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, Badge, Alert, Avatar, Progress, Button, Select, Table } from '@/components/ui'
import type { Column } from '@/components/ui'
import { cn } from '@/lib/utils'

// --- ?CONES -------------------------------------------------------------------

function IconUsers()    { return <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg> }
function IconAcademic() { return <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" /></svg> }
function IconChartBar() { return <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg> }
function IconExclamation() { return <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg> }
function IconCalendar()    { return <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg> }
function IconPlus()        { return <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg> }
function IconEye()         { return <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> }
function IconMessage()     { return <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" /></svg> }

// ─── TIPOS ───────────────────────────────────────────────────────────────────

type NivelKPI    = 'danger' | 'warning' | 'primary' | 'success'
type NivelAlerta = 'critico' | 'atencao'
type StatusProf  = 'ok' | 'atencao' | 'critico'

interface KPI       { label: string; value: string; sub: string; nivel: NivelKPI; icon: React.ReactNode }
interface Alerta    { id: number; aluno: string; turma: string; motivo: string; nivel: NivelAlerta }
interface Professor { id: string; nome: string; disciplina: string; turmas: number; media: number; status: StatusProf }

// ─── MOCK DATA ────────────────────────────────────────────────────────────────

const PERIODOS = [
  { value: 'maio-2026',  label: 'Maio 2026'        },
  { value: 'abril-2026', label: 'Abril 2026'       },
  { value: '1bim-2026',  label: '1º Bimestre 2026' },
  { value: '2026',       label: 'Ano letivo 2026'  },
]

const kpis: KPI[] = [
  { label: 'Alunos em Risco',  value: '23',  sub: '↑ 5 vs. semana passada',    nivel: 'danger',  icon: <IconUsers />       },
  { label: 'Média Geral',      value: '7,4', sub: '↓ 0,3 vs. bimestre ant.',   nivel: 'warning', icon: <IconAcademic />    },
  { label: 'Frequência Média', value: '91%', sub: '↓ 2% vs. mês anterior',     nivel: 'primary', icon: <IconChartBar />    },
  { label: 'Alertas Ativos',   value: '12',  sub: '3 críticos · 9 atenção',    nivel: 'danger',  icon: <IconExclamation /> },
]

const desempenho = [
  { turma: '1º A', media: 8.2 },
  { turma: '1º B', media: 7.6 },
  { turma: '2º A', media: 6.8 },
  { turma: '2º B', media: 7.9 },
  { turma: '3º A', media: 8.5 },
  { turma: '3º B', media: 6.1 },
  { turma: '4º A', media: 7.3 },
  { turma: '4º B', media: 8.0 },
]

const frequencias = [
  { turma: '1º Ano A', professor: 'Ana Lima',     freq: 94 },
  { turma: '2º Ano B', professor: 'Carlos Reis',  freq: 88 },
  { turma: '3º Ano A', professor: 'Julia Mota',   freq: 96 },
  { turma: '3º Ano C', professor: 'Roberto Dias', freq: 73 },
  { turma: '4º Ano B', professor: 'Paula Souza',  freq: 82 },
]

const alertas: Alerta[] = [
  { id: 1, aluno: 'Lucas Ferreira', turma: '3º Ano B', motivo: 'Frequência: 68% (mín. 75%)',        nivel: 'critico' },
  { id: 2, aluno: 'Mariana Costa',  turma: '2º Ano A', motivo: 'Média caiu de 7,8 → 5,2',          nivel: 'critico' },
  { id: 3, aluno: 'Pedro Santos',   turma: '1º Ano C', motivo: 'Documentação pendente há 15 dias',  nivel: 'atencao' },
  { id: 4, aluno: 'Ana Rodrigues',  turma: '3º Ano A', motivo: 'Sem retorno dos responsáveis',      nivel: 'atencao' },
  { id: 5, aluno: 'Gabriel Nunes',  turma: '4º Ano B', motivo: '3 faltas consecutivas esta semana', nivel: 'atencao' },
]

const professores: Professor[] = [
  { id: '1', nome: 'Ana Lima',      disciplina: 'Matemática', turmas: 3, media: 8.2, status: 'ok'      },
  { id: '2', nome: 'Carlos Reis',   disciplina: 'Português',  turmas: 2, media: 7.4, status: 'atencao' },
  { id: '3', nome: 'Julia Mota',    disciplina: 'Ciências',   turmas: 2, media: 8.8, status: 'ok'      },
  { id: '4', nome: 'Tiago Almeida', disciplina: 'Física',     turmas: 1, media: 6.1, status: 'critico' },
  { id: '5', nome: 'Paula Souza',   disciplina: 'Ed. Física', turmas: 3, media: 9.1, status: 'ok'      },
]

const projetos = [
  { id: 1, nome: 'Reforço Escolar — Matemática', turmas: '1º, 2º Ano',      progresso: 65, tag: 'Em andamento' },
  { id: 2, nome: 'Semana Cultural 2026',          turmas: 'Todas as turmas', progresso: 30, tag: 'Planejamento'  },
  { id: 3, nome: 'Nivelamento de Leitura',        turmas: '1º, 2º, 3º Ano', progresso: 80, tag: 'Em andamento'  },
]

const eventos = [
  { id: 1, titulo: 'Conselho de Classe — 1º Ano', dia: '07', mes: 'Mai', hora: '09:00', tipo: 'Reunião'        },
  { id: 2, titulo: 'Entrega de boletins',          dia: '10', mes: 'Mai', hora: '—',     tipo: 'Administrativo' },
  { id: 3, titulo: 'Reunião de pais — 3º Ano B',  dia: '14', mes: 'Mai', hora: '18:00', tipo: 'Reunião'        },
  { id: 4, titulo: 'Feriado — Corpus Christi',     dia: '19', mes: 'Jun', hora: '—',     tipo: 'Feriado'        },
]

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const kpiStyle: Record<NivelKPI, { iconBg: string; iconText: string }> = {
  danger:  { iconBg: 'bg-danger-50',  iconText: 'text-danger-600'  },
  warning: { iconBg: 'bg-warning-50', iconText: 'text-warning-600' },
  primary: { iconBg: 'bg-primary-50', iconText: 'text-primary-600' },
  success: { iconBg: 'bg-success-50', iconText: 'text-success-600' },
}

const tipoEventoClass: Record<string, string> = {
  'Reunião':         'bg-primary-100 text-primary-700',
  'Administrativo':  'bg-secondary-100 text-secondary-700',
  'Feriado':         'bg-warning-100 text-warning-700',
}

const statusLabel:   Record<StatusProf, string>                            = { ok: 'Regular', atencao: 'Atenção', critico: 'Crítico' }
const statusVariant: Record<StatusProf, 'success' | 'warning' | 'danger'> = { ok: 'success', atencao: 'warning', critico: 'danger' }

// ─── SUB-COMPONENTES ──────────────────────────────────────────────────────────

function KPICard({ label, value, sub, nivel, icon }: KPI) {
  const s = kpiStyle[nivel]
  return (
    <Card>
      <Card.Body>
        <div className="flex items-center justify-between">
          <span className={cn('flex h-10 w-10 items-center justify-center rounded-lg', s.iconBg, s.iconText)}>
            {icon}
          </span>
          <span className={cn('text-caption font-medium', s.iconText)}>{sub.split(' ')[0]}</span>
        </div>
        <div className="mt-3">
          <p className="text-display-sm font-bold text-ink">{value}</p>
          <p className="text-body-sm text-ink-muted mt-0.5">{label}</p>
          <p className="text-caption text-ink-faint mt-1">{sub}</p>
        </div>
      </Card.Body>
    </Card>
  )
}

function BarChart({ data }: { data: { turma: string; media: number }[] }) {
  return (
    <div>
      <div className="flex items-stretch gap-1.5 h-36">
        {data.map(({ turma, media }) => {
          const pct   = Math.round((media / 10) * 100)
          const color = media >= 7.5 ? 'bg-success-500' : media >= 6.0 ? 'bg-warning-500' : 'bg-danger-500'
          return (
            <div key={turma} className="flex flex-1 flex-col items-center justify-end gap-1">
              <span className="text-caption font-semibold text-ink">{media.toFixed(1)}</span>
              <div className={cn('w-full rounded-t-sm', color)} style={{ height: `${pct}%` }} />
            </div>
          )
        })}
      </div>
      <div className="flex gap-1.5 mt-1.5 border-t border-surface-border pt-1.5">
        {data.map(({ turma }) => (
          <span key={turma} className="flex-1 text-center text-caption text-ink-muted">{turma}</span>
        ))}
      </div>
    </div>
  )
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [periodo, setPeriodo] = useState('maio-2026')

  const profCols: Column<Professor>[] = [
    {
      key: 'nome', header: 'Professor',
      render: (p) => (
        <div className="flex items-center gap-3">
          <Avatar name={p.nome} size="sm" />
          <div>
            <p className="text-body-sm font-medium text-ink">{p.nome}</p>
            <p className="text-caption text-ink-muted">{p.disciplina}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'turmas', header: 'Turmas', align: 'center',
      render: (p) => <span className="text-body-sm text-ink-muted">{p.turmas}</span>,
    },
    {
      key: 'media', header: 'Média', align: 'center',
      render: (p) => (
        <span className={cn(
          'text-body-sm font-bold',
          p.media >= 7.5 ? 'text-success-600' : p.media >= 6.0 ? 'text-warning-600' : 'text-danger-600',
        )}>
          {p.media.toFixed(1)}
        </span>
      ),
    },
    {
      key: 'status', header: 'Status',
      render: (p) => <Badge variant={statusVariant[p.status]}>{statusLabel[p.status]}</Badge>,
    },
    {
      key: 'acao', header: '', align: 'right',
      render: (p) => (
        <Link href={`/professores/${p.id}`}>
          <Button variant="ghost" size="xs">Ver</Button>
        </Link>
      ),
    },
  ]

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">

      {/* ── HEADER ────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-display font-bold text-ink">Dashboard Pedagógico</h1>
          <p className="text-body text-ink-muted mt-1" suppressHydrationWarning>
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Select
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            options={PERIODOS}
          />
          <Link href="/alunos/novo">
            <Button leftIcon={<IconPlus />}>Novo aluno</Button>
          </Link>
        </div>
      </div>

      {/* ── ALERTA CRÍTICO ────────────────────────────────────────────── */}
      <Alert
        variant="danger"
        title="2 alunos em situação crítica"
        description="Lucas Ferreira (frequência 68%) e Mariana Costa (média 5,2) precisam de ação imediata."
      />

      {/* ── KPIs ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((k) => <KPICard key={k.label} {...k} />)}
      </div>

      {/* ── GRÁFICOS ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        <Card className="lg:col-span-3">
          <Card.Header>
            <div className="flex items-center justify-between">
              <h2 className="text-heading font-semibold text-ink">Desempenho por Turma</h2>
              <span className="text-caption text-ink-muted">Média · escala 0–10</span>
            </div>
          </Card.Header>
          <Card.Body>
            <BarChart data={desempenho} />
            <div className="flex items-center gap-4 mt-4 pt-3 border-t border-surface-border">
              <span className="flex items-center gap-1.5 text-caption text-ink-muted">
                <span className="inline-block h-2.5 w-2.5 rounded-sm bg-success-500" />≥ 7,5 — Regular
              </span>
              <span className="flex items-center gap-1.5 text-caption text-ink-muted">
                <span className="inline-block h-2.5 w-2.5 rounded-sm bg-warning-500" />≥ 6,0 — Atenção
              </span>
              <span className="flex items-center gap-1.5 text-caption text-ink-muted">
                <span className="inline-block h-2.5 w-2.5 rounded-sm bg-danger-500" />&lt; 6,0 — Crítico
              </span>
            </div>
          </Card.Body>
        </Card>

        <Card className="lg:col-span-2">
          <Card.Header>
            <div className="flex items-center justify-between">
              <h2 className="text-heading font-semibold text-ink">Frequência por Turma</h2>
              <span className="text-caption text-ink-muted">Mês atual</span>
            </div>
          </Card.Header>
          <Card.Body>
            <ul className="space-y-4">
              {frequencias.map((f) => (
                <li key={f.turma}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="min-w-0">
                      <span className="text-body-sm font-semibold text-ink">{f.turma}</span>
                      <span className="text-caption text-ink-faint ml-2">{f.professor}</span>
                    </div>
                    <span className={cn(
                      'text-body-sm font-bold shrink-0 ml-2',
                      f.freq >= 90 ? 'text-success-600' : f.freq >= 80 ? 'text-warning-600' : 'text-danger-600',
                    )}>{f.freq}%</span>
                  </div>
                  <Progress
                    value={f.freq}
                    variant={f.freq >= 90 ? 'success' : f.freq >= 80 ? 'default' : 'danger'}
                  />
                </li>
              ))}
            </ul>
          </Card.Body>
        </Card>

      </div>

      {/* ── ALERTAS + AGENDA + PROJETOS ───────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Alertas Inteligentes */}
        <Card className="lg:col-span-3">
          <Card.Header>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-heading font-semibold text-ink">Alertas Inteligentes</h2>
                <Badge variant="danger" dot>{alertas.length}</Badge>
              </div>
              <Link href="/alunos"><Button variant="ghost" size="xs">Ver todos</Button></Link>
            </div>
          </Card.Header>
          <Card.Body className="p-0">
            <ul className="divide-y divide-surface-border">
              {alertas.map((a) => (
                <li key={a.id} className="flex items-center gap-3 px-6 py-3.5 hover:bg-surface-subtle transition-colors">
                  <Avatar name={a.aluno} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-body-sm font-semibold text-ink">{a.aluno}</span>
                      <Badge variant={a.nivel === 'critico' ? 'danger' : 'warning'}>
                        {a.nivel === 'critico' ? 'Crítico' : 'Atenção'}
                      </Badge>
                    </div>
                    <p className="text-caption text-ink-muted mt-0.5">{a.turma} · {a.motivo}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link href={`/alunos/${a.id}`}>
                      <Button variant="outline" size="xs" leftIcon={<IconEye />}>Detalhes</Button>
                    </Link>
                    <Link href={`/mensagens?aluno=${a.id}`}>
                      <Button variant="ghost" size="xs" leftIcon={<IconMessage />}>Mensagem</Button>
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </Card.Body>
        </Card>

        {/* Coluna lateral */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* Projetos Ativos */}
          <Card>
            <Card.Header>
              <div className="flex items-center justify-between">
                <h2 className="text-heading font-semibold text-ink">Projetos Ativos</h2>
                <Badge variant="secondary">{projetos.length}</Badge>
              </div>
            </Card.Header>
            <Card.Body className="p-0">
              <ul className="divide-y divide-surface-border">
                {projetos.map((proj) => (
                  <li key={proj.id} className="px-6 py-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0">
                        <p className="text-body-sm font-medium text-ink leading-tight">{proj.nome}</p>
                        <p className="text-caption text-ink-muted mt-0.5">{proj.turmas}</p>
                      </div>
                      <Badge variant={proj.tag === 'Em andamento' ? 'secondary' : 'neutral'} className="shrink-0 whitespace-nowrap">
                        {proj.tag}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1"><Progress value={proj.progresso} /></div>
                      <span className="text-caption font-semibold text-ink-muted shrink-0 w-8 text-right">{proj.progresso}%</span>
                    </div>
                  </li>
                ))}
              </ul>
            </Card.Body>
          </Card>

          {/* Próximos Eventos */}
          <Card>
            <Card.Header>
              <div className="flex items-center justify-between">
                <h2 className="text-heading font-semibold text-ink">Próximos Eventos</h2>
                <Link href="/agenda"><Button variant="ghost" size="xs">Ver agenda</Button></Link>
              </div>
            </Card.Header>
            <Card.Body className="p-0">
              <ul className="divide-y divide-surface-border">
                {eventos.map((e) => (
                  <li key={e.id} className="flex items-start gap-3 px-6 py-3">
                    <div className="flex flex-col items-center justify-center rounded-lg bg-surface-subtle px-2.5 py-1.5 shrink-0 min-w-[44px]">
                      <span className="text-caption font-semibold text-ink-muted uppercase tracking-wide leading-none">{e.mes}</span>
                      <span className="text-heading-sm font-bold text-ink leading-tight mt-0.5">{e.dia}</span>
                    </div>
                    <div className="min-w-0 flex-1 pt-0.5">
                      <p className="text-body-sm font-medium text-ink leading-tight">{e.titulo}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {e.hora !== '—' && (
                          <span className="flex items-center gap-1 text-caption text-ink-muted">
                            <IconCalendar /> {e.hora}
                          </span>
                        )}
                        <span className={cn('text-caption font-medium rounded px-1.5 py-0.5', tipoEventoClass[e.tipo])}>
                          {e.tipo}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </Card.Body>
          </Card>

        </div>
      </div>

      {/* ── PROFESSORES ───────────────────────────────────────────────── */}
      <Card>
        <Card.Header>
          <div className="flex items-center justify-between">
            <h2 className="text-heading font-semibold text-ink">Professores</h2>
            <Link href="/professores"><Button variant="outline" size="sm">Ver todos</Button></Link>
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          <Table
            columns={profCols}
            data={professores}
            keyExtractor={(p) => p.id}
          />
        </Card.Body>
      </Card>

    </div>
  )
}
