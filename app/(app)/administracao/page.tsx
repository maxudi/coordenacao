'use client'

import { useState } from 'react'
import {
  Button, Input, Select, Card,
  Table, Badge, Avatar,
  Modal, useToast, Alert,
} from '@/components/ui'
import type { Column } from '@/components/ui'
import { cn } from '@/lib/utils'

// ─── TIPOS ───────────────────────────────────────────────────────────────────

type Perfil = 'admin' | 'coordenador' | 'professor' | 'secretaria'
type StatusUser = 'ativo' | 'inativo' | 'pendente'

interface Usuario {
  id:        string
  nome:      string
  email:     string
  perfil:    Perfil
  status:    StatusUser
  ultimo:    string | null
  criado:    string
}

interface FormState {
  nome:    string
  email:   string
  perfil:  Perfil
  status:  StatusUser
}

// ─── DADOS MOCK ───────────────────────────────────────────────────────────────

const MOCK: Usuario[] = [
  { id: '1', nome: 'Carla Menezes',    email: 'carla@escola.edu.br',      perfil: 'coordenador', status: 'ativo',   ultimo: 'Hoje, 09:30',  criado: '01/01/2025' },
  { id: '2', nome: 'Ana Lima',         email: 'ana.lima@escola.edu.br',   perfil: 'professor',   status: 'ativo',   ultimo: 'Hoje, 08:15',  criado: '15/02/2025' },
  { id: '3', nome: 'Carlos Reis',      email: 'carlos@escola.edu.br',     perfil: 'professor',   status: 'ativo',   ultimo: 'Ontem',        criado: '15/02/2025' },
  { id: '4', nome: 'Julia Mota',       email: 'julia@escola.edu.br',      perfil: 'professor',   status: 'ativo',   ultimo: '28/04/2026',   criado: '15/02/2025' },
  { id: '5', nome: 'Roberto Dias',     email: 'roberto@escola.edu.br',    perfil: 'professor',   status: 'inativo', ultimo: '01/03/2026',   criado: '15/02/2025' },
  { id: '6', nome: 'Paula Souza',      email: 'paula@escola.edu.br',      perfil: 'professor',   status: 'ativo',   ultimo: '30/04/2026',   criado: '20/02/2025' },
  { id: '7', nome: 'Fernanda Borges',  email: 'fernanda@escola.edu.br',   perfil: 'secretaria',  status: 'ativo',   ultimo: 'Hoje, 07:50',  criado: '10/03/2025' },
  { id: '8', nome: 'Ricardo Naves',    email: 'ricardo@escola.edu.br',    perfil: 'admin',       status: 'ativo',   ultimo: '02/05/2026',   criado: '01/01/2025' },
  { id: '9', nome: 'Marcia Nunes',     email: 'marcia@escola.edu.br',     perfil: 'professor',   status: 'inativo', ultimo: '10/04/2026',   criado: '15/02/2025' },
  { id:'10', nome: 'Beatriz Cunha',    email: 'beatriz@escola.edu.br',    perfil: 'secretaria',  status: 'pendente',ultimo: null,           criado: '03/05/2026' },
]

const perfilLabel: Record<Perfil, string> = {
  admin:       'Administrador',
  coordenador: 'Coordenador',
  professor:   'Professor',
  secretaria:  'Secretaria',
}

const perfilVariant: Record<Perfil, 'danger' | 'primary' | 'secondary' | 'warning'> = {
  admin:       'danger',
  coordenador: 'primary',
  professor:   'secondary',
  secretaria:  'warning',
}

const statusLabel: Record<StatusUser, string> = {
  ativo:    'Ativo',
  inativo:  'Inativo',
  pendente: 'Pendente',
}

const statusVariant: Record<StatusUser, 'success' | 'neutral' | 'warning'> = {
  ativo:    'success',
  inativo:  'neutral',
  pendente: 'warning',
}

const FORM_VAZIO: FormState = { nome: '', email: '', perfil: 'professor', status: 'ativo' }

// ─── ÍCONE ────────────────────────────────────────────────────────────────────

