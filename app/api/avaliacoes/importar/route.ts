import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const avaliacoes = await request.json()

    if (!Array.isArray(avaliacoes) || avaliacoes.length === 0) {
      return Response.json(
        { erro: 'Array vazio ou inválido' },
        { status: 400 }
      )
    }

    if (avaliacoes.length > 1000) {
      return Response.json(
        { erro: 'Máximo 1000 registros por importação' },
        { status: 400 }
      )
    }

    // Buscar referências para validação
    const { data: alunos } = await (supabase as any).from('alunos').select('id, nome')
    const { data: disciplinas } = await (supabase as any).from('disciplinas').select('id, nome')
    const { data: etapas } = await (supabase as any).from('etapas').select('id, nome')

    const alunoMap      = new Map((alunos     ?? []).map((a: any) => [a.nome.toLowerCase(), a.id]))
    const disciplinaMap = new Map((disciplinas ?? []).map((d: any) => [d.nome.toLowerCase(), d.id]))
    const etapaMap      = new Map((etapas      ?? []).map((e: any) => [e.nome.toLowerCase(), e.id]))

    const erros: Array<{ linha: number; nome: string; motivo: string }> = []
    const avaliacoesValidas: any[] = []

    // Validar cada linha
    for (let i = 0; i < avaliacoes.length; i++) {
      const a = avaliacoes[i]
      const linha = i + 2

      const alunoId = alunoMap.get(a.aluno_nome.toLowerCase())
      if (!alunoId) {
        erros.push({
          linha,
          nome: a.aluno_nome,
          motivo: `Aluno "${a.aluno_nome}" não encontrado`,
        })
        continue
      }

      const disciplinaId = disciplinaMap.get(a.disciplina_nome.toLowerCase())
      if (!disciplinaId) {
        erros.push({
          linha,
          nome: a.aluno_nome,
          motivo: `Disciplina "${a.disciplina_nome}" não encontrada`,
        })
        continue
      }

      const valor     = parseFloat(a.valor)
      const valorMax  = a.valor_maximo != null ? parseFloat(a.valor_maximo) : 10
      const etapaId   = a.etapa_nome ? (etapaMap.get(a.etapa_nome.toLowerCase()) ?? null) : null

      if (isNaN(valorMax) || valorMax <= 0) {
        erros.push({ linha, nome: a.aluno_nome, motivo: 'valor_maximo inválido' })
        continue
      }
      if (isNaN(valor) || valor < 0 || valor > valorMax) {
        erros.push({ linha, nome: a.aluno_nome, motivo: `Nota ${valor} fora do intervalo [0, ${valorMax}]` })
        continue
      }

      avaliacoesValidas.push({
        aluno_id:      alunoId,
        disciplina_id: disciplinaId,
        etapa_id:      etapaId,
        tipo:          a.tipo,
        valor,
        valor_maximo:  valorMax,
        data:          a.data,
      })
    }

    // Importar em lotes
    let importados = 0
    const batchSize = 100

    for (let i = 0; i < avaliacoesValidas.length; i += batchSize) {
      const batch = avaliacoesValidas.slice(i, i + batchSize)

      const { error, count } = await (supabase as any)
        .from('avaliacoes')
        .insert(batch)

      if (error) {
        console.error('Erro ao importar batch:', error)
        erros.push({
          linha: i + 2,
          nome: 'Lote',
          motivo: error.message,
        })
      } else {
        importados += count || batch.length
      }
    }

    return Response.json({
      importados,
      erros,
    })
  } catch (error) {
    console.error('Erro na importação:', error)
    return Response.json(
      { erro: 'Erro ao processar importação' },
      { status: 500 }
    )
  }
}
