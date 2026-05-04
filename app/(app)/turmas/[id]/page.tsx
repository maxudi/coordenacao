'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  Card, Badge, Button, Spinner, Alert,
} from '@/components/ui'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

// ─── TIPOS ───────────────────────────────────────────────────────────────────

interface Turma {
  id: string
  nome: string
  serie: string
  turno: string
  created_at: string
}

interface Aluno {
  id: string
  nome: string
  status: string
  matricula: string
}

const TURNO_LABEL: Record<string, string> = {
  manha: 'Manhã',
  tarde: 'Tarde',
  noite: 'Noite',
  integral: 'Integral',
}

// ─── PAGE ────────────────────────────────────────────────────────────────────

export default function TurmaPage() {
  const { id } = useParams<{ id: string }>()

  const [turma, setTurma] = useState<Turma | null>(null)
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)

    Promise.all([
      (supabase as any).from('turmas').select('*').eq('id', id).single(),
      (supabase as any).from('alunos').select('id, nome, status, matricula').eq('turma_id', id).order('nome'),
    ]).then(([t, a]) => {
      if (t.error || !t.data) { setErro(t.error?.message ?? 'Turma não encontrada'); setLoading(false); return }
      setTurma(t.data as Turma)
      setAlunos((a.data ?? []) as Aluno[])
      setLoading(false)
    })
  }, [id])

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>
  if (erro || !turma) return <Alert variant="danger" title="Erro" description={erro ?? 'Turma não encontrada'} />

  const alunosAtivos = alunos.filter(a => a.status === 'ativo').length
  const criadoEm = new Date(turma.created_at).toLocaleDateString('pt-BR')

  return (
    <div className="p-8 space-y-6 max-w-4xl mx-auto">

      {/* HEADER */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-display font-semibold text-ink">{turma.nome}</h1>
          <p className="text-body text-ink-muted mt-1">
            {turma.serie} · {TURNO_LABEL[turma.turno] ?? turma.turno} · Criada em {criadoEm}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/turmas/${turma.id}/editar`}>
            <Button variant="outline">Editar</Button>
          </Link>
          <Link href="/turmas">
            <Button variant="ghost">← Voltar</Button>
          </Link>
        </div>
      </div>

      {/* INFO CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="p-4 text-center">
          <p className="text-caption text-body">Série</p>
          <p className="text-body-sm font-bold text-ink mt-1">{turma.serie}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-caption text-body">Turno</p>
          <p className="text-body-sm font-bold text-ink mt-1">{TURNO_LABEL[turma.turno]}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-caption text-body">Alunos ativos</p>
          <p className="text-body-sm font-bold text-ink mt-1">{alunosAtivos}</p>
        </Card>
      </div>

      {/* ALUNOS */}
      <Card>
        <Card.Body>
          <h2 className="text-body-sm font-semibold text-ink mb-3">Alunos ({alunos.length})</h2>

          {alunos.length === 0 ? (
            <p className="text-caption text-body">Nenhum aluno nesta turma</p>
          ) : (
            <div className="space-y-2">
              {alunos.map(aluno => (
                <Link key={aluno.id} href={`/alunos/${aluno.id}`}>
                  <div className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-surface-raised transition-colors cursor-pointer">
                    <div>
                      <p className="text-body-sm font-medium text-ink">{aluno.nome}</p>
                      <p className="text-caption text-body">{aluno.matricula}</p>
                    </div>
                    <Badge variant={aluno.status === 'ativo' ? 'success' : 'neutral'}>
                      {aluno.status}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card.Body>
      </Card>

    </div>
  )
}
