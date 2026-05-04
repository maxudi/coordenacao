'use client'

import { useEffect, useState } from 'react'
import { Button, Input, Card, useToast } from '@/components/ui'
import { supabase } from '@/lib/supabase'

// ─── TIPOS ───────────────────────────────────────────────────────────────────

interface Disciplina {
  id:   string
  nome: string
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function DisciplinasPage() {
  const { success, danger } = useToast()

  const [disciplinas, setDisciplinas]   = useState<Disciplina[]>([])
  const [isLoading, setIsLoading]       = useState(true)
  const [novoNome, setNovoNome]         = useState('')
  const [isSaving, setIsSaving]         = useState(false)
  const [editando, setEditando]         = useState<Disciplina | null>(null)
  const [editNome, setEditNome]         = useState('')
  const [deletando, setDeletando]       = useState<string | null>(null)
  const [busca, setBusca]               = useState('')

  // ── FETCH ────────────────────────────────────────────────────────────────
  const fetchDisciplinas = async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('disciplinas')
      .select('id, nome')
      .order('nome')

    if (error) {
      danger('Erro ao carregar disciplinas')
    } else {
      setDisciplinas(data ?? [])
    }
    setIsLoading(false)
  }

  useEffect(() => {
    fetchDisciplinas()
  }, [])

  // ── CRIAR ────────────────────────────────────────────────────────────────
  const handleCriar = async (e: React.FormEvent) => {
    e.preventDefault()
    const nome = novoNome.trim()
    if (!nome || nome.length < 2) {
      danger('Nome deve ter pelo menos 2 caracteres')
      return
    }

    setIsSaving(true)
    const { error } = await supabase
      .from('disciplinas')
      .insert({ nome })

    if (error) {
      const msg = error.message.includes('unique') || error.code === '23505'
        ? `Disciplina "${nome}" já existe`
        : 'Erro ao criar disciplina'
      danger(msg)
    } else {
      success(`Disciplina "${nome}" criada`)
      setNovoNome('')
      fetchDisciplinas()
    }
    setIsSaving(false)
  }

  // ── EDITAR ────────────────────────────────────────────────────────────────
  const iniciarEdicao = (disc: Disciplina) => {
    setEditando(disc)
    setEditNome(disc.nome)
  }

  const handleSalvarEdicao = async () => {
    if (!editando) return
    const nome = editNome.trim()
    if (!nome || nome.length < 2) {
      danger('Nome deve ter pelo menos 2 caracteres')
      return
    }

    setIsSaving(true)
    const { error } = await supabase
      .from('disciplinas')
      .update({ nome })
      .eq('id', editando.id)

    if (error) {
      const msg = error.message.includes('unique') || error.code === '23505'
        ? `Disciplina "${nome}" já existe`
        : 'Erro ao atualizar disciplina'
      danger(msg)
    } else {
      success('Disciplina atualizada')
      setEditando(null)
      fetchDisciplinas()
    }
    setIsSaving(false)
  }

  const cancelarEdicao = () => {
    setEditando(null)
    setEditNome('')
  }

  // ── DELETAR ──────────────────────────────────────────────────────────────
  const handleDeletar = async (disc: Disciplina) => {
    // Verificar se há vínculos
    const { count } = await supabase
      .from('professor_turma_disciplina')
      .select('id', { count: 'exact', head: true })
      .eq('disciplina_id', disc.id)

    if (count && count > 0) {
      danger(`Não é possível excluir "${disc.nome}" — há ${count} vínculo(s) ativo(s)`)
      return
    }

    // Verificar avaliações
    const { count: countAval } = await supabase
      .from('avaliacoes')
      .select('id', { count: 'exact', head: true })
      .eq('disciplina_id', disc.id)

    if (countAval && countAval > 0) {
      danger(`Não é possível excluir "${disc.nome}" — há ${countAval} avaliação(ões) vinculada(s)`)
      return
    }

    setDeletando(disc.id)
    const { error } = await supabase
      .from('disciplinas')
      .delete()
      .eq('id', disc.id)

    if (error) {
      danger('Erro ao excluir disciplina')
    } else {
      success(`Disciplina "${disc.nome}" excluída`)
      fetchDisciplinas()
    }
    setDeletando(null)
  }

  // ── FILTRO ────────────────────────────────────────────────────────────────
  const filtradas = disciplinas.filter(d =>
    d.nome.toLowerCase().includes(busca.toLowerCase())
  )

  // ─── RENDER ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-display-sm font-semibold text-ink">Disciplinas</h1>
        <p className="text-body-sm text-ink-muted mt-1">
          Gerencie as disciplinas disponíveis para vincular a turmas e professores.
        </p>
      </div>

      {/* Layout dois painéis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Painel esquerdo — Adicionar */}
        <Card className="p-6 h-fit">
          <h2 className="text-body-sm font-semibold text-ink mb-4">Nova Disciplina</h2>
          <form onSubmit={handleCriar} className="space-y-3">
            <Input
              placeholder="Ex: Português, Matemática..."
              value={novoNome}
              onChange={e => setNovoNome(e.target.value)}
              disabled={isSaving}
            />
            <Button
              type="submit"
              className="w-full"
              disabled={!novoNome.trim() || isSaving}
            >
              {isSaving ? 'Salvando...' : 'Adicionar'}
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-surface-border">
            <p className="text-caption text-ink-muted">
              <strong className="text-ink">{disciplinas.length}</strong> disciplina{disciplinas.length !== 1 ? 's' : ''} cadastrada{disciplinas.length !== 1 ? 's' : ''}
            </p>
          </div>
        </Card>

        {/* Painel direito — Lista */}
        <div className="lg:col-span-2 space-y-4">

          {/* Busca */}
          <Input
            placeholder="Buscar disciplina..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />

          {/* Lista */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-body-sm text-ink-muted">Carregando...</p>
            </div>
          ) : filtradas.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-body-sm text-ink-muted">
                {busca ? 'Nenhuma disciplina encontrada.' : 'Nenhuma disciplina cadastrada ainda.'}
              </p>
              {!busca && (
                <p className="text-caption text-ink-muted mt-1">
                  Use o painel ao lado para adicionar a primeira.
                </p>
              )}
            </Card>
          ) : (
            <div className="space-y-2">
              {filtradas.map((disc) => (
                <Card key={disc.id} className="p-4">
                  {editando?.id === disc.id ? (
                    /* Modo edição inline */
                    <div className="flex items-center gap-3">
                      <Input
                        className="flex-1"
                        value={editNome}
                        onChange={e => setEditNome(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleSalvarEdicao()
                          if (e.key === 'Escape') cancelarEdicao()
                        }}
                        autoFocus
                        disabled={isSaving}
                      />
                      <Button
                        size="sm"
                        onClick={handleSalvarEdicao}
                        disabled={!editNome.trim() || isSaving}
                      >
                        Salvar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={cancelarEdicao}
                        disabled={isSaving}
                      >
                        Cancelar
                      </Button>
                    </div>
                  ) : (
                    /* Modo visualização */
                    <div className="flex items-center justify-between">
                      <span className="text-body-sm font-medium text-ink">{disc.nome}</span>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => iniciarEdicao(disc)}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="xs"
                          className="text-danger-600 hover:bg-danger-50"
                          onClick={() => handleDeletar(disc)}
                          disabled={deletando === disc.id}
                        >
                          {deletando === disc.id ? '...' : 'Excluir'}
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
