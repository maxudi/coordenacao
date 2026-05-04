'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Button, Input, Select, Card, Textarea,
  Table, Badge, ConfirmModal, useToast, Avatar, Modal
} from '@/components/ui'
import type { Column } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

// ─── TIPOS ───────────────────────────────────────────────────────────────────

interface Mensagem {
  id: string
  aluno_id: string
  aluno_nome: string
  telefone: string
  conteudo: string
  status: string
  created_at: string
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function ComunicacaoPage() {
  const { success, danger } = useToast()

  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [busca, setBusca] = useState('')
  const [status, setStatus] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  const [deleteTarget, setDeleteTarget] = useState<Mensagem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const [selectedMensagem, setSelectedMensagem] = useState<Mensagem | null>(null)

  // ── FETCH ────────────────────────────────────────────────────────────────
  const fetchMensagens = async () => {
    setIsLoading(true)

    const { data, error } = await (supabase as any)
      .from('mensagens')
      .select(`
        id,
        aluno_id,
        telefone,
        conteudo,
        status,
        created_at,
        alunos(nome)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error(error)
      danger('Erro ao carregar mensagens')
      setIsLoading(false)
      return
    }

    const formatted: Mensagem[] = (data ?? []).map((m: any) => ({
      id: m.id,
      aluno_id: m.aluno_id,
      aluno_nome: m.alunos?.nome || '-',
      telefone: m.telefone,
      conteudo: m.conteudo,
      status: m.status || 'enviada',
      created_at: m.created_at,
    }))

    setMensagens(formatted)
    setIsLoading(false)
  }

  useEffect(() => {
    fetchMensagens()
  }, [])

  // ── FILTRO ────────────────────────────────────────────────────────────────
  const filtered = mensagens.filter(m => {
    const matchBusca = m.aluno_nome.toLowerCase().includes(busca.toLowerCase()) ||
                       m.telefone.includes(busca) ||
                       m.conteudo.toLowerCase().includes(busca.toLowerCase())
    const matchStatus = !status || m.status === status
    return matchBusca && matchStatus
  })

  // ── DELETE ────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return

    setIsDeleting(true)

    const { error } = await (supabase as any)
      .from('mensagens')
      .delete()
      .eq('id', deleteTarget.id)

    if (error) {
      danger('Erro ao excluir mensagem')
    } else {
      success('Mensagem removida')
      fetchMensagens()
    }

    setIsDeleting(false)
    setDeleteTarget(null)
  }

  // ── ESTATÍSTICAS ──────────────────────────────────────────────────────────
  const enviadas = mensagens.filter(m => m.status === 'enviada').length
  const entregues = mensagens.filter(m => m.status === 'entregue').length
  const falhadas = mensagens.filter(m => m.status === 'falha').length

  // ── COLUNAS ───────────────────────────────────────────────────────────────
  const columns: Column<Mensagem>[] = [
    {
      key: 'aluno',
      header: 'ALUNO',
      accessor: (row) => (
        <div className="flex items-center gap-2">
          <Avatar name={row.aluno_nome} size="sm" />
          <span className="text-body-sm font-medium text-ink">{row.aluno_nome}</span>
        </div>
      ),
    },
    {
      key: 'telefone',
      header: 'TELEFONE',
      accessor: (row) => (
        <span className="text-body-sm text-body font-mono">{row.telefone}</span>
      ),
    },
    {
      key: 'conteudo',
      header: 'MENSAGEM',
      accessor: (row) => (
        <p className="text-body-sm text-body line-clamp-2">{row.conteudo}</p>
      ),
    },
    {
      key: 'status',
      header: 'STATUS',
      accessor: (row) => {
        let variant: 'success' | 'warning' | 'danger' = 'success'
        if (row.status === 'falha') variant = 'danger'
        else if (row.status === 'enviada') variant = 'warning'

        return (
          <Badge variant={variant}>
            {row.status === 'entregue' ? '✓ Entregue' :
             row.status === 'enviada' ? '→ Enviada' :
             '✗ Falha'}
          </Badge>
        )
      },
    },
    {
      key: 'data',
      header: 'DATA',
      accessor: (row) => (
        <span className="text-body-sm text-body">
          {new Date(row.created_at).toLocaleDateString('pt-BR')}
        </span>
      ),
    },
    {
      key: 'acoes',
      header: '',
      align: 'right',
      width: 'w-32',
      accessor: (row) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setSelectedMensagem(row)}
          >
            Ver
          </Button>
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
          <h1 className="text-display font-semibold text-ink">Comunicação</h1>
          <p className="text-body text-ink-muted mt-1">
            Histórico de mensagens aos responsáveis
          </p>
        </div>

        <Link href="/comunicacao/nova">
          <Button>+ Enviar mensagem</Button>
        </Link>
      </div>

      {/* CARDS INFORMATIVOS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <Card.Body>
            <p className="text-caption text-body mb-2">Total de mensagens</p>
            <p className="text-display-sm font-semibold text-ink">{mensagens.length}</p>
          </Card.Body>
        </Card>

        <Card>
          <Card.Body>
            <p className="text-caption text-body mb-2">Entregues</p>
            <p className="text-display-sm font-semibold text-success-600">{entregues}</p>
          </Card.Body>
        </Card>

        <Card>
          <Card.Body>
            <p className="text-caption text-body mb-2">Enviadas</p>
            <p className="text-display-sm font-semibold text-accent-500">{enviadas}</p>
          </Card.Body>
        </Card>

        <Card>
          <Card.Body>
            <p className="text-caption text-body mb-2">Falhas</p>
            <p className="text-display-sm font-semibold text-danger-600">{falhadas}</p>
          </Card.Body>
        </Card>
      </div>

      {/* FILTROS */}
      <Card>
        <Card.Body>
          <div className="flex gap-4 flex-wrap">
            <Input
              placeholder="Buscar aluno, telefone ou mensagem..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="flex-1 min-w-48"
            />

            <Select
              placeholder="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={[
                { value: 'entregue', label: 'Entregue' },
                { value: 'enviada', label: 'Enviada' },
                { value: 'falha', label: 'Falha' },
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
        open={!!selectedMensagem}
        onClose={() => setSelectedMensagem(null)}
      >
        <Modal.Header>
          <Modal.Title>Detalhes da mensagem</Modal.Title>
          <Modal.Close onClose={() => setSelectedMensagem(null)} />
        </Modal.Header>
        {selectedMensagem && (
          <div className="space-y-4">
            <div>
              <h3 className="text-body-sm font-semibold text-body mb-1">Aluno</h3>
              <p className="text-body-sm text-ink">{selectedMensagem.aluno_nome}</p>
            </div>

            <div>
              <h3 className="text-body-sm font-semibold text-body mb-1">Telefone</h3>
              <p className="text-body-sm text-ink font-mono">{selectedMensagem.telefone}</p>
            </div>

            <div>
              <h3 className="text-body-sm font-semibold text-body mb-1">Mensagem</h3>
              <p className="text-body-sm text-ink whitespace-pre-wrap bg-neutral-50 p-3 rounded">
                {selectedMensagem.conteudo}
              </p>
            </div>

            <div>
              <h3 className="text-body-sm font-semibold text-body mb-1">Status</h3>
              <Badge variant={
                selectedMensagem.status === 'entregue' ? 'success' :
                selectedMensagem.status === 'enviada' ? 'warning' :
                'danger'
              }>
                {selectedMensagem.status === 'entregue' ? '✓ Entregue' :
                 selectedMensagem.status === 'enviada' ? '→ Enviada' :
                 '✗ Falha'}
              </Badge>
            </div>

            <div>
              <h3 className="text-body-sm font-semibold text-body mb-1">Data</h3>
              <p className="text-body-sm text-body">
                {new Date(selectedMensagem.created_at).toLocaleDateString('pt-BR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL DELETE */}
      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Excluir mensagem"
        description={`Excluir mensagem de ${deleteTarget?.aluno_nome}?`}
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  )
}
