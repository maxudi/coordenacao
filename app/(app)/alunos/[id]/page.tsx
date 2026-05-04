'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  Card, Badge, Button, Spinner, Alert, Select, Textarea, Avatar, useToast,
} from '@/components/ui'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
} from 'recharts'

// ─── TIPOS ───────────────────────────────────────────────────

interface Aluno {
  id: string
  nome: string
  matricula: string
  data_nascimento: string | null
  status: string
  responsavel: string | null
  telefone: string | null
  email: string | null
  turma_id: string | null
  turmas: { nome: string; serie: string } | null
}

interface Avaliacao {
  id: string
  disciplina_id: string
  tipo: string
  nota: number | null
  data: string
  disciplinas: { nome: string } | null
}

interface FreqResumo {
  mes: number
  ano: number
  total_aulas: number
  presencas: number
  percentual: number | null
}

interface Ocorrencia {
  id: string
  tipo: string
  descricao: string
  status: string
  created_at: string
}

// ─── HELPERS ─────────────────────────────────────────────────

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

function calcRisco(freq: number, media: number): 'alto' | 'medio' | 'ok' {
  if (freq < 75 || media < 5) return 'alto'
  if (freq < 85 || media < 6) return 'medio'
  return 'ok'
}

const RISCO_BADGE = {
  alto: 'danger',
  medio: 'warning',
  ok: 'success',
} as const

const TIPO_OCORRENCIA = [
  { value: 'desempenho', label: 'Desempenho' },
  { value: 'frequencia', label: 'Frequência' },
  { value: 'comportamento', label: 'Comportamento' },
  { value: 'outro', label: 'Outro' },
]

const barColor = (nota: number) => nota >= 7 ? '#22c55e' : nota >= 5 ? '#f59e0b' : '#ef4444'

// ─── PAGE ────────────────────────────────────────────────────

