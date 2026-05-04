import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database, AutomacaoAcao, AutomacaoCondicao } from '@/lib/database.types'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

const AUTOMACOES_PADRAO: Array<{
  nome: string
  condicao: AutomacaoCondicao
  acao: AutomacaoAcao
  ativo: boolean
}> = [
  {
    nome: 'Alerta de baixa frequência',
    condicao: { gatilho: 'frequencia', limiar: 75 },
    acao: { tipo: 'notificacao', descricao: 'Cria ocorrência quando aluno atinge menos de 75% de frequência no mês.' },
    ativo: true,
  },
  {
    nome: 'Mensagem ao responsável — frequência crítica',
    condicao: { gatilho: 'frequencia', limiar: 70 },
    acao: { tipo: 'mensagem', descricao: 'Envia mensagem ao responsável quando frequência cai abaixo de 70%.' },
    ativo: true,
  },
  {
    nome: 'Lembrete de reunião de pais',
    condicao: { gatilho: 'data', tipo: 'reuniao' },
    acao: { tipo: 'mensagem', descricao: 'Cria mensagem 48h antes de cada evento do tipo reunião na agenda.' },
    ativo: true,
  },
  {
    nome: 'Alerta de nota abaixo da média',
    condicao: { gatilho: 'nota', limiar: 5 },
    acao: { tipo: 'notificacao', descricao: 'Cria ocorrência quando aluno tira nota abaixo de 5,0 em qualquer avaliação.' },
    ativo: true,
  },
  {
    nome: 'Tarefa de boas-vindas — novo aluno',
    condicao: { gatilho: 'matricula' },
    acao: { tipo: 'tarefa', descricao: 'Cria entrada no histórico ao matricular novo aluno.' },
    ativo: false,
  },
]

async function execFrequenciaBaixa(limiar = 75): Promise<{ criadas: number; detalhes: string[] }> {
  const mes = new Date().getMonth() + 1
  const ano = new Date().getFullYear()

  const { data, error } = await (supabase as any)
    .from('frequencia_resumo')
    .select('aluno_id, percentual, mes, ano, alunos(id, nome, status)')
    .lt('percentual', limiar)
    .eq('mes', mes)
    .eq('ano', ano)

  if (error || !data?.length) return { criadas: 0, detalhes: [] }

  const criadas: string[] = []

  for (const freq of data) {
    const aluno = freq.alunos as { id: string; nome: string; status: string } | null
    if (!aluno || aluno.status !== 'ativo') continue

    const inicioMes = new Date(ano, mes - 1, 1).toISOString()
    const { data: existe } = await (supabase as any)
      .from('ocorrencias')
      .select('id')
      .eq('aluno_id', aluno.id)
      .eq('tipo', 'frequencia')
      .gte('created_at', inicioMes)
      .limit(1)

    if (existe?.length) continue

    await (supabase as any).from('ocorrencias').insert({
      aluno_id: aluno.id,
      tipo: 'frequencia',
      descricao: `Frequência abaixo de ${limiar}%: ${freq.percentual}% em ${mes}/${ano}. Acompanhamento necessário.`,
      status: 'aberta',
    })

    criadas.push(`${aluno.nome} (${freq.percentual}%)`)
  }

  return { criadas: criadas.length, detalhes: criadas }
}

async function execMensagemFrequenciaCritica(limiar = 70): Promise<{ criadas: number; detalhes: string[] }> {
  const mes = new Date().getMonth() + 1
  const ano = new Date().getFullYear()

  const { data, error } = await (supabase as any)
    .from('frequencia_resumo')
    .select('aluno_id, percentual, alunos(id, nome, responsavel, telefone, status)')
    .lt('percentual', limiar)
    .eq('mes', mes)
    .eq('ano', ano)

  if (error || !data?.length) return { criadas: 0, detalhes: [] }

  const criadas: string[] = []

  for (const freq of data) {
    const aluno = freq.alunos as {
      id: string
      nome: string
      responsavel: string | null
      telefone: string | null
      status: string
    } | null

    if (!aluno || aluno.status !== 'ativo') continue

    const inicioMes = new Date(ano, mes - 1, 1).toISOString()
    const { data: existe } = await (supabase as any)
      .from('mensagens')
      .select('id')
      .eq('aluno_id', aluno.id)
      .ilike('conteudo', '%frequência crítica%')
      .gte('created_at', inicioMes)
      .limit(1)

    if (existe?.length) continue

    await (supabase as any).from('mensagens').insert({
      aluno_id: aluno.id,
      telefone: aluno.telefone,
      conteudo:
        `[Automação] Frequência crítica — ${aluno.nome}: ${freq.percentual}% no mês ${mes}/${ano}. ` +
        `Responsável: ${aluno.responsavel ?? 'não informado'}. Entrar em contato com a coordenação.`,
      status: 'pendente',
    })

    criadas.push(`${aluno.nome} (${freq.percentual}%)`)
  }

  return { criadas: criadas.length, detalhes: criadas }
}

