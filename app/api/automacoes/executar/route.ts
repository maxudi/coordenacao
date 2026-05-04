import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database, AutomacaoCondicao, AutomacaoAcao } from '@/lib/database.types'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

// ─── SEED PADRÃO ─────────────────────────────────────────────────────────────
// condicao / acao agora são JSONB

const AUTOMACOES_PADRAO: Array<{
  nome: string
  condicao: AutomacaoCondicao
  acao: AutomacaoAcao
  ativo: boolean
}> = [
  {
    nome:     'Alerta de baixa frequência',
    condicao: { gatilho: 'frequencia', limiar: 75 },
    acao:     { tipo: 'notificacao', descricao: 'Cria ocorrência quando aluno atinge menos de 75% de frequência no mês.' },
    ativo:    true,
  },
  {
    nome:     'Mensagem ao responsável — frequência crítica',
    condicao: { gatilho: 'frequencia', limiar: 70 },
    acao:     { tipo: 'mensagem', descricao: 'Envia mensagem ao responsável quando frequência cai abaixo de 70%.' },
    ativo:    true,
  },
  {
    nome:     'Lembrete de reunião de pais',
    condicao: { gatilho: 'data', tipo: 'reuniao' },
    acao:     { tipo: 'mensagem', descricao: 'Cria mensagem 48h antes de cada evento do tipo reunião na agenda.' },
    ativo:    true,
  },
  {
    nome:     'Alerta de nota abaixo da média',
    condicao: { gatilho: 'nota', limiar: 5 },
    acao:     { tipo: 'notificacao', descricao: 'Cria ocorrência quando aluno tira nota abaixo de 5,0 em qualquer avaliação.' },
    ativo:    true,
  },
  {
    nome:     'Tarefa de boas-vindas — novo aluno',
    condicao: { gatilho: 'matricula' },
    acao:     { tipo: 'tarefa', descricao: 'Cria entrada no histórico ao matricular novo aluno.' },
    ativo:    false,
  },
]

// ─── HELPERS ─────────────────────────────────────────────────────────────────

async function execFrequenciaBaixa(limiar = 75): Promise<{ criadas: number; detalhes: string[] }> {
  const mes = new Date().getMonth() + 1
  const ano = new Date().getFullYear()

  const { data, error } = await supabase
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
    const { data: existe } = await supabase
      .from('ocorrencias')
      .select('id')
      .eq('aluno_id', aluno.id)
      .eq('tipo', 'frequencia')
      .gte('created_at', inicioMes)
      .limit(1)

    if (existe?.length) continue

    await supabase.from('ocorrencias').insert({
      aluno_id:  aluno.id,
      tipo:      'frequencia',
      descricao: `Frequência abaixo de ${limiar}%: ${freq.percentual}% em ${mes}/${ano}. Acompanhamento necessário.`,
      status:    'aberta',
    })

    criadas.push(`${aluno.nome} (${freq.percentual}%)`)
  }

  return { criadas: criadas.length, detalhes: criadas }
}

async function execMensagemFrequenciaCritica(limiar = 70): Promise<{ criadas: number; detalhes: string[] }> {
  const mes = new Date().getMonth() + 1
  const ano = new Date().getFullYear()

  const { data, error } = await supabase
    .from('frequencia_resumo')
    .select('aluno_id, percentual, alunos(id, nome, responsavel, telefone, status)')
    .lt('percentual', limiar)
    .eq('mes', mes)
    .eq('ano', ano)

  if (error || !data?.length) return { criadas: 0, detalhes: [] }

  const criadas: string[] = []

  for (const freq of data) {
    const aluno = freq.alunos as {
      id: string; nome: string; responsavel: string | null
      telefone: string | null; status: string
    } | null
    if (!aluno || aluno.status !== 'ativo') continue

    // Evitar duplicata no mesmo mês
    const inicioMes = new Date(ano, mes - 1, 1).toISOString()
    const { data: existe } = await supabase
      .from('mensagens')
      .select('id')
      .eq('aluno_id', aluno.id)
      .ilike('conteudo', '%frequência crítica%')
      .gte('created_at', inicioMes)
      .limit(1)

    if (existe?.length) continue

    await supabase.from('mensagens').insert({
      aluno_id:  aluno.id,
      telefone:  aluno.telefone,
      conteudo:  `[Automação] Frequência crítica — ${aluno.nome}: ${freq.percentual}% no mês ${mes}/${ano}. ` +
                 `Responsável: ${aluno.responsavel ?? 'não informado'}. Entrar em contato com a coordenação.`,
      status:    'pendente',
    })

    criadas.push(`${aluno.nome} (${freq.percentual}%)`)
  }

  return { criadas: criadas.length, detalhes: criadas }
}

