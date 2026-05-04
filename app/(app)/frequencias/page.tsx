'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Button, Input, Select, Card,
  Table, Badge, ConfirmModal, useToast, Avatar
} from '@/components/ui'
import type { Column } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

// ─── TIPOS ───────────────────────────────────────────────────────────────────

interface FrequenciaResumoPaginada {
  id: string
  aluno_id: string
  aluno_nome: string
  turma_nome: string
  mes: number
  ano: number
  percentual: number
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function FrequenciasPage() {
  const { success, danger } = useToast()

  const [frequencias, setFrequencias] = useState<FrequenciaResumoPaginada[]>([])
  const [busca, setBusca] = useState('')
  const [mes, setMes] = useState(new Date().getMonth() + 1)
  const [ano, setAno] = useState(new Date().getFullYear())
  const [isLoading, setIsLoading] = useState(true)

  // ── FETCH ────────────────────────────────────────────────────────────────
  const fetchFrequencias = async () => {
    setIsLoading(true)

    const { data, error } = await supabase
      .from('frequencia_resumo')
      .select(`
        id,
        aluno_id,
        mes,
        ano,
        percentual,
        alunos(nome, turma_id, turmas(nome))
      `)
      .eq('mes', mes)
      .eq('ano', ano)
      .order('percentual', { ascending: true })

    if (error) {
      console.error(error)
      danger('Erro ao carregar frequências')
      setIsLoading(false)
      return
    }

    const formatted: FrequenciaResumoPaginada[] = (data ?? []).map((f: any) => ({
      id: f.id,
      aluno_id: f.aluno_id,
      aluno_nome: f.alunos?.nome || '-',
      turma_nome: f.alunos?.turmas?.nome || '-',
      mes: f.mes,
      ano: f.ano,
      percentual: f.percentual ?? 0,
    }))

    setFrequencias(formatted)
    setIsLoading(false)
  }

  useEffect(() => {
    fetchFrequencias()
  }, [mes, ano])

  // ── FILTRO ────────────────────────────────────────────────────────────────
  const filtered = frequencias.filter(f => {
    const matchBusca = f.aluno_nome.toLowerCase().includes(busca.toLowerCase()) ||
                       f.turma_nome.toLowerCase().includes(busca.toLowerCase())
    return matchBusca
  })

  // ── ESTATÍSTICAS ──────────────────────────────────────────────────────────
  const media = frequencias.length > 0
    ? (frequencias.reduce((sum, f) => sum + f.percentual, 0) / frequencias.length).toFixed(1)
    : 0

  const abaixo75 = frequencias.filter(f => f.percentual < 75).length
  const abaixo80 = frequencias.filter(f => f.percentual < 80).length

  // ─── MESES ───────────────────────────────────────────────────────────────
  const meses = [
    { value: 1, label: 'Janeiro' },
    { value: 2, label: 'Fevereiro' },
    { value: 3, label: 'Março' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Maio' },
    { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Setembro' },
    { value: 10, label: 'Outubro' },
    { value: 11, label: 'Novembro' },
    { value: 12, label: 'Dezembro' },
  ]

  const anos = Array.from({ length: 5 }, (_, i) => ({
    value: new Date().getFullYear() - 2 + i,
    label: (new Date().getFullYear() - 2 + i).toString(),
  }))

  // ── COLUNAS ───────────────────────────────────────────────────────────────
  const columns: Column<FrequenciaResumoPaginada>[] = [
    {
      key: 'aluno',
      header: 'ALUNO',
      accessor: (row) => (
        <div className="flex items-center gap-2">
          <Avatar name={row.aluno_nome} size="sm" />
          <div>
            <p className="text-body-sm font-medium text-ink">{row.aluno_nome}</p>
            <p className="text-caption text-body">{row.turma_nome}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'frequencia',
      header: 'FREQUÊNCIA',
      accessor: (row) => {
        const freq = row.percentual
        const cor = freq >= 90 ? 'bg-success-600' :
                   freq >= 80 ? 'bg-accent-500' :
                   freq >= 75 ? 'bg-warning-500' :
                   'bg-danger-600'
        return (
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-neutral-200 rounded-full h-3 overflow-hidden max-w-48">
              <div className={cn('h-full', cor)} style={{ width: `${freq}%` }} />
            </div>
            <span className={cn('text-body-sm font-semibold w-12 text-right',
              freq >= 90 ? 'text-success-600' :
              freq >= 80 ? 'text-accent-500' :
              freq >= 75 ? 'text-warning-500' :
              'text-danger-600'
            )}>
              {freq.toFixed(1)}%
            </span>
          </div>
        )
      },
    },
    {
      key: 'status',
      header: 'STATUS',
      accessor: (row) => {
        let variant: 'success' | 'warning' | 'danger' = 'success'
        let label = 'Bom'

        if (row.percentual < 75) {
          variant = 'danger'
          label = '🚨 Crítico'
        } else if (row.percentual < 80) {
          variant = 'warning'
          label = '⚠️ Atenção'
        }

        return <Badge variant={variant}>{label}</Badge>
      },
    },
  ]

  return (
    <div className="p-8 space-y-6">

      {/* HEADER */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-display font-semibold text-ink">Frequências</h1>
          <p className="text-body text-ink-muted mt-1">
            Acompanhe a frequência dos alunos
          </p>
        </div>

        <div className="flex gap-3 flex-wrap">
          <Link href="/frequencias/novo">
            <Button>+ Lançar presença</Button>
          </Link>

          <Link href="/frequencias/importar">
            <Button variant="secondary">📊 Importar</Button>
          </Link>
        </div>
      </div>

      {/* CARDS INFORMATIVOS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <Card.Body>
            <p className="text-caption text-body mb-2">Alunos monitorados</p>
            <p className="text-display-sm font-semibold text-ink">{frequencias.length}</p>
          </Card.Body>
        </Card>

        <Card>
          <Card.Body>
            <p className="text-caption text-body mb-2">Freq. média</p>
            <p className="text-display-sm font-semibold text-accent-500">{media}%</p>
          </Card.Body>
        </Card>

        <Card>
          <Card.Body>
            <p className="text-caption text-body mb-2">Abaixo de 80%</p>
            <p className="text-display-sm font-semibold text-warning-500">{abaixo80}</p>
          </Card.Body>
        </Card>

        <Card>
          <Card.Body>
            <p className="text-caption text-body mb-2">Crítico (&lt;75%)</p>
            <p className="text-display-sm font-semibold text-danger-600">{abaixo75}</p>
          </Card.Body>
        </Card>
      </div>

      {/* FILTROS */}
      <Card>
        <Card.Body>
          <div className="flex gap-4 flex-wrap items-end">
            <div className="flex-1 min-w-48">
              <Input
                placeholder="Buscar aluno ou turma..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>

            <Select
              placeholder="Mês"
              value={mes.toString()}
              onChange={(e) => setMes(parseInt(e.target.value))}
              options={meses.map(m => ({ value: m.value.toString(), label: m.label }))}
            />

            <Select
              placeholder="Ano"
              value={ano.toString()}
              onChange={(e) => setAno(parseInt(e.target.value))}
              options={anos.map(a => ({ value: a.value.toString(), label: a.label }))}
            />
          </div>
        </Card.Body>
      </Card>

      {/* TABELA */}
      <Table
        columns={columns}
        data={filtered}
        keyExtractor={(row) => row.id}
        isLoading={isLoading}
      />
    </div>
  )
}