async function execLembreteReuniao(): Promise<{ criadas: number; detalhes: string[] }> {
  const agora = new Date()
  const em48h = new Date(agora.getTime() + 48 * 60 * 60 * 1000)
  const hojeISO = agora.toISOString().split('T')[0]
  const em48hISO = em48h.toISOString().split('T')[0]

  const { data: eventos, error } = await (supabase as any)
    .from('eventos')
    .select('id, titulo, data_inicio, tipo')
    .ilike('tipo', '%reuni%')
    .gte('data_inicio', hojeISO)
    .lte('data_inicio', em48hISO)

  if (error || !eventos?.length) return { criadas: 0, detalhes: [] }

  const criadas: string[] = []

  for (const evento of eventos) {
    const { data: existe } = await (supabase as any)
      .from('mensagens')
      .select('id')
      .ilike('conteudo', `%${evento.titulo}%`)
      .gte('created_at', hojeISO)
      .limit(1)

    if (existe?.length) continue

    await (supabase as any).from('mensagens').insert({
      conteudo: `[Lembrete automático] Reunião em 48h: "${evento.titulo}" agendada para ${evento.data_inicio}.`,
      status: 'pendente',
    })

    criadas.push(evento.titulo)
  }

  return { criadas: criadas.length, detalhes: criadas }
}

async function execAlertaNota(limiar = 5): Promise<{ criadas: number; detalhes: string[] }> {
  const inicioAno = `${new Date().getFullYear()}-01-01`

  const { data, error } = await (supabase as any)
    .from('avaliacoes')
    .select('aluno_id, valor, disciplina_id, data, alunos(id, nome, status), disciplinas(nome)')
    .lt('valor', limiar)
    .gte('data', inicioAno)

  if (error || !data?.length) return { criadas: 0, detalhes: [] }

  const criadas: string[] = []

  for (const av of data) {
    const aluno = av.alunos as { id: string; nome: string; status: string } | null
    if (!aluno || aluno.status !== 'ativo') continue

    const disciplinaNome = (av.disciplinas as { nome: string } | null)?.nome ?? 'Disciplina'

    const { data: existe } = await (supabase as any)
      .from('ocorrencias')
      .select('id')
      .eq('aluno_id', aluno.id)
      .eq('tipo', 'desempenho')
      .ilike('descricao', `%${disciplinaNome}%`)
      .gte('created_at', inicioAno)
      .limit(1)

    if (existe?.length) continue

    await (supabase as any).from('ocorrencias').insert({
      aluno_id: aluno.id,
      tipo: 'desempenho',
      descricao: `Nota abaixo de ${limiar},0 em ${disciplinaNome}: ${av.valor}. Requer atenção pedagógica.`,
      status: 'aberta',
    })

    criadas.push(`${aluno.nome} — ${disciplinaNome} (${av.valor})`)
  }

  return { criadas: criadas.length, detalhes: criadas }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { id: automacaoId } = body as { id?: string }

    const { count } = await (supabase as any).from('automacoes').select('id', { count: 'exact', head: true })
    if (count === 0) {
      await (supabase as any).from('automacoes').insert(AUTOMACOES_PADRAO)
    }

    let query = (supabase as any).from('automacoes').select('*').eq('ativo', true)
    if (automacaoId) query = query.eq('id', automacaoId) as typeof query

    const { data: automacoes, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!automacoes?.length) return NextResponse.json({ executadas: 0, detalhes: [] })

    const resultados: Array<{ nome: string; criadas: number; itens: string[] }> = []

    for (const automacao of automacoes) {
      let criadas = 0
      let itens: string[] = []

      const condicao = automacao.condicao as AutomacaoCondicao
      const acao = automacao.acao as AutomacaoAcao
      const limiar = condicao.limiar

      if (condicao.gatilho === 'frequencia' && acao.tipo === 'notificacao') {
        const r = await execFrequenciaBaixa(limiar ?? 75)
        criadas = r.criadas
        itens = r.detalhes
      } else if (condicao.gatilho === 'frequencia' && acao.tipo === 'mensagem') {
        const r = await execMensagemFrequenciaCritica(limiar ?? 70)
        criadas = r.criadas
        itens = r.detalhes
      } else if (condicao.gatilho === 'data' && acao.tipo === 'mensagem') {
        const r = await execLembreteReuniao()
        criadas = r.criadas
        itens = r.detalhes
      } else if (condicao.gatilho === 'nota') {
        const r = await execAlertaNota(limiar ?? 5)
        criadas = r.criadas
        itens = r.detalhes
      }

      resultados.push({ nome: automacao.nome, criadas, itens })
    }

    const totalCriadas = resultados.reduce((sum, resultado) => sum + resultado.criadas, 0)
    return NextResponse.json({ executadas: automacoes.length, totalCriadas, resultados })
  } catch (err) {
    console.error('[automacoes/executar]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const { count } = await (supabase as any).from('automacoes').select('id', { count: 'exact', head: true })
    if (count === 0) {
      await (supabase as any).from('automacoes').insert(AUTOMACOES_PADRAO)
    }

    const { data, error } = await (supabase as any).from('automacoes').select('*').order('created_at')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ automacoes: data })
  } catch (err) {
    console.error('[automacoes GET]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, ativo } = await req.json()
    if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

    const { data, error } = await (supabase as any)
      .from('automacoes')
      .update({ ativo })
      .eq('id', id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ automacao: data })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
