'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button, Input, Select, Card, useToast, Spinner } from '@/components/ui'
import { supabase } from '@/lib/supabase'

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function EditarAvaliacaoPage() {
  const router = useRouter()
  const params = useParams()
  const { success, danger } = useToast()

  const [formData, setFormData] = useState({
    aluno_id: '',
    disciplina_id: '',
    tipo: 'prova',
    valor: '',
    data: '',
  })

  const [alunos, setAlunos] = useState<Array<{ id: string; nome: string }>>([])
  const [disciplinas, setDisciplinas] = useState<Array<{ id: string; nome: string }>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      const id = params.id as string

      // Buscar avaliação
      const { data: aval } = await (supabase as any)
        .from('avaliacoes')
        .select('*')
        .eq('id', id)
        .single()

      if (aval) {
        setFormData({
          aluno_id: aval.aluno_id,
          disciplina_id: aval.disciplina_id,
          tipo: aval.tipo,
          valor: aval.valor.toString(),
          data: aval.data,
        })
      }

      // Buscar referências
      const { data: alunosData } = await (supabase as any)
        .from('alunos')
        .select('id, nome')
        .eq('status', 'ativo')
        .order('nome')

      const { data: disciplinasData } = await (supabase as any)
        .from('disciplinas')
        .select('id, nome')
        .order('nome')

      setAlunos(alunosData ?? [])
      setDisciplinas(disciplinasData ?? [])
      setIsLoading(false)
    }

    fetchData()
  }, [params.id])

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.aluno_id || !formData.disciplina_id || !formData.valor) {
      danger('Preencha todos os campos obrigatórios')
      return
    }

    const valor = parseFloat(formData.valor)
    if (valor < 0 || valor > 10) {
      danger('Nota deve estar entre 0 e 10')
      return
    }

    setIsSaving(true)

    const { error } = await (supabase as any)
      .from('avaliacoes')
      .update({
        aluno_id: formData.aluno_id,
        disciplina_id: formData.disciplina_id,
        tipo: formData.tipo,
        valor: valor,
        data: formData.data,
      })
      .eq('id', params.id)

    if (error) {
      danger('Erro ao atualizar avaliação')
      console.error(error)
    } else {
      success('Avaliação atualizada com sucesso!')
      router.push('/avaliacoes')
    }

    setIsSaving(false)
  }

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-96">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-display font-semibold text-ink">Editar avaliação</h1>
        <p className="text-body text-ink-muted mt-2">Atualize os dados da avaliação</p>
      </div>

      <Card>
        <Card.Body>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Select
              label="Aluno *"
              value={formData.aluno_id}
              onChange={(e) => handleChange('aluno_id', e.target.value)}
              options={alunos.map(a => ({ value: a.id, label: a.nome }))}
              required
            />

            <Select
              label="Disciplina *"
              value={formData.disciplina_id}
              onChange={(e) => handleChange('disciplina_id', e.target.value)}
              options={disciplinas.map(d => ({ value: d.id, label: d.nome }))}
              required
            />

            <Select
              label="Tipo de avaliação"
              value={formData.tipo}
              onChange={(e) => handleChange('tipo', e.target.value)}
              options={[
                { value: 'prova', label: 'Prova' },
                { value: 'trabalho', label: 'Trabalho' },
                { value: 'participacao', label: 'Participação' },
                { value: 'atividade', label: 'Atividade' },
              ]}
            />

            <Input
              label="Nota (0-10) *"
              type="number"
              step="0.1"
              min="0"
              max="10"
              value={formData.valor}
              onChange={(e) => handleChange('valor', e.target.value)}
              required
            />

            <Input
              label="Data"
              type="date"
              value={formData.data}
              onChange={(e) => handleChange('data', e.target.value)}
            />

            <div className="flex gap-3 pt-4">
              <Button type="submit" isLoading={isSaving}>
                Salvar alterações
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.back()}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </Card.Body>
      </Card>
    </div>
  )
}