async function execLembreteReuniao(): Promise<{ criadas: number; detalhes: string[] }> {
  const agora    = new Date()
  const em48h    = new Date(agora.getTime() + 48 * 60 * 60 * 1000)
  const hojeISO  = agora.toISOString().split('T')[0]
  const em48hISO = em48h.toISOString().split('T')[0]

  const { data: eventos, error } = await supabase
    .from('eventos')
    .select('id, titulo, data_inicio, tipo')
    .ilike('tipo', '%reuni%')
    .gte('data_inicio', hojeISO)
    .lte('data_inicio', em48hISO)

  if (error || !eventos?.length) return { criadas: 0, detalhes: [] }

  const criadas: string[] = []

  for (const evento of eventos) {
    const { data: existe } = await supabase
      .from('mensagens')
      .select('id')
      .ilike('conteudo', `%${evento.titulo}%`)
      .gte('created_at', hojeISO)
      .limit(1)

    if (existe?.length) continue

    await supabase.from('mensagens').insert({
      conteudo: `[Lembrete automático] Reunião em 48h: "${evento.titulo}" agendada para ${evento.data_inicio}.`,
      status:   'pendente',
    })

    criadas.push(evento.titulo)
  }

  return { criadas: criadas.length, detalhes: criadas }
}

async function execAlertaNota(limiar = 5): Promise<{ criadas: number; detalhes: string[] }> {
  const inicioAno = `${new Date().getFullYear()}-01-01`

  const { data, error } = await supabase
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

    // Evitar duplicata por aluno + disciplina no mesmo ano
    const { data: existe } = await supabase
      .from('ocorrencias')
      .select('id')
      .eq('aluno_id', aluno.id)
      .eq('tipo', 'desempenho')
      .ilike('descricao', `%${disciplinaNome}%`)
      .gte('created_at', inicioAno)
      .limit(1)

    if (existe?.length) continue

    await supabase.from('ocorrencias').insert({
      aluno_id:  aluno.id,
      tipo:      'desempenho',
      descricao: `Nota abaixo de ${limiar},0 em ${disciplinaNome}: ${av.valor}. Requer atenção pedagógica.`,
      status:    'aberta',
    })

    criadas.push(`${aluno.nome} — ${disciplinaNome} (${av.valor})`)
  }

  return { criadas: criadas.length, detalhes: criadas }
}

