'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Button, Select, Card, useToast, Spinner, Avatar, Badge, Alert
} from '@/components/ui'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

// ─── TIPOS ───────────────────────────────────────────────────────────────────

interface HistoricoItem {
  tipo: 'nota' | 'frequencia' | 'ocorrencia' | 'evento'
  data: string
  titulo: string
  descricao: string
  status?: 'success' | 'warning' | 'danger'
}

interface AlunoHistorico {
  id: string
  nome: string
  turma: string
  historico: HistoricoItem[]
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function HistoricoPage() {
  const { danger } = useToast()

  const [aluno_id, setAluno_id] = useState('')
  const [alunos, setAlunos] = useState<Array<{ id: string; nome: string; turma: string }>>([])
  const [dados, setDados] = useState<AlunoHistorico | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // ── FETCH ALUNOS ─────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchAlunos = async () => {
      const { data } = await (supabase as any)
        .from('alunos')
        .select('id, nome, turma_id, turmas(nome)')
        .eq('status', 'ativo')
        .order('nome')

      const formatted = (data ?? []).map((a: any) => ({
        id: a.id,
        nome: a.nome,
        turma: a.turmas?.nome || '-',
      }))

      setAlunos(formatted)
    }

    fetchAlunos()
  }, [])

  // ── FETCH HISTÓRICO ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!aluno_id) {
      setDados(null)
      return
    }

    const fetchHistorico = async () => {
      setIsLoading(true)

      // Buscar aluno
      const { data: alunoData } = await (supabase as any)
        .from('alunos')
        .select('id, nome, turma_id, turmas(nome)')
        .eq('id', aluno_id)
        .single()

      // Buscar avaliações
      const { data: avaliacoes } = await (supabase as any)
        .from('avaliacoes')
        .select('valor, data, tipo, disciplinas(nome)')
        .eq('aluno_id', aluno_id)
        .order('data', { ascending: false })
        .limit(50)

      // Buscar ocorrências
      const { data: ocorrencias } = await (supabase as any)
        .from('ocorrencias')
        .select('tipo, descricao, status, created_at')
        .eq('aluno_id', aluno_id)
        .order('created_at', { ascending: false })
        .limit(50)

      // Buscar frequência
      const { data: frequencia } = await (supabase as any)
        .from('frequencia_resumo')
        .select('mes, ano, percentual')
        .eq('aluno_id', aluno_id)
        .order('ano', { ascending: false })
        .order('mes', { ascending: false })
        .limit(12)

      // Montar histórico unificado
      const historico: HistoricoItem[] = []

      for (const a of avaliacoes ?? []) {
        const status = a.valor >= 7 ? 'success' : a.valor >= 5 ? 'warning' : 'danger'
        historico.push({
          tipo: 'nota',
          data: a.data,
          titulo: `${a.tipo} em ${a.disciplinas?.nome}`,
          descricao: `Nota: ${a.valor.toFixed(1)}`,
          status,
        })
      }

      for (const o of ocorrencias ?? []) {
        const status = o.status === 'resolvida' ? 'success' : 'warning'
        historico.push({
          tipo: 'ocorrencia',
          data: o.created_at,
          titulo: `Ocorrência: ${o.tipo}`,
          descricao: o.descricao,
          status,
        })
      }

      for (const f of frequencia ?? []) {
        const mes = String(f.mes).padStart(2, '0')
        const status = f.percentual >= 90 ? 'success' : f.percentual >= 75 ? 'warning' : 'danger'
        historico.push({
          tipo: 'frequencia',
          data: `${f.ano}-${mes}-01`,
          titulo: `Frequência ${mes}/${f.ano}`,
          descricao: `${f.percentual.toFixed(1)}%`,
          status,
        })
      }

      // Ordenar por data
      historico.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())

      setDados({
        id: alunoData?.id || '',
        nome: alunoData?.nome || '',
        turma: alunoData?.turmas?.nome || '-',
        historico,
      })

      setIsLoading(false)
    }

    fetchHistorico()
  }, [aluno_id])

  const getIcono = (tipo: string) => {
    switch (tipo) {
      case 'nota':
        return '📝'
      case 'frequencia':
        return '📅'
      case 'ocorrencia':
        return '⚠️'
      default:
        return '📌'
    }
  }

  const getCorStatus = (status?: string) => {
    switch (status) {
      case 'success':
        return 'bg-success-50 border-success-200 text-success-700'
      case 'warning':
        return 'bg-warning-50 border-warning-200 text-warning-700'
      case 'danger':
        return 'bg-danger-50 border-danger-200 text-danger-700'
      default:
        return 'bg-neutral-50 border-neutral-200 text-neutral-700'
    }
  }

  return (
    <div className="p-8 space-y-6">

      {/* HEADER */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-display font-semibold text-ink">Histórico do aluno</h1>
          <p className="text-body text-ink-muted mt-1">
            Visualize o registro longitudinal de um aluno
          </p>
        </div>

        <Link href="/">
          <Button variant="secondary">← Voltar</Button>
        </Link>
      </div>

      {/* SELETOR */}
      <Card>
        <Card.Body>
          <Select
            label="Selecione um aluno"
            value={aluno_id}
            onChange={(e) => setAluno_id(e.target.value)}
            options={alunos.map(a => ({
              value: a.id,
              label: `${a.nome} (${a.turma})`,
            }))}
          />
        </Card.Body>
      </Card>

      {/* HISTÓRICO */}
      {dados && (
        <div className="space-y-6">
          {/* INFO ALUNO */}
          <Card>
            <Card.Body>
              <div className="flex items-center gap-4">
                <Avatar name={dados.nome} size="lg" />
                <div>
                  <h2 className="text-body-lg font-semibold text-ink">{dados.nome}</h2>
                  <p className="text-body-sm text-body">{dados.turma}</p>
                  <p className="text-caption text-body mt-2">
                    {dados.historico.length} registro(s)
                  </p>
                </div>
              </div>
            </Card.Body>
          </Card>

          {/* TIMELINE */}
          {dados.historico.length > 0 ? (
            <div className="space-y-3">
              {dados.historico.map((item, i) => (
                <Card key={i}>
                  <Card.Body>
                    <div className="flex gap-4">
                      {/* ÍCONE */}
                      <div className="text-2xl pt-1">{getIcono(item.tipo)}</div>

                      {/* CONTEÚDO */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="text-body-sm font-semibold text-ink">
                            {item.titulo}
                          </h3>
                          <span className="text-caption text-body whitespace-nowrap">
                            {new Date(item.data).toLocaleDateString('pt-BR')}
                          </span>
                        </div>

                        <p className={cn(
                          'text-body-sm px-3 py-1 rounded border inline-block',
                          getCorStatus(item.status)
                        )}>
                          {item.descricao}
                        </p>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              ))}
            </div>
          ) : (
            <Alert variant="info">
              ℹ️ Nenhum registro encontrado para este aluno.
            </Alert>
          )}
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      )}
    </div>
  )
}