export default function AlunoPage() {
  const { id } = useParams<{ id: string }>()
  const { toast } = useToast()

  const [aluno, setAluno] = useState<Aluno | null>(null)
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([])
  const [freqs, setFreqs] = useState<FreqResumo[]>([])
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const [tipoForm, setTipoForm] = useState('desempenho')
  const [descForm, setDescForm] = useState('')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)

    Promise.all([
      (supabase.from('alunos') as any).select('*, turmas(nome, serie)').eq('id', id).single(),
      supabase.from('avaliacoes').select('*, disciplinas(nome)').eq('aluno_id', id).order('data', { ascending: false }),
      supabase.from('frequencia_resumo').select('*').eq('aluno_id', id).order('ano').order('mes'),
      supabase.from('ocorrencias').select('*').eq('aluno_id', id).order('created_at', { ascending: false }),
    ]).then(([a, av, fr, oc]) => {
      if (a.error || !a.data) { setErro(a.error?.message ?? 'Aluno não encontrado'); setLoading(false); return }
      setAluno(a.data as unknown as Aluno)
      setAvaliacoes((av.data ?? []) as unknown as Avaliacao[])
      setFreqs((fr.data ?? []) as unknown as FreqResumo[])
      setOcorrencias((oc.data ?? []) as unknown as Ocorrencia[])
      setLoading(false)
    })
  }, [id])

  async function salvarOcorrencia() {
    if (!descForm.trim() || !aluno) return
    setSalvando(true)
    const { error } = await (supabase.from('ocorrencias') as any).insert({
      aluno_id: aluno.id,
      tipo: tipoForm,
      descricao: descForm.trim(),
      status: 'aberta',
    })
    if (error) { toast({ title: 'Erro ao salvar', variant: 'danger', duration: 4000 }); setSalvando(false); return }
    toast({ title: 'Ocorrência registrada', variant: 'success', duration: 3000 })
    setDescForm('')
    const { data } = await (supabase.from('ocorrencias') as any).select('*').eq('aluno_id', aluno.id).order('created_at', { ascending: false })
    setOcorrencias((data ?? []) as Ocorrencia[])
    setSalvando(false)
  }

  async function resolverOcorrencia(ocId: string) {
    await (supabase.from('ocorrencias') as any)
      .update({ status: 'resolvida' }).eq('id', ocId)
    setOcorrencias(prev => prev.map(o => o.id === ocId ? { ...o, status: 'resolvida' } : o))
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>
  if (erro || !aluno) return <Alert variant="danger" title="Erro" description={erro ?? 'Aluno não encontrado'} />

  const discMap: Record<string, { soma: number; qtd: number }> = {}
  for (const av of avaliacoes) {
    const disc = av.disciplinas?.nome ?? av.disciplina_id
    if (!discMap[disc]) discMap[disc] = { soma: 0, qtd: 0 }
    discMap[disc].soma += av.nota ?? 0
    discMap[disc].qtd += 1
  }
  const notasData = Object.entries(discMap).map(([disc, v]) => ({
    disciplina: disc.length > 8 ? disc.slice(0, 8) + '…' : disc,
    nota: parseFloat((v.soma / v.qtd).toFixed(1)),
  }))

  const freqData = freqs.map(f => ({
    mes: MESES[(f.mes ?? 1) - 1],
    freq: f.percentual ?? 0,
  }))

  const mediaGeral = notasData.length
    ? parseFloat((notasData.reduce((s, d) => s + d.nota, 0) / notasData.length).toFixed(1))
    : 0

  const freqAtual = freqs.length ? (freqs[freqs.length - 1].percentual ?? 0) : 0
  const risco = calcRisco(freqAtual, mediaGeral)

  const idade = aluno.data_nascimento
    ? Math.floor((Date.now() - new Date(aluno.data_nascimento).getTime()) / 3.156e10)
    : null

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <Avatar name={aluno.nome} size="lg" />
          <div>
            <h1 className="text-display-sm font-bold text-ink">{aluno.nome}</h1>
            <p className="text-body-sm text-body">
              {aluno.turmas?.serie} · {aluno.turmas?.nome} · Matrícula {aluno.matricula}
              {idade !== null && ` · ${idade} anos`}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Badge variant={RISCO_BADGE[risco]}>
            Risco {risco === 'ok' ? 'baixo' : risco}
          </Badge>
          <Link href={`/alunos/${aluno.id}/editar`}>
            <Button variant="outline" size="sm">Editar</Button>
          </Link>
          <Link href="/alunos">
            <Button variant="ghost" size="sm">← Voltar</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <p className="text-caption text-body">Frequência</p>
          <p className={cn('text-display-sm font-bold', freqAtual < 75 ? 'text-danger-600' : freqAtual < 85 ? 'text-warning-600' : 'text-success-600')}>
            {freqAtual.toFixed(0)}%
          </p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-caption text-body">Média geral</p>
          <p className={cn('text-display-sm font-bold', mediaGeral < 5 ? 'text-danger-600' : mediaGeral < 7 ? 'text-warning-600' : 'text-success-600')}>
            {mediaGeral || '—'}
          </p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-caption text-body">Ocorrências abertas</p>
          <p className="text-display-sm font-bold text-ink">
            {ocorrencias.filter(o => o.status === 'aberta').length}
          </p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-caption text-body">Responsável</p>
          <p className="text-body-sm font-medium text-ink truncate">{aluno.responsavel ?? '—'}</p>
          {aluno.telefone && <p className="text-caption text-body">{aluno.telefone}</p>}
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-4">
          <h2 className="text-body-sm font-semibold text-ink mb-3">Notas por disciplina</h2>
          {notasData.length === 0
            ? <p className="text-caption text-body">Sem avaliações registradas</p>
            : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={notasData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <XAxis dataKey="disciplina" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: any) => [Number(v).toFixed(1), 'Média']} />
                  <Bar dataKey="nota" radius={[4, 4, 0, 0]}>
                    {notasData.map((d, i) => <Cell key={i} fill={barColor(d.nota)} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
        </Card>

        <Card className="p-4">
          <h2 className="text-body-sm font-semibold text-ink mb-3">Frequência mensal</h2>
          {freqData.length === 0
            ? <p className="text-caption text-body">Sem registros de frequência</p>
            : (
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={freqData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: any) => [`${v}%`, 'Frequência']} />
                  <Line type="monotone" dataKey="freq" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
        </Card>
      </div>

      <Card className="p-4 space-y-4">
        <h2 className="text-body-sm font-semibold text-ink">Ocorrências</h2>

        <div className="flex flex-col gap-2 border border-border rounded-lg p-3">
          <p className="text-caption font-medium text-body">Nova ocorrência</p>
          <Select
            value={tipoForm}
            onChange={e => setTipoForm(e.target.value)}
            options={TIPO_OCORRENCIA}
          />
          <Textarea
            value={descForm}
            onChange={e => setDescForm(e.target.value)}
            placeholder="Descreva a ocorrência..."
            rows={2}
          />
          <Button size="sm" onClick={salvarOcorrencia} isLoading={salvando} disabled={!descForm.trim()}>
            Registrar
          </Button>
        </div>

        {ocorrencias.length === 0
          ? <p className="text-caption text-body">Nenhuma ocorrência registrada</p>
          : (
            <ul className="space-y-2">
              {ocorrencias.map(oc => (
                <li key={oc.id} className="flex items-start justify-between gap-2 rounded-lg border border-border p-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={oc.status === 'resolvida' ? 'success' : 'warning'}>
                        {oc.status}
                      </Badge>
                      <span className="text-caption text-body capitalize">{oc.tipo}</span>
                    </div>
                    <p className="text-body-sm text-ink">{oc.descricao}</p>
                    <p className="text-caption text-body">{new Date(oc.created_at).toLocaleDateString('pt-BR')}</p>
                  </div>
                  {oc.status === 'aberta' && (
                    <Button size="sm" variant="ghost" onClick={() => resolverOcorrencia(oc.id)}>
                      Resolver
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
      </Card>
    </div>
  )
}
