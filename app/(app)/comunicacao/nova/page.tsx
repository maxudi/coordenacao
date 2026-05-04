'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Select, Card, Textarea, useToast, Input } from '@/components/ui'
import { supabase } from '@/lib/supabase'

// ─── TIPOS ───────────────────────────────────────────────────────────────────

interface Aluno {
  id: string
  nome: string
  responsavel: string
  telefone: string
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function NovaMessagemPage() {
  const router = useRouter()
  const { success, danger } = useToast()

  const [formData, setFormData] = useState({
    aluno_id: '',
    telefone: '',
    conteudo: '',
  })

  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [selectedAluno, setSelectedAluno] = useState<Aluno | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // ── FETCH ALUNOS ─────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchAlunos = async () => {
      const { data } = await supabase
        .from('alunos')
        .select('id, nome, responsavel, telefone')
        .eq('status', 'ativo')
        .order('nome')

      setAlunos(data ?? [])
    }

    fetchAlunos()
  }, [])

  // ── HANDLE CHANGE ─────────────────────────────────────────────────────────
  const handleAlunoChange = (alunoId: string) => {
    const aluno = alunos.find(a => a.id === alunoId)
    setSelectedAluno(aluno || null)

    setFormData(prev => ({
      ...prev,
      aluno_id: alunoId,
      telefone: aluno?.telefone || '',
    }))
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // ── TEMPLATES ─────────────────────────────────────────────────────────────
  const templates = [
    {
      label: 'Presença baixa',
      mensagem: 'Prezado(a) {responsavel},\n\nSua presença nos alertamos que o aluno {aluno} está com frequência abaixo de 75% este mês. Solicitamos atenção especial a este assunto.\n\nAtenciosamente,\nCoordenação Pedagógica',
    },
    {
      label: 'Desempenho baixo',
      mensagem: 'Prezado(a) {responsavel},\n\nInformamos que o aluno {aluno} apresenta dificuldades em algumas disciplinas. Recomendamos uma conversa para discutir possíveis ações de apoio.\n\nAtenciosamente,\nCoordenação Pedagógica',
    },
    {
      label: 'Elogio de desempenho',
      mensagem: 'Prezado(a) {responsavel},\n\nParabéns! O aluno {aluno} vem apresentando excelente desempenho escolar. Continuamos acompanhando o progresso do aluno.\n\nAtenciosamente,\nCoordenação Pedagógica',
    },
    {
      label: 'Convocação para reunião',
      mensagem: 'Prezado(a) {responsavel},\n\nSolicitamos gentilmente sua presença em uma reunião para discutir o desempenho do aluno {aluno}. Entre em contato conosco para agendar.\n\nAtenciosamente,\nCoordenação Pedagógica',
    },
  ]

  const applyTemplate = (template: string) => {
    if (!selectedAluno) return

    const mensagem = template
      .replace('{responsavel}', selectedAluno.responsavel || 'responsável')
      .replace('{aluno}', selectedAluno.nome)

    setFormData(prev => ({ ...prev, conteudo: mensagem }))
  }

  // ── SUBMIT ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.aluno_id || !formData.telefone || !formData.conteudo) {
      danger('Preencha todos os campos obrigatórios')
      return
    }

    setIsLoading(true)

    const { error } = await supabase.from('mensagens').insert([
      {
        aluno_id: formData.aluno_id,
        telefone: formData.telefone,
        conteudo: formData.conteudo,
        status: 'enviada',
      },
    ])

    if (error) {
      danger('Erro ao enviar mensagem')
      console.error(error)
    } else {
      success('Mensagem enviada com sucesso!')
      router.push('/comunicacao')
    }

    setIsLoading(false)
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-display font-semibold text-ink">Enviar mensagem</h1>
        <p className="text-body text-ink-muted mt-2">Comunique-se com o responsável do aluno</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SELEÇÃO DE ALUNO */}
        <Card>
          <Card.Body>
            <Select
              label="Aluno *"
              value={formData.aluno_id}
              onChange={(e) => handleAlunoChange(e.target.value)}
              options={alunos.map(a => ({
                value: a.id,
                label: `${a.nome} - ${a.responsavel || 'Responsável desconhecido'}`,
              }))}
              required
            />
          </Card.Body>
        </Card>

        {/* INFORMAÇÕES DO ALUNO */}
        {selectedAluno && (
          <Card>
            <Card.Body>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-body-sm">
                <div>
                  <p className="text-body font-semibold mb-1">Aluno</p>
                  <p className="text-ink">{selectedAluno.nome}</p>
                </div>
                <div>
                  <p className="text-body font-semibold mb-1">Responsável</p>
                  <p className="text-ink">{selectedAluno.responsavel || '-'}</p>
                </div>
              </div>
            </Card.Body>
          </Card>
        )}

        {/* TELEFONE */}
        <Input
          label="Telefone *"
          type="tel"
          value={formData.telefone}
          onChange={(e) => handleChange('telefone', e.target.value)}
          placeholder="(XX) XXXXX-XXXX"
          required
        />

        {/* TEMPLATES */}
        {selectedAluno && (
          <Card>
            <Card.Body>
              <p className="text-body-sm font-semibold text-body mb-3">Usar template:</p>
              <div className="flex gap-2 flex-wrap">
                {templates.map((t, i) => (
                  <Button
                    key={i}
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => applyTemplate(t.mensagem)}
                  >
                    {t.label}
                  </Button>
                ))}
              </div>
            </Card.Body>
          </Card>
        )}

        {/* MENSAGEM */}
        <Textarea
          label="Mensagem *"
          value={formData.conteudo}
          onChange={(e) => handleChange('conteudo', e.target.value)}
          placeholder="Digite a mensagem..."
          rows={8}
          required
        />

        {/* AÇÕES */}
        <div className="flex gap-3 pt-4">
          <Button type="submit" isLoading={isLoading}>
            Enviar mensagem
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
    </div>
  )
}
