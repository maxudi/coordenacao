import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const frequencias = await request.json()

    if (!Array.isArray(frequencias) || frequencias.length === 0) {
      return Response.json(
        { erro: 'Array vazio ou inválido' },
        { status: 400 }
      )
    }

    if (frequencias.length > 5000) {
      return Response.json(
        { erro: 'Máximo 5000 registros por importação' },
        { status: 400 }
      )
    }

    // Buscar alunos para validação
    const { data: alunos } = await (supabase as any)
      .from('alunos')
      .select('id, nome')

    const alunoMap = new Map((alunos ?? []).map((a: any) => [a.nome.toLowerCase(), a.id]))

    const erros: Array<{ linha: number; nome: string; motivo: string }> = []
    const frequenciasValidas: any[] = []

    // Validar cada linha
    for (let i = 0; i < frequencias.length; i++) {
      const f = frequencias[i]
      const linha = i + 2

      const alunoId = alunoMap.get(f.aluno_nome.toLowerCase())
      if (!alunoId) {
        erros.push({
          linha,
          nome: f.aluno_nome,
          motivo: `Aluno "${f.aluno_nome}" não encontrado`,
        })
        continue
      }

      frequenciasValidas.push({
        aluno_id: alunoId,
        data: f.data,
        presente: f.presente === true || f.presente === 1 || f.presente === '1',
      })
    }

    // Importar em lotes
    let importados = 0
    const batchSize = 500

    for (let i = 0; i < frequenciasValidas.length; i += batchSize) {
      const batch = frequenciasValidas.slice(i, i + batchSize)

      const { error, count } = await (supabase as any)
        .from('frequencia_diaria')
        .upsert(batch, { onConflict: 'aluno_id,data' })

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
