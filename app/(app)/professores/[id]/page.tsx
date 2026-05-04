'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  Card, Badge, Button, Spinner, Alert, Avatar,
} from '@/components/ui'
import { supabase } from '@/lib/supabase'

// ─── TIPOS ───────────────────────────────────────────────────────────────────

interface Professor {
  id: string
  nome: string
  email: string
  telefone: string | null
  status: string
  created_at: string
}

interface Disciplina {
  id: string
  disciplina_id: string
  turma_id: string
  disciplinas: { nome: string } | null
  turmas: { nome: string; serie: string } | null
}

// ─── PAGE ────────────────────────────────────────────────────────────────────

export default function ProfessorPage() {
  const { id } = useParams<{ id: string }>()

  const [professor, setProfessor] = useState<Professor | null>(null)
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)

    Promise.all([
      supabase.from('professores').select('*').eq('id', id).single(),
      supabase
        .from('professor_turma_disciplina')
        .select('id, disciplina_id, turma_id, disciplinas(nome), turmas(nome, serie)')
        .eq('professor_id', id)
        .order('turma_id'),
    ]).then(([p, d]) => {
      if (p.error || !p.data) { setErro(p.error?.message ?? 'Professor não encontrado'); setLoading(false); return }
      setProfessor(p.data as Professor)
      setDisciplinas((d.data ?? []) as Disciplina[])
      setLoading(false)
    })
  }, [id])

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>
  if (erro || !professor) return <Alert variant="danger" title="Erro" description={erro ?? 'Professor não encontrado'} />

  const criadoEm = new Date(professor.created_at).toLocaleDateString('pt-BR')
  const discPorTurma: Record<string, string[]> = {}
  for (const d of disciplinas) {
    const turmaNome = d.turmas?.nome ?? 'Turma desconhecida'
    if (!discPorTurma[turmaNome]) discPorTurma[turmaNome] = []
    if (d.disciplinas?.nome) discPorTurma[turmaNome].push(d.disciplinas.nome)
  }

  return (
    <div className="p-8 space-y-6 max-w-4xl mx-auto">

      {/* HEADER */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <Avatar name={professor.nome} size="lg" />
          <div>
            <h1 className="text-display-sm font-bold text-ink">{professor.nome}</h1>
            <p className="text-body-sm text-body">
              {professor.email} · Cadastrado em {criadoEm}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/professores/${professor.id}/editar`}>
            <Button variant="outline">Editar</Button>
          </Link>
          <Link href="/professores">
            <Button variant="ghost">← Voltar</Button>
          </Link>
        </div>
      </div>

      {/* INFO CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="p-4 text-center">
          <p className="text-caption text-body">E-mail</p>
          <p className="text-body-sm font-mono text-ink mt-1">{professor.email}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-caption text-body">Telefone</p>
          <p className="text-body-sm font-medium text-ink mt-1">{professor.telefone ?? '—'}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-caption text-body">Status</p>
          <div className="mt-1">
            <Badge variant={professor.status === 'ativo' ? 'success' : 'danger'} dot>
              {professor.status}
            </Badge>
          </div>
        </Card>
      </div>

      {/* DISCIPLINAS */}
      <Card>
        <Card.Body>
          <h2 className="text-body-sm font-semibold text-ink mb-3">
            Disciplinas por turma ({disciplinas.length})
          </h2>

          {Object.keys(discPorTurma).length === 0 ? (
            <p className="text-caption text-body">Nenhuma disciplina atribuída</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(discPorTurma).map(([turma, discs]) => (
                <div key={turma} className="flex items-start justify-between p-3 rounded-lg border border-border">
                  <div>
                    <p className="text-body-sm font-medium text-ink">{turma}</p>
                    <p className="text-caption text-body mt-1">
                      {discs.join(', ')}
                    </p>
                  </div>
                  <Badge variant="neutral">{discs.length}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card.Body>
      </Card>

    </div>
  )
}
