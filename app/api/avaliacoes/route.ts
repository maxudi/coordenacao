import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * GET /api/avaliacoes
 * Retorna avaliações com dados expandidos.
 * Query params:
 *   ?alunoId=  — filtrar por aluno
 *   ?turmaId=  — filtrar por turma
 *   ?etapaId=  — filtrar por etapa
 *   ?disciplinaId= — filtrar por disciplina
 *   ?agrupado=true — agrupar por etapa (inclui cálculo proporcional)
 */
export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams
    const alunoId      = params.get('alunoId')
    const turmaId      = params.get('turmaId')
    const etapaId      = params.get('etapaId')
    const disciplinaId = params.get('disciplinaId')
    const agrupado     = params.get('agrupado') === 'true'

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
        created_at,
        alunos(nome, turma_id, turmas(nome)),
        disciplinas(nome, nota_maxima),
        etapas(nome, ordem, peso),
        professores(nome)
      `)
      .order('data', { ascending: false })

    if (alunoId)      query = query.eq('aluno_id', alunoId)
    if (turmaId)      query = query.eq('turma_id', turmaId)
    if (etapaId)      query = query.eq('etapa_id', etapaId)
    if (disciplinaId) query = query.eq('disciplina_id', disciplinaId)

    const { data, error } = await query

    if (error) throw error

    // Normalizar resultado
    const avaliacoes = (data ?? []).map((a: any) => {
      const aluno = Array.isArray(a.alunos) ? a.alunos[0] : a.alunos
      const valorMaximo = a.valor_maximo ?? 10 // fallback para dados antigos
      const notaPercentual = valorMaximo > 0
        ? Math.round((a.valor / valorMaximo) * 10000) / 100  // 2 casas decimais
        : 0

      return {
        id:                 a.id,
        aluno_id:           a.aluno_id,
        aluno_nome:         aluno?.nome ?? '-',
        turma_id:           a.turma_id ?? aluno?.turma_id,
        turma_nome:         aluno?.turmas?.nome ?? '-',
        disciplina_id:      a.disciplina_id,
        disciplina_nome:    a.disciplinas?.nome ?? '-',
        disciplina_nota_max: a.disciplinas?.nota_maxima ?? 100,
        etapa_id:           a.etapa_id,
        etapa_nome:         a.etapas?.nome ?? null,
        etapa_ordem:        a.etapas?.ordem ?? null,
        etapa_peso:         a.etapas?.peso ?? null,
        professor_id:       a.professor_id,
        professor_nome:     a.professores?.nome ?? null,
        tipo:               a.tipo,
        valor:              a.valor,
        valor_maximo:       valorMaximo,
        nota_percentual:    notaPercentual,   // valor/valor_maximo * 100
        data:               a.data,
        created_at:         a.created_at,
      }
    })

    if (!agrupado) {
      return NextResponse.json(avaliacoes)
    }

    // ── Agrupar por etapa ──────────────────────────────────────────────────
    // Cálculo proporcional: (Σ valor / Σ valor_maximo) * 100 por etapa
    const etapasMap = new Map<string, {
      etapa_id: string
      etapa_nome: string
      etapa_ordem: number
      etapa_peso: number
      avaliacoes: typeof avaliacoes
      soma_valor: number
      soma_maximo: number
      nota_etapa: number     // nota proporcional (0-100) na etapa
    }>()

    // Etapa nula (dados antigos sem etapa)
    const semEtapa: typeof avaliacoes = []

    for (const av of avaliacoes) {
      if (!av.etapa_id) {
        semEtapa.push(av)
        continue
      }
      if (!etapasMap.has(av.etapa_id)) {
        etapasMap.set(av.etapa_id, {
          etapa_id:    av.etapa_id,
          etapa_nome:  av.etapa_nome ?? av.etapa_id,
          etapa_ordem: av.etapa_ordem ?? 0,
          etapa_peso:  av.etapa_peso ?? 0,
          avaliacoes:  [],
          soma_valor:  0,
          soma_maximo: 0,
          nota_etapa:  0,
        })
      }
      const grupo = etapasMap.get(av.etapa_id)!
      grupo.avaliacoes.push(av)
      grupo.soma_valor  += av.valor
      grupo.soma_maximo += av.valor_maximo
    }

    // Calcular nota proporcional por etapa
    for (const grupo of etapasMap.values()) {
      grupo.nota_etapa = grupo.soma_maximo > 0
        ? Math.round((grupo.soma_valor / grupo.soma_maximo) * 10000) / 100
        : 0
    }

    const grupos = Array.from(etapasMap.values())
      .sort((a, b) => a.etapa_ordem - b.etapa_ordem)

    // Nota final ponderada pelas etapas
    const totalPeso   = grupos.reduce((s, g) => s + g.etapa_peso, 0)
    const notaFinal   = totalPeso > 0
      ? Math.round(
          grupos.reduce((s, g) => s + g.nota_etapa * g.etapa_peso, 0) / totalPeso * 100
        ) / 100
      : null

    return NextResponse.json({
      avaliacoes,
      agrupado: {
        etapas:     grupos,
        sem_etapa:  semEtapa,
        nota_final: notaFinal,
        total_peso: totalPeso,
      },
    })
  } catch (error) {
    console.error('GET /api/avaliacoes:', error)
    const msg = error instanceof Error ? error.message : 'Erro ao buscar avaliações'
    return NextResponse.json({ erro: msg }, { status: 500 })
  }
}

/**
 * POST /api/avaliacoes
 * Criar avaliação
 * Body: { aluno_id, disciplina_id, etapa_id?, professor_id?, turma_id?, tipo, valor, valor_maximo?, data? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      aluno_id, disciplina_id, etapa_id, professor_id, turma_id,
      tipo, valor, valor_maximo, data,
    } = body

    if (!aluno_id || !disciplina_id) {
      return NextResponse.json(
        { erro: 'aluno_id e disciplina_id são obrigatórios' },
        { status: 400 }
      )
    }

    const valorNum  = parseFloat(valor)
    const maxNum    = parseFloat(valor_maximo ?? '10')

    if (isNaN(valorNum) || valorNum < 0) {
      return NextResponse.json({ erro: 'Valor inválido' }, { status: 400 })
    }
    if (isNaN(maxNum) || maxNum <= 0) {
      return NextResponse.json({ erro: 'Valor máximo deve ser maior que 0' }, { status: 400 })
    }
    if (valorNum > maxNum) {
      return NextResponse.json(
        { erro: `Valor (${valorNum}) não pode ser maior que o valor máximo (${maxNum})` },
        { status: 400 }
      )
    }

    const { data: inserted, error } = await supabase
      .from('avaliacoes')
      .insert({
        aluno_id,
        disciplina_id,
        etapa_id:     etapa_id     || null,
        professor_id: professor_id || null,
        turma_id:     turma_id     || null,
        tipo,
        valor:        valorNum,
        valor_maximo: maxNum,
        data:         data || new Date().toISOString().split('T')[0],
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(inserted, { status: 201 })
  } catch (error) {
    console.error('POST /api/avaliacoes:', error)
    const msg = error instanceof Error ? error.message : 'Erro ao criar avaliação'
    return NextResponse.json({ erro: msg }, { status: 500 })
  }
}
