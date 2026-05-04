'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Input, Select, Card, Textarea, useToast } from '@/components/ui'
import { supabase } from '@/lib/supabase'

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function NovaOcorrenciaPage() {
  const router = useRouter()
  const { success, danger } = useToast()

  const [formData, setFormData] = useState({
    aluno_id: '',
    tipo: 'comportamento',
    descricao: '',
  })

  const [alunos, setAlunos] = useState<Array<{ id: string; nome: string }>>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const fetchAlunos = async () => {
      const { data } = await supabase
        .from('alunos')
        .select('id, nome')
        .eq('status', 'ativo')
        .order('nome')

      setAlunos(data ?? [])
    }

    fetchAlunos()
  }, [])

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.aluno_id || !formData.descricao) {
      danger('Preencha todos os campos obrigatórios')
      return
    }

    setIsLoading(true)

    const { error } = await supabase.from('ocorrencias').insert([
      {
        aluno_id: formData.aluno_id,
        tipo: formData.tipo,
        descricao: formData.descricao,
        status: 'aberta',
      },
    ])

    if (error) {
      danger('Erro ao registrar ocorrência')
      console.error(error)
    } else {
      success('Ocorrência registrada com sucesso!')
      router.push('/ocorrencias')
    }

    setIsLoading(false)
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-display font-semibold text-ink">Nova ocorrência</h1>
        <p className="text-body text-ink-muted mt-2">Registre um novo incidente com aluno</p>
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
              label="Tipo de ocorrência"
              value={formData.tipo}
              onChange={(e) => handleChange('tipo', e.target.value)}
              options={[
                { value: 'comportamento', label: 'Comportamento' },
                { value: 'frequencia', label: 'Frequência' },
                { value: 'desempenho', label: 'Desempenho' },
                { value: 'outro', label: 'Outro' },
              ]}
            />

            <Textarea
              label="Descrição *"
              value={formData.descricao}
              onChange={(e) => handleChange('descricao', e.target.value)}
              placeholder="Descreva detalhadamente o ocorrido..."
              rows={6}
              required
            />

            <div className="flex gap-3 pt-4">
              <Button type="submit" isLoading={isLoading}>
                Registrar ocorrência
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
