'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Button, Input, Select, Card,
  Table, Badge, ConfirmModal, useToast, Avatar, Modal, Textarea
} from '@/components/ui'
import type { Column } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

// ─── TIPOS ───────────────────────────────────────────────────────────────────

interface Ocorrencia {
  id: string
  aluno_id: string
  aluno_nome: string
  turma_nome: string
  tipo: string
  descricao: string
  status: string
  created_at: string
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function OcorrenciasPage() {
  const { success, danger } = useToast()

  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([])
  const [busca, setBusca] = useState('')
  const [status, setStatus] = useState('')
  const [tipo, setTipo] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  const [deleteTarget, setDeleteTarget] = useState<Ocorrencia | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const [selectedOcorrencia, setSelectedOcorrencia] = useState<Ocorrencia | null>(null)
  const [isResolving, setIsResolving] = useState(false)

  // ── FETCH ────────────────────────────────────────────────────────────────
  const fetchOcorrencias = async () => {
    setIsLoading(true)

    const { data, error } = await (supabase as any)
      .from('ocorrencias')
      .select(`
        id,
        aluno_id,
        tipo,
        descricao,
        status,
        created_at,
        alunos(nome, turma_id, turmas(nome))
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error(error)
      danger('Erro ao carregar ocorrências')
      setIsLoading(false)
      return
    }

    const formatted: Ocorrencia[] = (data ?? []).map((o: any) => ({
      id: o.id,
      aluno_id: o.aluno_id,
      aluno_nome: o.alunos?.nome || '-',
      turma_nome: o.alunos?.turmas?.nome || '-',
      tipo: o.tipo,
      descricao: o.descricao,
      status: o.status,
      created_at: o.created_at,
    }))

    setOcorrencias(formatted)
    setIsLoading(false)
  }

  useEffect(() => {
    fetchOcorrencias()
  }, [])

  // ── FILTRO ────────────────────────────────────────────────────────────────
  const filtered = ocorrencias.filter(o => {
    const matchBusca = o.aluno_nome.toLowerCase().includes(busca.toLowerCase()) ||
                       o.turma_nome.toLowerCase().includes(busca.toLowerCase()) ||
                       o.descricao.toLowerCase().includes(busca.toLowerCase())
    const matchStatus = !status || o.status === status
    const matchTipo = !tipo || o.tipo === tipo
    return matchBusca && matchStatus && matchTipo
  })

  // ── DELETE ────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return

    setIsDeleting(true)

    const { error } = await (supabase as any)
      .from('ocorrencias')
      .delete()
      .eq('id', deleteTarget.id)

    if (error) {
      danger('Erro ao excluir ocorrência')
    } else {
      success('Ocorrência removida')
      fetchOcorrencias()
    }

    setIsDeleting(false)
    setDeleteTarget(null)
  }

  // ── RESOLVER ──────────────────────────────────────────────────────────────
  const handleResolve = async () => {
    if (!selectedOcorrencia) return

    setIsResolving(true)

    const { error } = await (supabase as any)
      .from('ocorrencias')
      .update({ status: 'resolvida' })
      .eq('id', selectedOcorrencia.id)

    if (error) {
      danger('Erro ao resolver ocorrência')
    } else {
      success('Ocorrência marcada como resolvida')
      fetchOcorrencias()
    }

    setIsResolving(false)
    setSelectedOcorrencia(null)
  }

  // ── ESTATÍSTICAS ──────────────────────────────────────────────────────────
  const abertas = ocorrencias.filter(o => o.status === 'aberta').length
  const resolvidas = ocorrencias.filter(o => o.status === 'resolvida').length

  // ── COLUNAS ───────────────────────────────────────────────────────────────
  const columns: Column<Ocorrencia>[] = [
    {
      key: 'aluno',
      header: 'ALUNO',
      accessor: (row) => (
        <div className="flex items-center gap-2">
          <Avatar name={row.aluno_nome} size="sm" />
          <div>
            <p className="text-body-sm font-medium text-ink">{row.aluno_nome}</p>
            <p className="text-caption text-body">{row.turma_nome}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'tipo',
      header: 'TIPO',
      accessor: (row) => (
        <Badge variant={
          row.tipo === 'frequencia' ? 'warning' :
          row.tipo === 'desempenho' ? 'danger' :
          'neutral'
        }>
          {row.tipo}
        </Badge>
      ),
    },
    {
      key: 'descricao',
      header: 'DESCRIÇÃO',
      accessor: (row) => (
        <p className="text-body-sm text-body line-clamp-2">{row.descricao}</p>
      ),
    },
    {
      key: 'status',
      header: 'STATUS',
      accessor: (row) => (
        <Badge variant={row.status === 'aberta' ? 'danger' : 'success'}>
          {row.status === 'aberta' ? '🔴 Aberta' : '✓ Resolvida'}
        </Badge>
      ),
    },
    {
      key: 'acoes',
      header: '',
      align: 'right',
      width: 'w-40',
      accessor: (row) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setSelectedOcorrencia(row)}
          >
            Ver
          </Button>
          {row.status === 'aberta' && (
            <Button
              variant="ghost"
              size="xs"
              className="text-success-600 hover:bg-success-50"
              onClick={() => {
                setSelectedOcorrencia(row)
              }}
            >
              Resolver
            </Button>
          )}
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
          <h1 className="text-display font-semibold text-ink">Ocorrências</h1>
          <p className="text-body text-ink-muted mt-1">
            Gerencie registros de alunos
          </p>
        </div>

        <Link href="/ocorrencias/novo">
          <Button>+ Nova ocorrência</Button>
        </Link>
      </div>

      {/* CARDS INFORMATIVOS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <Card.Body>
            <p className="text-caption text-body mb-2">Total de ocorrências</p>
            <p className="text-display-sm font-semibold text-ink">{ocorrencias.length}</p>
          </Card.Body>
        </Card>

        <Card>
          <Card.Body>
            <p className="text-caption text-body mb-2">Abertas</p>
            <p className="text-display-sm font-semibold text-danger-600">{abertas}</p>
          </Card.Body>
        </Card>

        <Card>
          <Card.Body>
            <p className="text-caption text-body mb-2">Resolvidas</p>
            <p className="text-display-sm font-semibold text-success-600">{resolvidas}</p>
          </Card.Body>
        </Card>
      </div>

      {/* FILTROS */}
      <Card>
        <Card.Body>
          <div className="flex gap-4 flex-wrap">
            <Input
              placeholder="Buscar aluno, turma ou descrição..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="flex-1 min-w-48"
            />

            <Select
              placeholder="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={[
                { value: 'aberta', label: 'Aberta' },
                { value: 'resolvida', label: 'Resolvida' },
              ]}
            />

            <Select
              placeholder="Tipo"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              options={[
                { value: 'frequencia', label: 'Frequência' },
                { value: 'desempenho', label: 'Desempenho' },
                { value: 'comportamento', label: 'Comportamento' },
                { value: 'outro', label: 'Outro' },
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

      {/* MODAL DETALHE */}
      <Modal
        open={!!selectedOcorrencia}
        onClose={() => setSelectedOcorrencia(null)}
      >
        <Modal.Header>
          <Modal.Title>Detalhes da ocorrência</Modal.Title>
          <Modal.Close onClose={() => setSelectedOcorrencia(null)} />
        </Modal.Header>
        {selectedOcorrencia && (
          <div className="space-y-6">
            <div>
              <h3 className="text-body-sm font-semibold text-body mb-1">Aluno</h3>
              <p className="text-body-sm text-ink">{selectedOcorrencia.aluno_nome}</p>
            </div>

            <div>
              <h3 className="text-body-sm font-semibold text-body mb-1">Tipo</h3>
              <Badge>{selectedOcorrencia.tipo}</Badge>
            </div>

            <div>
              <h3 className="text-body-sm font-semibold text-body mb-1">Descrição</h3>
              <p className="text-body-sm text-ink whitespace-pre-wrap">
                {selectedOcorrencia.descricao}
              </p>
            </div>

            <div>
              <h3 className="text-body-sm font-semibold text-body mb-1">Status</h3>
              <Badge variant={selectedOcorrencia.status === 'aberta' ? 'danger' : 'success'}>
                {selectedOcorrencia.status === 'aberta' ? 'Aberta' : 'Resolvida'}
              </Badge>
            </div>

            <div>
              <h3 className="text-body-sm font-semibold text-body mb-1">Data de registro</h3>
              <p className="text-body-sm text-body">
                {new Date(selectedOcorrencia.created_at).toLocaleDateString('pt-BR')}
              </p>
            </div>

            {selectedOcorrencia.status === 'aberta' && (
              <div className="pt-4 flex gap-3">
                <Button
                  onClick={handleResolve}
                  isLoading={isResolving}
                >
                  ✓ Marcar como resolvida
                </Button>

                <Button
                  variant="secondary"
                  onClick={() => setSelectedOcorrencia(null)}
                >
                  Fechar
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* MODAL DELETE */}
      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Excluir ocorrência"
        description={`Excluir registro de ${deleteTarget?.aluno_nome}?`}
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  )
}
