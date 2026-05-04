import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

const TABELAS = [
  'usuarios', 'turmas', 'disciplinas', 'professores', 'professor_turma_disciplina',
  'alunos', 'avaliacoes', 'frequencia_diaria', 'frequencia_resumo', 'ocorrencias',
  'historico_aluno', 'mensagens', 'mensagens_agendadas', 'automacoes', 'eventos',
] as const

export async function GET() {
  const resultados: Record<string, { existe: boolean; contagem: number | null }> = {}

  await Promise.all(
    TABELAS.map(async (tabela) => {
      const { count, error } = await supabase
        .from(tabela)
        .select('*', { count: 'exact', head: true })

      resultados[tabela] = {
        existe:   !error,
        contagem: error ? null : (count ?? 0),
      }
    })
  )

  const tabelasExistentes = Object.values(resultados).filter((r) => r.existe).length
  const pronto = tabelasExistentes === TABELAS.length

  return NextResponse.json({
    pronto,
    tabelasExistentes,
    totalEsperado: TABELAS.length,
    detalhes: resultados,
    instrucao: pronto
      ? 'Schema OK! Banco pronto para uso.'
      : `Execute supabase/setup_completo.sql no SQL Editor do Supabase. ${TABELAS.length - tabelasExistentes} tabelas faltando.`,
  })
}