function IconShield() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  )
}
function IconPlus() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  )
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function AdministracaoPage() {
  const { success, danger } = useToast()
  const [usuarios, setUsuarios]   = useState(MOCK)
  const [busca, setBusca]         = useState('')
  const [filtroPerfil, setFiltroPerfil] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando]   = useState<Usuario | null>(null)
  const [form, setForm]           = useState<FormState>(FORM_VAZIO)
  const [loading, setLoading]     = useState(false)

  const filtrados = usuarios.filter((u) => {
    const matchBusca   = u.nome.toLowerCase().includes(busca.toLowerCase()) ||
                         u.email.toLowerCase().includes(busca.toLowerCase())
    const matchPerfil  = !filtroPerfil || u.perfil === filtroPerfil
    const matchStatus  = !filtroStatus || u.status === filtroStatus
    return matchBusca && matchPerfil && matchStatus
  })

  function abrirCriar() {
    setEditando(null)
    setForm(FORM_VAZIO)
    setModalOpen(true)
  }

  function abrirEditar(u: Usuario) {
    setEditando(u)
    setForm({ nome: u.nome, email: u.email, perfil: u.perfil, status: u.status })
    setModalOpen(true)
  }

  async function salvar() {
    if (!form.nome.trim() || !form.email.trim()) {
      danger('Preencha nome e e-mail.')
      return
    }
    setLoading(true)
    await new Promise((r) => setTimeout(r, 600))
    if (editando) {
      setUsuarios((prev) =>
        prev.map((u) => u.id === editando.id ? { ...u, ...form } : u),
      )
      success('Usuário atualizado com sucesso.')
    } else {
      const novo: Usuario = {
        id:     String(Date.now()),
        ...form,
        ultimo: null,
        criado: new Date().toLocaleDateString('pt-BR'),
      }
      setUsuarios((prev) => [...prev, novo])
      success('Usuário criado. Um convite foi enviado por e-mail.')
    }
    setLoading(false)
    setModalOpen(false)
  }

  function toggleStatus(id: string) {
    setUsuarios((prev) => prev.map((u) => {
      if (u.id !== id) return u
      const novoStatus: StatusUser = u.status === 'ativo' ? 'inativo' : 'ativo'
      success(novoStatus === 'ativo' ? 'Usuário reativado.' : 'Usuário desativado.')
      return { ...u, status: novoStatus }
    }))
  }

  const columns: Column<Usuario>[] = [
    {
      key:    'nome',
      header: 'Usuário',
      render: (u) => (
        <div className="flex items-center gap-3">
          <Avatar name={u.nome} size="sm" />
          <div>
            <p className="text-body-sm font-medium text-ink">{u.nome}</p>
            <p className="text-caption text-ink-muted">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      key:    'perfil',
      header: 'Perfil',
      render: (u) => (
        <Badge variant={perfilVariant[u.perfil]}>{perfilLabel[u.perfil]}</Badge>
      ),
    },
    {
      key:    'status',
      header: 'Status',
      render: (u) => (
        <Badge variant={statusVariant[u.status]}>{statusLabel[u.status]}</Badge>
      ),
    },
    {
      key:    'ultimo',
      header: 'Último acesso',
      render: (u) => (
        <span className="text-body-sm text-ink-muted">{u.ultimo ?? 'Nunca'}</span>
      ),
    },
    {
      key:    'criado',
      header: 'Criado em',
      render: (u) => (
        <span className="text-body-sm text-ink-muted">{u.criado}</span>
      ),
    },
    {
      key:    'acoes',
      header: '',
      render: (u) => (
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="xs" onClick={() => abrirEditar(u)}>Editar</Button>
          <Button
            variant={u.status === 'ativo' ? 'outline-danger' : 'outline'}
            size="xs"
            onClick={() => toggleStatus(u.id)}
          >
            {u.status === 'ativo' ? 'Desativar' : 'Reativar'}
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="p-8 space-y-6 max-w-[1280px]">

      {/* Cabeçalho */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-danger-50 text-danger-600">
            <IconShield />
          </span>
          <div>
            <h1 className="text-display font-bold text-ink">Administração</h1>
            <p className="text-body text-ink-muted mt-0.5">Gerencie usuários e permissões do sistema</p>
          </div>
        </div>
        <Button leftIcon={<IconPlus />} onClick={abrirCriar}>Novo usuário</Button>
      </div>

      {/* Aviso de segurança */}
      <Alert
        variant="warning"
        title="Área restrita"
        description="Alterações aqui afetam o acesso ao sistema. Apenas administradores podem modificar perfis de outros usuários."
      />

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Total de usuários', value: usuarios.length,                                   color: 'text-ink' },
          { label: 'Ativos',            value: usuarios.filter(u => u.status === 'ativo').length,  color: 'text-success-600' },
          { label: 'Inativos',          value: usuarios.filter(u => u.status === 'inativo').length,color: 'text-ink-muted' },
          { label: 'Aguardando',        value: usuarios.filter(u => u.status === 'pendente').length,color: 'text-warning-600' },
        ].map((c) => (
          <Card key={c.label}>
            <Card.Body>
              <p className="text-caption text-ink-muted">{c.label}</p>
              <p className={cn('text-display-sm font-bold mt-1', c.color)}>{c.value}</p>
            </Card.Body>
          </Card>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder="Buscar por nome ou e-mail..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="sm:w-72"
        />
        <Select
          value={filtroPerfil}
          onChange={(e) => setFiltroPerfil(e.target.value)}
          className="sm:w-44"
          options={[
            { value: '', label: 'Todos os perfis' },
            { value: 'admin', label: 'Administrador' },
            { value: 'coordenador', label: 'Coordenador' },
            { value: 'professor', label: 'Professor' },
            { value: 'secretaria', label: 'Secretaria' },
          ]}
        />
        <Select
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value)}
          className="sm:w-40"
          options={[
            { value: '', label: 'Todos os status' },
            { value: 'ativo', label: 'Ativo' },
            { value: 'inativo', label: 'Inativo' },
            { value: 'pendente', label: 'Pendente' },
          ]}
        />
      </div>

      {/* Tabela */}
      <Card>
        <Table
          data={filtrados}
          columns={columns}
          keyExtractor={(u) => u.id}
          emptyTitle="Nenhum usuário encontrado"
          emptyDesc="Ajuste os filtros ou cadastre um novo usuário."
        />
      </Card>

      {/* Modal criar/editar */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        size="md"
      >
        <Modal.Header>
          <Modal.Title>{editando ? 'Editar usuário' : 'Novo usuário'}</Modal.Title>
          <Modal.Close onClose={() => setModalOpen(false)} />
        </Modal.Header>
        <Modal.Body>
          <div className="space-y-4">
            <Input
              label="Nome completo"
              placeholder="Ex: João da Silva"
              value={form.nome}
              onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
              required
            />
            <Input
              label="E-mail"
              type="email"
              placeholder="usuario@escola.edu.br"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required
            />
            <Select
              label="Perfil de acesso"
              value={form.perfil}
              onChange={(e) => setForm((f) => ({ ...f, perfil: e.target.value as Perfil }))}
              options={[
                { value: 'admin', label: 'Administrador — acesso total' },
                { value: 'coordenador', label: 'Coordenador — gestão pedagógica' },
                { value: 'professor', label: 'Professor — turmas e notas' },
                { value: 'secretaria', label: 'Secretaria — matrículas e docs' },
              ]}
            />
            <Select
              label="Status"
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as StatusUser }))}
              options={[
                { value: 'ativo', label: 'Ativo' },
                { value: 'inativo', label: 'Inativo' },
                { value: 'pendente', label: 'Pendente (aguardando convite)' },
              ]}
            />

            {!editando && (
              <p className="text-caption text-ink-muted bg-surface-subtle rounded-md px-3 py-2">
                Um e-mail de convite será enviado automaticamente para o novo usuário.
              </p>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer className="justify-end gap-2">
          <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
          <Button onClick={salvar} isLoading={loading}>
            {editando ? 'Salvar alterações' : 'Criar usuário'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}
