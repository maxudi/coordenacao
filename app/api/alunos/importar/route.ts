import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

export interface AlunoImportRow {
  nome: string
  data_nascimento?: string
  turma_nome?: string
  responsavel?: string
  telefone?: string
  email?: string
  status?: string
}

export interface ImportResult {
  importados: number
  erros: { linha: number; nome: string; motivo: string }[]
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let rows: AlunoImportRow[]
  try {
    rows = await req.json()
  } catch {
    return NextResponse.json({ error: 'Payload inválido' }, { status: 400 })
  }

  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: 'Nenhum registro recebido' }, { status: 400 })
  }

  if (rows.length > 1000) {
    return NextResponse.json({ error: 'Máximo de 1000 alunos por importação' }, { status: 400 })
  }

  // Carregar todas as turmas para resolver pelo nome
  const { data: turmas } = await (supabase as any).from('turmas').select('id, nome, serie')
  const turmaMap: Record<string, string> = {}
  for (const t of turmas ?? []) {
    turmaMap[t.nome.toLowerCase().trim()] = t.id
    turmaMap[`${t.serie} ${t.nome}`.toLowerCase().trim()] = t.id
  }

  const STATUS_VALIDOS = ['ativo', 'inativo', 'transferido']
  const erros: ImportResult['erros'] = []
  const inserts: object[] = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const linha = i + 2 // +2 porque linha 1 é cabeçalho

    if (!row.nome?.trim()) {
      erros.push({ linha, nome: row.nome ?? '', motivo: 'Campo "nome" obrigatório' })
      continue
    }

    const status = (row.status?.toLowerCase().trim() ?? 'ativo')
    if (!STATUS_VALIDOS.includes(status)) {
      erros.push({ linha, nome: row.nome, motivo: `Status inválido: "${row.status}". Use: ativo, inativo ou transferido` })
      continue
    }

    let turmaId: string | null = null
    if (row.turma_nome?.trim()) {
      turmaId = turmaMap[row.turma_nome.toLowerCase().trim()] ?? null
      if (!turmaId) {
        erros.push({ linha, nome: row.nome, motivo: `Turma não encontrada: "${row.turma_nome}"` })
        continue
      }
    }

    let dataNasc: string | null = null
    if (row.data_nascimento?.trim()) {
      // Aceita DD/MM/YYYY ou YYYY-MM-DD
      const raw = row.data_nascimento.trim()
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) {
        const [d, m, y] = raw.split('/')
        dataNasc = `${y}-${m}-${d}`
      } else if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
        dataNasc = raw
      } else {
        erros.push({ linha, nome: row.nome, motivo: `Data de nascimento inválida: "${raw}". Use DD/MM/AAAA` })
        continue
      }
    }

    inserts.push({
      matricula:       `IMP${Date.now().toString().slice(-8)}${String(i).padStart(3, '0')}`,
      nome:            row.nome.trim(),
      data_nascimento: dataNasc,
      turma_id:        turmaId,
      responsavel:     row.responsavel?.trim() ?? null,
      telefone:        row.telefone?.trim() ?? null,
      email:           row.email?.trim().toLowerCase() ?? null,
      status,
    })
  }

  let importados = 0
  if (inserts.length > 0) {
    // Inserir em lotes de 100
    for (let i = 0; i < inserts.length; i += 100) {
      const batch = inserts.slice(i, i + 100)
      const { error } = await (supabase as any).from('alunos').insert(batch)
      if (error) {
        return NextResponse.json(
          { error: `Erro ao inserir lote (linha ~${i + 2}): ${error.message}` },
          { status: 500 },
        )
      }
      importados += batch.length
    }
  }

  return NextResponse.json({ importados, erros } satisfies ImportResult)
}
