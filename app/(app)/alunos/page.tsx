'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Button, Input, Select, Card,
  Table, Badge, Avatar,
  ConfirmModal, useToast
} from '@/components/ui'
import type { Column } from '@/components/ui'
import { supabase } from '@/lib/supabase'

// ─── TIPOS ───────────────────────────────────────────────────────────────────

type Status = 'ativo' | 'inativo' | 'transferido'

interface Aluno {
  id: string
  nome: string
  turma: string
  serie: string
  responsavel: string
  status: Status
  frequencia: number
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function AlunosPage() {
  const { success, danger } = useToast()

  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [busca, setBusca] = useState('')
  const [serie, setSerie] = useState('')
  const [statusFiltro, setStatusFiltro] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  const [deleteTarget, setDeleteTarget] = useState<Aluno | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // ── FETCH REAL ────────────────────────────────────────────────────────────
  const fetchAlunos = async () => {
    setIsLoading(true)

    const { data, error } = await supabase
      .from('alunos')
      .select(`
        id,
        nome,
        status,
        responsavel,
        turma_id,
        turmas (
          nome,
          serie
        )
      `)

    if (error) {
      console.error(error)
      danger('Erro ao carregar alunos')
      setIsLoading(false)
      return
    }

    const formatted: Aluno[] = data.map((a: any) => ({
      id: a.id,
      nome: a.nome,
      turma: a.turmas?.nome ?? 'Sem turma',
      serie: a.turmas?.serie ?? '',
      responsavel: a.responsavel ?? '-',
      status: a.status,
      frequencia: Math.floor(Math.random() * 30) + 70 // TEMPORÁRIO
    }))

    setAlunos(formatted)
    setIsLoading(false)
  }

  useEffect(() => {
    fetchAlunos()
  }, [])

  // ── FILTRO ────────────────────────────────────────────────────────────────
  const filtered = alunos.filter((a) => {
    const matchBusca =
      a.nome.toLowerCase().includes(busca.toLowerCase()) ||
      a.turma.toLowerCase().includes(busca.toLowerCase())

    const matchSerie = !serie || a.serie === serie
    const matchStatus = !statusFiltro || a.status === statusFiltro

    return matchBusca && matchSerie && matchStatus
  })

  // ── DELETE ────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return

    setIsDeleting(true)

    const { error } = await supabase
      .from('alunos')
      .delete()
      .eq('id', deleteTarget.id)

    if (error) {
      danger('Erro ao excluir aluno')
    } else {
      success('Aluno removido')
      fetchAlunos()
    }

    setIsDeleting(false)
    setDeleteTarget(null)
  }

  // ── COLUNAS ───────────────────────────────────────────────────────────────
  const columns: Column<Aluno>[] = [
    {
      key: 'aluno',
      header: 'Aluno',
      accessor: (row) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.nome} size="sm" />
          <div>
            <p className="text-body-sm font-medium text-ink">{row.nome}</p>
            <p className="text-caption text-ink-muted">{row.responsavel}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'turma',
      header: 'Turma',
      accessor: (row) => (
        <span className="text-body-sm text-ink">{row.turma}</span>
      ),
    },
    {
      key: 'frequencia',
      header: 'Frequência',
      align: 'center',
      width: 'w-32',
      accessor: (row) => (
        <span
          className={
            row.frequencia >= 90
              ? 'text-body-sm font-semibold text-success-600'
              : row.frequencia >= 75
              ? 'text-body-sm font-semibold text-warning-600'
              : 'text-body-sm font-semibold text-danger-600'
          }
        >
          {row.frequencia}%
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      width: 'w-32',
      accessor: (row) => (
        <Badge
          variant={
            row.status === 'ativo'
              ? 'success'
              : row.status === 'inativo'
              ? 'danger'
              : 'neutral'
          }
          dot
        >
          {row.status}
        </Badge>
      ),
    },
    {
      key: 'acoes',
      header: '',
      align: 'right',
      width: 'w-28',
      accessor: (row) => (
        <div className="flex items-center justify-end gap-1">
          <Link href={`/alunos/${row.id}`}>
            <Button variant="ghost" size="xs">Ver</Button>
          </Link>
          <Link href={`/alunos/${row.id}/editar`}>
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-display font-semibold text-ink">Alunos</h1>
          <p className="text-body text-ink-muted mt-1">
            {filtered.length} aluno(s)
          </p>
        </div>

        <div className="flex gap-3 flex-wrap">
          <Button variant="outline" onClick={fetchAlunos} isLoading={isLoading}>
            Atualizar
          </Button>

          <Link href="/alunos/importar">
            <Button variant="outline" className="flex items-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V3" />
              </svg>
              Importar XLSX
            </Button>
          </Link>

          <Link href="/alunos/novo">
            <Button>+ Novo aluno</Button>
          </Link>
        </div>
      </div>

      {/* FILTROS */}
      <Card>
        <Card.Body>
          <div className="flex gap-4">
            <Input
              placeholder="Buscar..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />

            <Select
              placeholder="Série"
              value={serie}
              onChange={(e) => setSerie(e.target.value)}
              options={[
                { value: '1', label: '1º Ano' },
                { value: '2', label: '2º Ano' },
                { value: '3', label: '3º Ano' },
              ]}
            />

            <Select
              placeholder="Status"
              value={statusFiltro}
              onChange={(e) => setStatusFiltro(e.target.value)}
              options={[
                { value: 'ativo', label: 'Ativo' },
                { value: 'inativo', label: 'Inativo' },
                { value: 'transferido', label: 'Transferido' },
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
        title="Excluir aluno"
        description={`Excluir ${deleteTarget?.nome}?`}
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  )
}