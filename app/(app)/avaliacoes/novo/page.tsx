'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Input, Select, Card, useToast } from '@/components/ui'
import { supabase } from '@/lib/supabase'

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function NovaAvaliacaoPage() {
  const router = useRouter()
  const { success, danger } = useToast()

  const [formData, setFormData] = useState({
    aluno_id: '',
    disciplina_id: '',
    etapa_id: '',
    professor_id: '',
    turma_id: '',
    tipo: 'prova',
    valor: '',
    valor_maximo: '10',
    data: new Date().toISOString().split('T')[0],
  })

  const [alunos, setAlunos]       = useState<Array<{ id: string; nome: string; turma_id: string | null }>>([])
  const [disciplinas, setDisciplinas] = useState<Array<{ id: string; nome: string }>>([])
  const [etapas, setEtapas]       = useState<Array<{ id: string; nome: string; ordem: number }>>([])
  const [professores, setProfessores] = useState<Array<{ id: string; nome: string }>>([])
  const [turmas, setTurmas]       = useState<Array<{ id: string; nome: string }>>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      const [
        { data: alunosData },
        { data: disciplinasData },
        { data: etapasData },
        { data: professoresData },
        { data: turmasData },
      ] = await Promise.all([
        (supabase as any).from('alunos').select('id, nome, turma_id').eq('status', 'ativo').order('nome'),
        (supabase as any).from('disciplinas').select('id, nome').order('nome'),
        (supabase as any).from('etapas').select('id, nome, ordem').order('ordem'),
        (supabase as any).from('professores').select('id, nome').order('nome'),
        (supabase as any).from('turmas').select('id, nome').order('nome'),
      ])

      setAlunos(alunosData ?? [])
      setDisciplinas(disciplinasData ?? [])
      setEtapas(etapasData ?? [])
      setProfessores(professoresData ?? [])
      setTurmas(turmasData ?? [])
    }

    fetchData()
  }, [])

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value }
      // auto-preencher turma quando aluno é selecionado
      if (field === 'aluno_id') {
        const aluno = alunos.find(a => a.id === value)
        if (aluno?.turma_id) next.turma_id = aluno.turma_id
      }
      return next
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.aluno_id || !formData.disciplina_id || !formData.etapa_id || !formData.valor) {
      danger('Preencha todos os campos obrigatórios')
      return
    }

    const valor      = parseFloat(formData.valor as string)
    const valorMax   = parseFloat(formData.valor_maximo as string)

    if (isNaN(valorMax) || valorMax <= 0) {
      danger('Valor máximo deve ser maior que zero')
      return
    }
    if (isNaN(valor) || valor < 0 || valor > valorMax) {
      danger(`Nota deve estar entre 0 e ${valorMax}`)
      return
    }

    setIsLoading(true)

    const { error } = await (supabase as any).from('avaliacoes').insert([
      {
        aluno_id:      formData.aluno_id,
        disciplina_id: formData.disciplina_id,
        etapa_id:      formData.etapa_id || null,
        professor_id:  formData.professor_id || null,
        turma_id:      formData.turma_id || null,
        tipo:          formData.tipo,
        valor,
        valor_maximo:  valorMax,
        data:          formData.data,
      },
    ])

    if (error) {
      danger('Erro ao criar avaliação')
      console.error(error)
    } else {
      success('Avaliação criada com sucesso!')
      router.push('/avaliacoes')
    }

    setIsLoading(false)
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-display font-semibold text-ink">Nova avaliação</h1>
        <p className="text-body text-ink-muted mt-2">Registre uma nova nota</p>
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
              label="Etapa *"
              value={formData.etapa_id}
              onChange={(e) => handleChange('etapa_id', e.target.value)}
              options={etapas.map(e => ({ value: e.id, label: e.nome }))}
              required
            />

            <Select
              label="Professor"
              value={formData.professor_id}
              onChange={(e) => handleChange('professor_id', e.target.value)}
              options={professores.map(p => ({ value: p.id, label: p.nome }))}
            />

            <Select
              label="Turma"
              value={formData.turma_id}
              onChange={(e) => handleChange('turma_id', e.target.value)}
              options={turmas.map(t => ({ value: t.id, label: t.nome }))}
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

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Nota *"
                type="number"
                step="0.01"
                min="0"
                value={formData.valor}
                onChange={(e) => handleChange('valor', e.target.value)}
                required
              />
              <Input
                label="Valor máximo *"
                type="number"
                step="0.01"
                min="0.01"
                value={formData.valor_maximo}
                onChange={(e) => handleChange('valor_maximo', e.target.value)}
                required
              />
            </div>

            <Input
              label="Data"
              type="date"
              value={formData.data}
              onChange={(e) => handleChange('data', e.target.value)}
            />

            <div className="flex gap-3 pt-4">
              <Button type="submit" isLoading={isLoading}>
                Salvar avaliação
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