// ─── POST: executar ───────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { id: automacaoId } = body as { id?: string }

    // Seed se vazio
    const { count } = await supabase.from('automacoes').select('id', { count: 'exact', head: true })
    if (count === 0) {
      await supabase.from('automacoes').insert(AUTOMACOES_PADRAO)
    }

    let query = supabase.from('automacoes').select('*').eq('ativo', true)
    if (automacaoId) query = query.eq('id', automacaoId) as typeof query

    const { data: automacoes, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!automacoes?.length) return NextResponse.json({ executadas: 0, detalhes: [] })

    const resultados: Array<{ nome: string; criadas: number; itens: string[] }> = []

    for (const automacao of automacoes) {
      let criadas = 0
      let itens: string[] = []

      const condicao = automacao.condicao as AutomacaoCondicao
      const acao     = automacao.acao     as AutomacaoAcao
      const limiar   = condicao.limiar

      if (condicao.gatilho === 'frequencia' && acao.tipo === 'notificacao') {
        const r = await execFrequenciaBaixa(limiar ?? 75)
        criadas = r.criadas; itens = r.detalhes
      } else if (condicao.gatilho === 'frequencia' && acao.tipo === 'mensagem') {
        const r = await execMensagemFrequenciaCritica(limiar ?? 70)
        criadas = r.criadas; itens = r.detalhes
      } else if (condicao.gatilho === 'data' && acao.tipo === 'mensagem') {
        const r = await execLembreteReuniao()
        criadas = r.criadas; itens = r.detalhes
      } else if (condicao.gatilho === 'nota') {
        const r = await execAlertaNota(limiar ?? 5)
        criadas = r.criadas; itens = r.detalhes
      }

      // Nota: automacoes não tem execucoes/ultima_exec no novo schema
      resultados.push({ nome: automacao.nome, criadas, itens })
    }

    const totalCriadas = resultados.reduce((s, r) => s + r.criadas, 0)
    return NextResponse.json({ executadas: automacoes.length, totalCriadas, resultados })
  } catch (err) {
    console.error('[automacoes/executar]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// ─── GET: listar + seed ───────────────────────────────────────────────────────

export async function GET() {
  try {
    const { count } = await supabase.from('automacoes').select('id', { count: 'exact', head: true })
    if (count === 0) {
      await supabase.from('automacoes').insert(AUTOMACOES_PADRAO)
    }

    const { data, error } = await supabase
      .from('automacoes')
      .select('*')
      .order('created_at')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ automacoes: data })
  } catch (err) {
    console.error('[automacoes GET]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// ─── PATCH: toggle ativo ──────────────────────────────────────────────────────

export async function PATCH(req: NextRequest) {
  try {
    const { id, ativo } = await req.json()
    if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

    const { data, error } = await supabase
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


// Usa service role se disponível (server-side), senão anon (dev)
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

// ─── AUTOMAÇÕES PADRÃO (seed quando tabela vazia) ────────────────────────────

const AUTOMACOES_PADRAO = [
  {
    nome:      'Alerta de baixa frequência',
    descricao: 'Cria ocorrência quando aluno atinge menos de 75% de frequência no mês.',
    gatilho:   'frequencia',
    acao:      'notificacao',
    ativo:     true,
  },
  {
    nome:      'E-mail ao responsável — frequência crítica',
    descricao: 'Envia mensagem ao responsável quando frequência cai abaixo de 70%.',
    gatilho:   'frequencia',
    acao:      'email',
    ativo:     true,
  },
  {
    nome:      'Lembrete de reunião de pais',
    descricao: 'Cria notificação 48h antes de cada evento do tipo "Reunião" na agenda.',
    gatilho:   'data',
    acao:      'notificacao',
    ativo:     true,
  },
  {
    nome:      'Alerta de nota abaixo da média',
    descricao: 'Cria ocorrência quando algum aluno tira média abaixo de 5,0 em qualquer disciplina.',
    gatilho:   'nota',
    acao:      'notificacao',
    ativo:     true,
  },
  {
    nome:      'Relatório mensal de frequência',
    descricao: 'Envia resumo consolidado de frequência no início de cada mês.',
    gatilho:   'data',
    acao:      'email',
    ativo:     false,
  },
  {
    nome:      'Tarefa de boas-vindas — novo aluno',
    descricao: 'Cria ocorrência administrativa ao matricular novo aluno.',
    gatilho:   'matricula',
    acao:      'tarefa',
    ativo:     false,
  },
]

// ─── HELPERS DE EXECUÇÃO ─────────────────────────────────────────────────────

async function execFrequenciaBaixa(): Promise<{ criadas: number; detalhes: string[] }> {
  const mes = new Date().getMonth() + 1
  const ano = new Date().getFullYear()

  const { data: frequencias, error } = await supabase
    .from('frequencias')
    .select('aluno_id, percentual, alunos(id, nome, status)')
    .lt('percentual', 75)
    .eq('mes', mes)
    .eq('ano', ano)

  if (error || !frequencias?.length) return { criadas: 0, detalhes: [] }

  const criadas: string[] = []

  for (const freq of frequencias) {
    const aluno = freq.alunos as { id: string; nome: string; status: string } | null
    if (!aluno || aluno.status !== 'ativo') continue

    // Evitar duplicata: verificar se já existe ocorrência de frequência neste mês
    const inicioMes = new Date(ano, mes - 1, 1).toISOString()
    const { data: existe } = await supabase
      .from('ocorrencias')
      .select('id')
      .eq('aluno_id', aluno.id)
      .eq('tipo', 'frequencia')
      .gte('created_at', inicioMes)
      .limit(1)

    if (existe?.length) continue

    await supabase.from('ocorrencias').insert({
      aluno_id:        aluno.id,
      tipo:            'frequencia',
      descricao:       `Frequência abaixo de 75%: ${freq.percentual}% em ${mes}/${ano}. Acompanhamento necessário.`,
      status:          'aberta',
      data_ocorrencia: new Date().toISOString().split('T')[0],
    })

    criadas.push(`${aluno.nome} (${freq.percentual}%)`)
  }

  return { criadas: criadas.length, detalhes: criadas }
}

async function execEmailFrequenciaCritica(): Promise<{ criadas: number; detalhes: string[] }> {
  const mes = new Date().getMonth() + 1
  const ano = new Date().getFullYear()

  const { data: frequencias, error } = await supabase
    .from('frequencias')
    .select('aluno_id, percentual, alunos(id, nome, responsavel, telefone, email, status)')
    .lt('percentual', 70)
    .eq('mes', mes)
    .eq('ano', ano)

  if (error || !frequencias?.length) return { criadas: 0, detalhes: [] }

  const criadas: string[] = []

  for (const freq of frequencias) {
    const aluno = freq.alunos as {
      id: string; nome: string; responsavel: string | null
      telefone: string | null; email: string | null; status: string
    } | null
    if (!aluno || aluno.status !== 'ativo') continue
    if (!aluno.email && !aluno.responsavel) continue

    // Evitar duplicata neste mês
    const inicioMes = new Date(ano, mes - 1, 1).toISOString()
    const { data: existe } = await supabase
      .from('mensagens')
      .select('id')
      .eq('aluno_id', aluno.id)
      .ilike('assunto', '%frequência crítica%')
      .gte('created_at', inicioMes)
      .limit(1)

    if (existe?.length) continue

    const para = aluno.email ?? `responsavel-de-${aluno.nome.toLowerCase().replace(/\s/g, '-')}@escola.edu.br`

    await supabase.from('mensagens').insert({
      para_email: para,
      assunto:    `[Automação] Frequência crítica — ${aluno.nome}`,
      corpo: `Prezado(a) responsável por ${aluno.nome},\n\n` +
             `A frequência do(a) aluno(a) está em ${freq.percentual}% no mês ${mes}/${ano}, abaixo do mínimo exigido de 70%.\n\n` +
             `Por favor, entre em contato com a coordenação para evitar reprovação por falta.\n\n` +
             `Atenciosamente,\nCoordenação Pedagógica`,
      aluno_id:   aluno.id,
      lida:       false,
    })

    criadas.push(`${aluno.nome} → ${para}`)
  }

  return { criadas: criadas.length, detalhes: criadas }
}

async function execLembreteReuniao(): Promise<{ criadas: number; detalhes: string[] }> {
  const agora    = new Date()
  const em48h    = new Date(agora.getTime() + 48 * 60 * 60 * 1000)
  const hojeISO  = agora.toISOString().split('T')[0]
  const em48hISO = em48h.toISOString().split('T')[0]

  const { data: eventos, error } = await supabase
    .from('eventos')
    .select('id, titulo, data_inicio, hora, local')
    .ilike('tipo', '%reunião%')
    .gte('data_inicio', hojeISO)
    .lte('data_inicio', em48hISO)

  if (error || !eventos?.length) return { criadas: 0, detalhes: [] }

  const criadas: string[] = []

  for (const evento of eventos) {
    // Verificar se lembrete já foi gerado
    const { data: existe } = await supabase
      .from('mensagens')
      .select('id')
      .ilike('assunto', `%Lembrete%${evento.titulo}%`)
      .gte('created_at', hojeISO)
      .limit(1)

    if (existe?.length) continue

    await supabase.from('mensagens').insert({
      para_email: 'coordenacao@escola.edu.br',
      assunto:    `[Lembrete] Reunião em 48h: ${evento.titulo}`,
      corpo:      `Lembrete automático: "${evento.titulo}" está agendado para ${evento.data_inicio}` +
                  (evento.hora ? ` às ${evento.hora}` : '') +
                  (evento.local ? ` — ${evento.local}` : '') + '.',
      lida:       false,
    })

    criadas.push(evento.titulo)
  }

  return { criadas: criadas.length, detalhes: criadas }
}

async function execAlertaNota(): Promise<{ criadas: number; detalhes: string[] }> {
  const anoAtual = new Date().getFullYear()

  const { data: notas, error } = await supabase
    .from('notas')
    .select('aluno_id, disciplina, media_final, alunos(id, nome, status)')
    .lt('media_final', 5)
    .eq('ano', anoAtual)
    .not('media_final', 'is', null)

  if (error || !notas?.length) return { criadas: 0, detalhes: [] }

  const criadas: string[] = []

  for (const nota of notas) {
    const aluno = nota.alunos as { id: string; nome: string; status: string } | null
    if (!aluno || aluno.status !== 'ativo') continue

    // Evitar duplicata por aluno + disciplina + ano
    const inicioAno = new Date(anoAtual, 0, 1).toISOString()
    const { data: existe } = await supabase
      .from('ocorrencias')
      .select('id')
      .eq('aluno_id', aluno.id)
      .eq('tipo', 'desempenho')
      .ilike('descricao', `%${nota.disciplina}%`)
      .gte('created_at', inicioAno)
      .limit(1)

    if (existe?.length) continue

    await supabase.from('ocorrencias').insert({
      aluno_id:        aluno.id,
      tipo:            'desempenho',
      descricao:       `Média abaixo de 5,0 em ${nota.disciplina}: ${nota.media_final} (${anoAtual}). Requer atenção pedagógica.`,
      status:          'aberta',
      data_ocorrencia: new Date().toISOString().split('T')[0],
    })

    criadas.push(`${aluno.nome} — ${nota.disciplina} (${nota.media_final})`)
  }

  return { criadas: criadas.length, detalhes: criadas }
}

// ─── HANDLER ─────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { id: automacaoId } = body as { id?: string }

    // Seed automações padrão se tabela vazia
    const { count } = await supabase.from('automacoes').select('id', { count: 'exact', head: true })
    if (count === 0) {
      await supabase.from('automacoes').insert(AUTOMACOES_PADRAO)
    }

    // Buscar automações para executar
    let query = supabase.from('automacoes').select('*').eq('ativo', true)
    if (automacaoId) query = query.eq('id', automacaoId) as typeof query

    const { data: automacoes, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!automacoes?.length) return NextResponse.json({ executadas: 0, detalhes: [] })

    const resultados: Array<{ nome: string; criadas: number; itens: string[] }> = []

    for (const automacao of automacoes) {
      let criadas = 0
      let itens: string[] = []

      if (automacao.gatilho === 'frequencia' && automacao.acao === 'notificacao') {
        const r = await execFrequenciaBaixa()
        criadas = r.criadas; itens = r.detalhes
      } else if (automacao.gatilho === 'frequencia' && automacao.acao === 'email') {
        const r = await execEmailFrequenciaCritica()
        criadas = r.criadas; itens = r.detalhes
      } else if (automacao.gatilho === 'data' && automacao.acao === 'notificacao') {
        const r = await execLembreteReuniao()
        criadas = r.criadas; itens = r.detalhes
      } else if (automacao.gatilho === 'nota') {
        const r = await execAlertaNota()
        criadas = r.criadas; itens = r.detalhes
      }

      // Atualizar contagem e última execução
      await supabase
        .from('automacoes')
        .update({
          execucoes:  (automacao.execucoes ?? 0) + 1,
          ultima_exec: new Date().toISOString(),
        })
        .eq('id', automacao.id)

      resultados.push({ nome: automacao.nome, criadas, itens })
    }

    const totalCriadas = resultados.reduce((s, r) => s + r.criadas, 0)
    return NextResponse.json({
      executadas:  automacoes.length,
      totalCriadas,
      resultados,
    })
  } catch (err) {
    console.error('[automacoes/executar]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// Seed e lista — GET para o frontend
export async function GET() {
  try {
    const { count } = await supabase.from('automacoes').select('id', { count: 'exact', head: true })
    if (count === 0) {
      await supabase.from('automacoes').insert(AUTOMACOES_PADRAO)
    }

    const { data, error } = await supabase
      .from('automacoes')
      .select('*')
      .order('created_at')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ automacoes: data })
  } catch (err) {
    console.error('[automacoes GET]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// Toggle ativo
export async function PATCH(req: NextRequest) {
  try {
    const { id, ativo } = await req.json()
    if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

    const { data, error } = await supabase
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
