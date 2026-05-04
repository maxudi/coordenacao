'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Button, Input, Select, Card,
  Table, Badge, ConfirmModal, useToast, Avatar
} from '@/components/ui'
import type { Column } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

// ─── TIPOS ───────────────────────────────────────────────────────────────────

interface TurmaComDados {
  id: string
  nome: string
  serie: string
  turno: string
  alunos: number
  alunosAtivos: number
  professor_nome?: string
  professor_avatar?: string
  frequencia_media?: number
}

const TURNO_LABEL: Record<string, string> = {
  manha: 'Manhã',
  tarde: 'Tarde',
  noite: 'Noite',
  integral: 'Integral',
}

const SERIE_OPCOES = [
  { value: '1º Ano', label: '1º Ano' },
  { value: '2º Ano', label: '2º Ano' },
  { value: '3º Ano', label: '3º Ano' },
  { value: '4º Ano', label: '4º Ano' },
  { value: '5º Ano', label: '5º Ano' },
  { value: '6º Ano', label: '6º Ano' },
  { value: '7º Ano', label: '7º Ano' },
  { value: '8º Ano', label: '8º Ano' },
  { value: '9º Ano', label: '9º Ano' },
]

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function TurmasPage() {
  const { success, danger } = useToast()

  const [turmas, setTurmas] = useState<TurmaComDados[]>([])
  const [busca, setBusca] = useState('')
  const [serie, setSerie] = useState('')
  const [turno, setTurno] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  const [deleteTarget, setDeleteTarget] = useState<TurmaComDados | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // ── FETCH ────────────────────────────────────────────────────────────────
  const fetchTurmas = async () => {
    setIsLoading(true)

    const { data: turmasData, error: turmasError } = await (supabase as any)
      .from('turmas')
      .select('id, nome, serie, turno, professor_id, professores(nome)')

    if (turmasError) {
      console.error(turmasError)
      danger('Erro ao carregar turmas')
      setIsLoading(false)
      return
    }

    // Buscar alunos
    const { data: alunos } = await (supabase as any)
      .from('alunos')
      .select('id, turma_id, status')

    // Buscar frequência resumo
    const { data: freq } = await (supabase as any)
      .from('frequencia_resumo')
      .select('aluno_id, percentual')

    // Mapear dados
    const alunosPorTurma: Record<string, { total: number; ativos: number }> = {}
    const frequenciaPorAluno: Record<string, number> = {}

    for (const a of alunos ?? []) {
      if (!alunosPorTurma[a.turma_id]) {
        alunosPorTurma[a.turma_id] = { total: 0, ativos: 0 }
      }
      alunosPorTurma[a.turma_id].total++
      if (a.status === 'ativo') {
        alunosPorTurma[a.turma_id].ativos++
      }
    }

    for (const f of freq ?? []) {
      frequenciaPorAluno[f.aluno_id] = f.percentual ?? 0
    }

    // Calcular frequência média por turma
    const frequenciaMedia: Record<string, { sum: number; count: number }> = {}
    for (const a of alunos ?? []) {
      if (!frequenciaMedia[a.turma_id]) {
        frequenciaMedia[a.turma_id] = { sum: 0, count: 0 }
      }
      frequenciaMedia[a.turma_id].sum += frequenciaPorAluno[a.id] ?? 0
      frequenciaMedia[a.turma_id].count++
    }

    const formatted: TurmaComDados[] = (turmasData ?? []).map((t: any) => ({
      id: t.id,
      nome: t.nome,
      serie: t.serie,
      turno: t.turno,
      alunos: alunosPorTurma[t.id]?.total ?? 0,
      alunosAtivos: alunosPorTurma[t.id]?.ativos ?? 0,
      professor_nome: t.professores?.nome ?? '-',
      frequencia_media: frequenciaMedia[t.id]?.count 
        ? Math.round(frequenciaMedia[t.id].sum / frequenciaMedia[t.id].count)
        : 0,
    }))

    setTurmas(formatted)
    setIsLoading(false)
  }

  useEffect(() => {
    fetchTurmas()
  }, [])

  // ── FILTRO ────────────────────────────────────────────────────────────────
  const filtered = turmas.filter(t => {
    const matchBusca = t.nome.toLowerCase().includes(busca.toLowerCase()) ||
                       t.professor_nome?.toLowerCase().includes(busca.toLowerCase())
    const matchSerie = !serie || t.serie === serie
    const matchTurno = !turno || t.turno === turno
    return matchBusca && matchSerie && matchTurno
  })

  // ── ESTATÍSTICAS ────────────────────────────────────────────────────────
  const totalTurmas = turmas.length
  const totalAlunos = turmas.reduce((sum, t) => sum + t.alunos, 0)
  const freqMedia = turmas.length > 0 
    ? Math.round(turmas.reduce((sum, t) => sum + (t.frequencia_media ?? 0), 0) / turmas.length)
    : 0
  const abaixo80 = turmas.filter(t => (t.frequencia_media ?? 0) < 80).length

  // ── DELETE ────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return

    setIsDeleting(true)

    const { error } = await (supabase as any)
      .from('turmas')
      .delete()
      .eq('id', deleteTarget.id)

    if (error) {
      danger('Erro ao excluir turma')
    } else {
      success('Turma removida')
      fetchTurmas()
    }

    setIsDeleting(false)
    setDeleteTarget(null)
  }

  // ── COLUNAS ───────────────────────────────────────────────────────────────
  const columns: Column<TurmaComDados>[] = [
    {
      key: 'nome',
      header: 'TURMA',
      accessor: (row) => (
        <div>
          <p className="text-body-sm font-medium text-ink">{row.nome}</p>
          <p className="text-caption text-body">{row.serie}</p>
        </div>
      ),
    },
    {
      key: 'turno',
      header: 'TURNO',
      accessor: (row) => (
        <Badge variant={
          row.turno === 'manha' ? 'primary' :
          row.turno === 'tarde' ? 'secondary' :
          row.turno === 'integral' ? 'success' : 'neutral'
        }>
          {TURNO_LABEL[row.turno] ?? row.turno}
        </Badge>
      ),
    },
    {
      key: 'professor',
      header: 'PROF. RESPONSÁVEL',
      accessor: (row) => (
        <div className="flex items-center gap-2">
          <Avatar name={row.professor_nome || '-'} size="sm" />
          <span className="text-body-sm text-ink">{row.professor_nome || '-'}</span>
        </div>
      ),
    },
    {
      key: 'alunos',
      header: 'ALUNOS',
      align: 'center',
      accessor: (row) => (
        <span className="text-body-sm font-medium text-ink">
          {row.alunosAtivos}/{row.alunos}
        </span>
      ),
    },
    {
      key: 'frequencia',
      header: 'FREQUÊNCIA',
      accessor: (row) => {
        const freq = row.frequencia_media ?? 0
        const cor = freq >= 90 ? 'bg-success-600' : 
                   freq >= 80 ? 'bg-accent-500' :
                   'bg-danger-600'
        return (
          <div className="flex items-center gap-2 w-40">
            <div className="flex-1 bg-neutral-200 rounded-full h-2 overflow-hidden">
              <div className={cn('h-full', cor)} style={{ width: `${freq}%` }} />
            </div>
            <span className={cn('text-body-sm font-medium w-12 text-right',
              freq >= 90 ? 'text-success-600' :
              freq >= 80 ? 'text-accent-500' :
              'text-danger-600'
            )}>
              {freq}%
            </span>
          </div>
        )
      },
    },
    {
      key: 'acoes',
      header: '',
      align: 'right',
      width: 'w-40',
      accessor: (row) => (
        <div className="flex items-center justify-end gap-1">
          <Link href={`/turmas/${row.id}`}>
            <Button variant="ghost" size="xs">Ver</Button>
          </Link>
          <Link href={`/turmas/${row.id}/editar`}>
            <Button variant="ghost" size="xs">Editar</Button>
          </Link>
          <Button
            variant="ghost"
            size="xs"
            className="text-danger-600 hover:bg-danger-50"
            onClick={() => setDeleteTarget(row)}
          >
            Excluir
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="p-8 space-y-6">

      {/* HEADER */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-display font-semibold text-ink">Turmas</h1>
          <p className="text-body text-ink-muted mt-1">
            {filtered.length} turma(s) ativa(s)
          </p>
        </div>

        <Link href="/turmas/novo">
          <Button>+ Nova turma</Button>
        </Link>
      </div>

      {/* CARDS INFORMATIVOS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <Card.Body>
            <p className="text-caption text-body mb-2">Total de turmas</p>
            <p className="text-display-sm font-semibold text-ink">{totalTurmas}</p>
          </Card.Body>
        </Card>

        <Card>
          <Card.Body>
            <p className="text-caption text-body mb-2">Total de alunos</p>
            <p className="text-display-sm font-semibold text-accent-500">{totalAlunos}</p>
          </Card.Body>
        </Card>

        <Card>
          <Card.Body>
            <p className="text-caption text-body mb-2">Freq. média</p>
            <p className="text-display-sm font-semibold text-accent-500">{freqMedia}%</p>
          </Card.Body>
        </Card>

        <Card>
          <Card.Body>
            <p className="text-caption text-body mb-2">Abaixo de 80%</p>
            <p className="text-display-sm font-semibold text-danger-600">{abaixo80}</p>
          </Card.Body>
        </Card>
      </div>

      {/* FILTROS */}
      <Card>
        <Card.Body>
          <div className="flex gap-4 flex-wrap">
            <Input
              placeholder="Buscar turma ou professor..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="flex-1 min-w-48"
            />

            <Select
              placeholder="Série"
              value={serie}
              onChange={(e) => setSerie(e.target.value)}
              options={SERIE_OPCOES}
            />

            <Select
              placeholder="Turno"
              value={turno}
              onChange={(e) => setTurno(e.target.value)}
              options={[
                { value: 'manha', label: 'Manhã' },
                { value: 'tarde', label: 'Tarde' },
                { value: 'noite', label: 'Noite' },
                { value: 'integral', label: 'Integral' },
              ]}
            />
          </div>
        </Card.Body>
      </Card>

      {/* TABELA */}
      <Table
        columns={columns}
        data={filtered}
        keyExtractor={(row) => row.id}
        isLoading={isLoading}
      />

      {/* MODAL */}
      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Excluir turma"
        description={`Excluir ${deleteTarget?.nome}?`}
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  )
}

