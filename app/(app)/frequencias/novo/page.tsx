'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Button, Select, Card, useToast, Table, Checkbox, Alert
} from '@/components/ui'
import type { Column } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

// ─── TIPOS ───────────────────────────────────────────────────────────────────

interface AlunoComPresenca {
  aluno_id: string
  nome: string
  turma_nome: string
  presente: boolean
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function NovaPresencaPage() {
  const router = useRouter()
  const { success, danger } = useToast()

  const [data, setData] = useState(new Date().toISOString().split('T')[0])
  const [turma_id, setTurma_id] = useState('')
  const [turmas, setTurmas] = useState<Array<{ id: string; nome: string }>>([])
  const [alunos, setAlunos] = useState<AlunoComPresenca[]>([])
  const [isSaving, setIsSaving] = useState(false)

  // ── FETCH TURMAS ─────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchTurmas = async () => {
      const { data } = await (supabase as any)
        .from('turmas')
        .select('id, nome')
        .order('nome')

      setTurmas(data ?? [])
    }

    fetchTurmas()
  }, [])

  // ── FETCH ALUNOS DA TURMA ────────────────────────────────────────────────
  useEffect(() => {
    if (!turma_id) {
      setAlunos([])
      return
    }

    const fetchAlunos = async () => {
      const { data } = await (supabase as any)
        .from('alunos')
        .select('id, nome')
        .eq('turma_id', turma_id)
        .eq('status', 'ativo')
        .order('nome')

      const comPresenca: AlunoComPresenca[] = (data ?? []).map((a: any) => ({
        aluno_id: a.id,
        nome: a.nome,
        turma_nome: '',
        presente: true,
      }))

      setAlunos(comPresenca)
    }

    fetchAlunos()
  }, [turma_id])

  // ── ALTERNAR PRESENÇA ────────────────────────────────────────────────────
  const togglePresenca = (alunoId: string) => {
    setAlunos(prev => prev.map(a =>
      a.aluno_id === alunoId ? { ...a, presente: !a.presente } : a
    ))
  }

  // ── MARCAR TODOS ─────────────────────────────────────────────────────────
  const marcarTodos = (presente: boolean) => {
    setAlunos(prev => prev.map(a => ({ ...a, presente })))
  }

  // ── SALVAR ───────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!turma_id || alunos.length === 0) {
      danger('Selecione uma turma')
      return
    }

    setIsSaving(true)

    const registros = alunos.map(a => ({
      aluno_id: a.aluno_id,
      data,
      presente: a.presente,
    }))

    const { error } = await (supabase as any)
      .from('frequencia_diaria')
      .upsert(registros, { onConflict: 'aluno_id,data' })

    if (error) {
      danger('Erro ao salvar presença')
      console.error(error)
    } else {
      success(`Presença registrada para ${alunos.length} alunos`)
      router.push('/frequencias')
    }

    setIsSaving(false)
  }

  // ── COLUNAS ───────────────────────────────────────────────────────────────
  const columns: Column<AlunoComPresenca>[] = [
    {
      key: 'nome',
      header: 'ALUNO',
      accessor: (row) => (
        <span className="text-body-sm font-medium text-ink">{row.nome}</span>
      ),
    },
    {
      key: 'presente',
      header: 'PRESENTE',
      align: 'center',
      accessor: (row) => (
        <Checkbox
          checked={row.presente}
          onChange={() => togglePresenca(row.aluno_id)}
        />
      ),
    },
  ]

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-display font-semibold text-ink">Lançar presença</h1>
        <p className="text-body text-ink-muted mt-2">Registre a presença diária dos alunos</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* FILTROS */}
        <Card>
          <Card.Body>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select
                label="Turma *"
                value={turma_id}
                onChange={(e) => setTurma_id(e.target.value)}
                options={turmas.map(t => ({ value: t.id, label: t.nome }))}
                required
              />

              <input
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="px-3 py-2 border border-neutral-300 rounded-md text-body-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </Card.Body>
        </Card>

        {/* ALUNOS */}
        {alunos.length > 0 && (
          <>
            <Alert variant="info">
              ℹ️ Marque os presentes. Os desmarcados serão registrados como faltas.
            </Alert>

            <Card>
              <Card.Body>
                <div className="flex gap-3 mb-6">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => marcarTodos(true)}
                  >
                    ✓ Marcar todos
                  </Button>

                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => marcarTodos(false)}
                  >
                    ✗ Desmarcar todos
                  </Button>

                  <span className="text-body-sm text-body ml-auto">
                    {alunos.filter(a => a.presente).length} / {alunos.length} presentes
                  </span>
                </div>

                <Table
                  columns={columns}
                  data={alunos}
                  keyExtractor={(row) => row.aluno_id}
                />
              </Card.Body>
            </Card>
          </>
        )}

        {/* AÇÕES */}
        <div className="flex gap-3 pt-4">
          <Button type="submit" isLoading={isSaving}>
            Salvar presença
          </Button>

          <Link href="/frequencias">
            <Button type="button" variant="secondary">
              Cancelar
            </Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
