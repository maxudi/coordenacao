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

interface Avaliacao {
  id:                  string
  aluno_id:            string
  aluno_nome:          string
  turma_nome:          string
  disciplina_id:       string
  disciplina_nome:     string
  etapa_id:            string | null
  etapa_nome:          string | null
  etapa_ordem:         number | null
  professor_nome:      string | null
  tipo:                string
  valor:               number
  valor_maximo:        number
  nota_percentual:     number
  data:                string
}

interface GrupoEtapa {
  etapa_id:    string
  etapa_nome:  string
  etapa_ordem: number
  etapa_peso:  number
  avaliacoes:  Avaliacao[]
  soma_valor:  number
  soma_maximo: number
  nota_etapa:  number
}

const TIPO_OPCOES = [
  { value: 'prova',        label: 'Prova' },
  { value: 'trabalho',     label: 'Trabalho' },
  { value: 'participacao', label: 'Participação' },
  { value: 'atividade',    label: 'Atividade' },
]

function corNota(p: number) {
  return p >= 70 ? 'text-success-600' : p >= 50 ? 'text-accent-500' : 'text-danger-600'
}
function barNota(p: number) {
  return p >= 70 ? 'bg-success-600' : p >= 50 ? 'bg-accent-500' : 'bg-danger-600'
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function AvalicoesPage() {
  const { success, danger } = useToast()

  const [avaliacoes, setAvaliacoes]     = useState<Avaliacao[]>([])
  const [grupos, setGrupos]             = useState<GrupoEtapa[]>([])
  const [semEtapa, setSemEtapa]         = useState<Avaliacao[]>([])
  const [notaFinal, setNotaFinal]       = useState<number | null>(null)
  const [disciplinas, setDisciplinas]   = useState<Array<{ id: string; nome: string }>>([])
  const [etapas, setEtapas]             = useState<Array<{ id: string; nome: string; ordem: number }>>([])

  const [busca, setBusca]               = useState('')
  const [filtroDisciplina, setFiltroDisciplina] = useState('')
  const [filtroTipo, setFiltroTipo]     = useState('')
  const [filtroEtapa, setFiltroEtapa]   = useState('')
  const [modoVista, setModoVista]       = useState<'etapas' | 'lista'>('etapas')

  const [isLoading, setIsLoading]       = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<Avaliacao | null>(null)
  const [isDeleting, setIsDeleting]     = useState(false)

  const fetchAvaliacoes = async () => {
    setIsLoading(true)

    let query = supabase
      .from('avaliacoes')
      .select(`
        id,
        aluno_id,
        disciplina_id,
        etapa_id,
        professor_id,
        turma_id,
        tipo,
        valor,
        valor_maximo,
        data,
        alunos(nome, turma_id, turmas(nome)),
        disciplinas(nome, nota_maxima),
        etapas(nome, ordem, peso),
        professores(nome)
      `)
      .order('data', { ascending: false })

    if (filtroDisciplina) query = query.eq('disciplina_id', filtroDisciplina)
    if (filtroEtapa)      query = query.eq('etapa_id', filtroEtapa)

    const { data, error } = await query

    if (error) {
      console.error(error)
      danger('Erro ao carregar avaliações')
      setIsLoading(false)
      return
    }

    const formatted: Avaliacao[] = (data ?? []).map((a: any) => {
      const aluno    = Array.isArray(a.alunos) ? a.alunos[0] : a.alunos
      const valorMax = a.valor_maximo ?? 10
      const pct      = valorMax > 0 ? Math.round((a.valor / valorMax) * 10000) / 100 : 0

      return {
        id:              a.id,
        aluno_id:        a.aluno_id,
        aluno_nome:      aluno?.nome ?? '-',
        turma_nome:      aluno?.turmas?.nome ?? '-',
        disciplina_id:   a.disciplina_id,
        disciplina_nome: a.disciplinas?.nome ?? '-',
        etapa_id:        a.etapa_id,
        etapa_nome:      a.etapas?.nome ?? null,
        etapa_ordem:     a.etapas?.ordem ?? null,
        professor_nome:  a.professores?.nome ?? null,
        tipo:            a.tipo ?? '-',
        valor:           a.valor,
        valor_maximo:    valorMax,
        nota_percentual: pct,
        data:            a.data,
      }
    })

    const etapasMap = new Map<string, GrupoEtapa>()
    const semEt: Avaliacao[] = []

    for (const av of formatted) {
      if (!av.etapa_id) { semEt.push(av); continue }
      if (!etapasMap.has(av.etapa_id)) {
        const raw = (data ?? []).find((r: any) => r.etapa_id === av.etapa_id) as any
        etapasMap.set(av.etapa_id, {
          etapa_id:    av.etapa_id,
          etapa_nome:  av.etapa_nome ?? av.etapa_id,
          etapa_ordem: av.etapa_ordem ?? 0,
          etapa_peso:  raw?.etapas?.peso ?? 0,
          avaliacoes:  [],
          soma_valor:  0,
          soma_maximo: 0,
          nota_etapa:  0,
        })
      }
      const g = etapasMap.get(av.etapa_id)!
      g.avaliacoes.push(av)
      g.soma_valor  += av.valor
      g.soma_maximo += av.valor_maximo
    }

    for (const g of etapasMap.values()) {
      g.nota_etapa = g.soma_maximo > 0
        ? Math.round((g.soma_valor / g.soma_maximo) * 10000) / 100
        : 0
    }

    const gruposOrdenados = Array.from(etapasMap.values()).sort((a, b) => a.etapa_ordem - b.etapa_ordem)

    const totalPeso = gruposOrdenados.reduce((s, g) => s + g.etapa_peso, 0)
    const nf = totalPeso > 0
      ? Math.round(gruposOrdenados.reduce((s, g) => s + g.nota_etapa * g.etapa_peso, 0) / totalPeso * 100) / 100
      : null

    setAvaliacoes(formatted)
    setGrupos(gruposOrdenados)
    setSemEtapa(semEt)
    setNotaFinal(nf)
    setIsLoading(false)
  }

  const fetchRefs = async () => {
    const [{ data: discs }, { data: ets }] = await Promise.all([
      (supabase as any).from('disciplinas').select('id, nome').order('nome'),
      (supabase as any).from('etapas').select('id, nome, ordem').order('ordem'),
    ])
    setDisciplinas(discs ?? [])
    setEtapas(ets ?? [])
  }

  useEffect(() => { fetchRefs() }, [])
  useEffect(() => { fetchAvaliacoes() }, [filtroDisciplina, filtroEtapa])

  const applyLocal = (list: Avaliacao[]) =>
    list.filter(a => {
      const matchBusca = !busca ||
        a.aluno_nome.toLowerCase().includes(busca.toLowerCase()) ||
        a.disciplina_nome.toLowerCase().includes(busca.toLowerCase())
      const matchTipo = !filtroTipo || a.tipo === filtroTipo
      return matchBusca && matchTipo
    })

  const avaliacoesFiltradas = applyLocal(avaliacoes)

  const handleDelete = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    const { error } = await (supabase as any).from('avaliacoes').delete().eq('id', deleteTarget.id)
    if (error) { danger('Erro ao excluir avaliação') }
    else { success('Avaliação removida'); fetchAvaliacoes() }
    setIsDeleting(false)
    setDeleteTarget(null)
  }

  const columns: Column<Avaliacao>[] = [
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
      key: 'disciplina',
      header: 'DISCIPLINA',
      accessor: (row) => <span className="text-body-sm text-ink">{row.disciplina_nome}</span>,
    },
    {
      key: 'tipo',
      header: 'TIPO',
      accessor: (row) => <Badge variant="neutral">{row.tipo}</Badge>,
    },
    {
      key: 'valor',
      header: 'NOTA',
      align: 'center',
      accessor: (row) => (
        <div className="flex flex-col items-center gap-0.5">
          <span className={cn('text-body-sm font-semibold', corNota(row.nota_percentual))}>
            {row.valor}/{row.valor_maximo}
          </span>
          <span className="text-caption text-ink-muted">{row.nota_percentual.toFixed(1)}%</span>
        </div>
      ),
    },
    {
      key: 'etapa',
      header: 'ETAPA',
      accessor: (row) => <span className="text-body-sm text-ink">{row.etapa_nome ?? '—'}</span>,
    },
    {
      key: 'data',
      header: 'DATA',
      accessor: (row) => (
        <span className="text-body-sm text-body">
          {new Date(row.data + 'T00:00:00').toLocaleDateString('pt-BR')}
        </span>
      ),
    },
    {
      key: 'acoes',
      header: '',
      align: 'right',
      width: 'w-32',
      accessor: (row) => (
        <div className="flex items-center justify-end gap-1">
          <Link href={`/avaliacoes/${row.id}/editar`}>
            <Button variant="ghost" size="xs">Editar</Button>
          </Link>
          <Button
            variant="ghost"
            size="xs"
            className="text-danger-600 hover:bg-danger-50"
            onClick={() => setDeleteTarget(row)}
          >
            Excluir
          </Button>
        </div>
      ),
    },
  ]

  const mediaGeral = avaliacoes.length > 0
    ? (avaliacoes.reduce((s, a) => s + a.nota_percentual, 0) / avaliacoes.length).toFixed(1)
    : '—'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-display-sm font-semibold text-ink">Avaliações</h1>
          <p className="text-body-sm text-ink-muted mt-1">{avaliacoesFiltradas.length} registro(s)</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href="/avaliacoes/importar"><Button variant="secondary">📊 Importar</Button></Link>
          <Link href="/avaliacoes/novo"><Button>+ Nova avaliação</Button></Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><Card.Body>
          <p className="text-caption text-ink-muted mb-1">Total</p>
          <p className="text-display-sm font-semibold text-ink">{avaliacoes.length}</p>
        </Card.Body></Card>
        <Card><Card.Body>
          <p className="text-caption text-ink-muted mb-1">Média geral</p>
          <p className="text-display-sm font-semibold text-accent-500">{mediaGeral}%</p>
        </Card.Body></Card>
        <Card><Card.Body>
          <p className="text-caption text-ink-muted mb-1">Abaixo de 50%</p>
          <p className="text-display-sm font-semibold text-danger-600">
            {avaliacoes.filter(a => a.nota_percentual < 50).length}
          </p>
        </Card.Body></Card>
        <Card><Card.Body>
          <p className="text-caption text-ink-muted mb-1">Nota final pond.</p>
          <p className={cn('text-display-sm font-semibold', notaFinal !== null ? corNota(notaFinal) : 'text-ink-muted')}>
            {notaFinal !== null ? `${notaFinal.toFixed(2)}%` : '—'}
          </p>
        </Card.Body></Card>
      </div>

      <Card><Card.Body>
        <div className="flex gap-3 flex-wrap items-center">
          <Input
            placeholder="Buscar aluno ou disciplina..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="flex-1 min-w-48"
          />
          <Select
            placeholder="Disciplina"
            value={filtroDisciplina}
            onChange={e => setFiltroDisciplina(e.target.value)}
            options={disciplinas.map(d => ({ value: d.id, label: d.nome }))}
          />
          <Select
            placeholder="Etapa"
            value={filtroEtapa}
            onChange={e => setFiltroEtapa(e.target.value)}
            options={etapas.map(e => ({ value: e.id, label: e.nome }))}
          />
          <Select
            placeholder="Tipo"
            value={filtroTipo}
            onChange={e => setFiltroTipo(e.target.value)}
            options={TIPO_OPCOES}
          />
          <div className="flex border border-surface-border rounded-lg overflow-hidden ml-auto shrink-0">
            <button
              className={cn('px-3 py-1.5 text-body-sm transition-colors', modoVista === 'etapas' ? 'bg-primary-600 text-white' : 'bg-white text-ink-muted hover:text-ink')}
              onClick={() => setModoVista('etapas')}
            >Por Etapa</button>
            <button
              className={cn('px-3 py-1.5 text-body-sm transition-colors', modoVista === 'lista' ? 'bg-primary-600 text-white' : 'bg-white text-ink-muted hover:text-ink')}
              onClick={() => setModoVista('lista')}
            >Lista</button>
          </div>
        </div>
      </Card.Body></Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <p className="text-body-sm text-ink-muted">Carregando...</p>
        </div>
      ) : modoVista === 'lista' ? (
        <Table columns={columns} data={avaliacoesFiltradas} keyExtractor={r => r.id} isLoading={false} />
      ) : (
        <div className="space-y-6">
          {grupos.length === 0 && semEtapa.length === 0 && (
            <Card><Card.Body className="text-center py-12">
              <p className="text-body-sm text-ink-muted">Nenhuma avaliação encontrada.</p>
            </Card.Body></Card>
          )}

          {grupos.map(grupo => {
            const avsFiltradas = applyLocal(grupo.avaliacoes)
            return (
              <Card key={grupo.etapa_id}>
                <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border">
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-100 text-primary-700 text-body-sm font-semibold">
                      {grupo.etapa_ordem}
                    </span>
                    <div>
                      <p className="text-body-sm font-semibold text-ink">{grupo.etapa_nome}</p>
                      <p className="text-caption text-ink-muted">
                        Peso: {grupo.etapa_peso}% · {grupo.avaliacoes.length} avaliação(ões)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-caption text-ink-muted">Nota da etapa</p>
                      <p className={cn('text-body-sm font-bold', corNota(grupo.nota_etapa))}>
                        {grupo.nota_etapa.toFixed(1)}%
                      </p>
                    </div>
                    <div className="w-24 h-2 bg-neutral-200 rounded-full overflow-hidden">
                      <div className={cn('h-full rounded-full', barNota(grupo.nota_etapa))} style={{ width: `${Math.min(grupo.nota_etapa, 100)}%` }} />
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <Table columns={columns} data={avsFiltradas} keyExtractor={r => r.id} isLoading={false} />
                </div>
              </Card>
            )
          })}

          {semEtapa.length > 0 && (
            <Card>
              <div className="flex items-center gap-3 px-5 py-4 border-b border-surface-border">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-100 text-ink-muted text-body-sm">—</span>
                <div>
                  <p className="text-body-sm font-semibold text-ink">Sem etapa</p>
                  <p className="text-caption text-ink-muted">{semEtapa.length} avaliação(ões) legadas</p>
                </div>
              </div>
              <Table columns={columns} data={applyLocal(semEtapa)} keyExtractor={r => r.id} isLoading={false} />
            </Card>
          )}

          {notaFinal !== null && grupos.length > 0 && (
            <Card className="border-2 border-primary-200"><Card.Body>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-body-sm font-semibold text-ink">Nota Final Ponderada</p>
                  <p className="text-caption text-ink-muted">Calculada proporcionalmente ao peso de cada etapa</p>
                </div>
                <p className={cn('text-display-sm font-bold', corNota(notaFinal))}>{notaFinal.toFixed(2)}%</p>
              </div>
            </Card.Body></Card>
          )}
        </div>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Excluir avaliação"
        description={`Excluir avaliação de ${deleteTarget?.aluno_nome}?`}
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  )
}
