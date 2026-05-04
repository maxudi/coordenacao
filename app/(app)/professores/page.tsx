'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Button, Input, Select, Card,
  Table, Badge, Avatar, ConfirmModal, useToast
} from '@/components/ui'
import type { Column } from '@/components/ui'
import { supabase } from '@/lib/supabase'

// ─── TIPOS ───────────────────────────────────────────────────────────────────

interface Professor {
  id: string
  nome: string
  email: string
  telefone: string | null
  status: string
  disciplinas: number
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function ProfessoresPage() {
  const { success, danger } = useToast()

  const [professores, setProfessores] = useState<Professor[]>([])
  const [busca, setBusca] = useState('')
  const [status, setStatus] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  const [deleteTarget, setDeleteTarget] = useState<Professor | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // ── FETCH ────────────────────────────────────────────────────────────────
  const fetchProfessores = async () => {
    setIsLoading(true)

    const { data, error } = await (supabase as any)
      .from('professores')
      .select('id, nome, email, telefone, status')
      .order('nome')

    if (error) {
      console.error(error)
      danger('Erro ao carregar professores')
      setIsLoading(false)
      return
    }

    // Contar disciplinas por professor
    const { data: ptd } = await (supabase as any)
      .from('professor_turma_disciplina')
      .select('professor_id')

    const discPorProf: Record<string, number> = {}
    for (const item of ptd ?? []) {
      discPorProf[item.professor_id] = (discPorProf[item.professor_id] ?? 0) + 1
    }

    const formatted: Professor[] = (data ?? []).map((p: any) => ({
      id: p.id,
      nome: p.nome,
      email: p.email ?? '—',
      telefone: p.telefone,
      status: p.status ?? 'ativo',
      disciplinas: discPorProf[p.id] ?? 0,
    }))

    setProfessores(formatted)
    setIsLoading(false)
  }

  useEffect(() => {
    fetchProfessores()
  }, [])

  // ── FILTRO ────────────────────────────────────────────────────────────────
  const filtered = professores.filter(p => {
    const matchBusca =
      p.nome.toLowerCase().includes(busca.toLowerCase()) ||
      p.email.toLowerCase().includes(busca.toLowerCase())

    const matchStatus = !status || p.status === status

    return matchBusca && matchStatus
  })

  // ── DELETE ────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return

    setIsDeleting(true)

    const { error } = await (supabase as any)
      .from('professores')
      .delete()
      .eq('id', deleteTarget.id)

    if (error) {
      danger('Erro ao excluir professor')
    } else {
      success('Professor removido')
      fetchProfessores()
    }

    setIsDeleting(false)
    setDeleteTarget(null)
  }

  // ── COLUNAS ───────────────────────────────────────────────────────────────
  const columns: Column<Professor>[] = [
    {
      key: 'professor',
      header: 'Professor',
      accessor: (row) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.nome} size="sm" />
          <div>
            <p className="text-body-sm font-medium text-ink">{row.nome}</p>
            <p className="text-caption text-body">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'telefone',
      header: 'Telefone',
      accessor: (row) => (
        <span className="text-body-sm text-ink">{row.telefone ?? '—'}</span>
      ),
    },
    {
      key: 'disciplinas',
      header: 'Disciplinas',
      align: 'center',
      width: 'w-20',
      accessor: (row) => (
        <Badge variant="neutral">{row.disciplinas}</Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      width: 'w-24',
      accessor: (row) => (
        <Badge
          variant={row.status === 'ativo' ? 'success' : 'danger'}
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
          <Link href={`/professores/${row.id}`}>
            <Button variant="ghost" size="xs">Ver</Button>
          </Link>
          <Link href={`/professores/${row.id}/editar`}>
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
          <h1 className="text-display font-semibold text-ink">Professores</h1>
          <p className="text-body text-ink-muted mt-1">
            {filtered.length} professor(es)
          </p>
        </div>

        <div className="flex gap-3">
          <Button onClick={fetchProfessores} isLoading={isLoading}>
            Atualizar
          </Button>

          <Link href="/professores/novo">
            <Button>+ Novo professor</Button>
          </Link>
        </div>
      </div>

      {/* FILTROS */}
      <Card>
        <Card.Body>
          <div className="flex gap-4 flex-wrap">
            <Input
              placeholder="Buscar por nome ou email..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="flex-1 min-w-48"
            />

            <Select
              placeholder="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={[
                { value: 'ativo', label: 'Ativo' },
                { value: 'inativo', label: 'Inativo' },
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
        title="Excluir professor"
        description={`Excluir ${deleteTarget?.nome}?`}
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  )
}
