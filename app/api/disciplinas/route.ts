import { NextRequest, NextResponse } from 'next/server'
import { disciplinaService } from '@/lib/services/disciplinaService'

/**
 * GET /api/disciplinas
 * Lista todas as disciplinas ordenadas por nome
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const orderBy = (searchParams.get('orderBy') as 'nome' | 'created_at') || 'nome'
    const ascending = searchParams.get('ascending') !== 'false'

    const disciplinas = await disciplinaService.getAll({
      orderBy,
      ascending,
    })

    return NextResponse.json(disciplinas)
  } catch (error) {
    console.error('GET /api/disciplinas:', error)
    const mensagem = error instanceof Error ? error.message : 'Erro ao buscar disciplinas'
    return NextResponse.json({ erro: mensagem }, { status: 500 })
  }
}

/**
 * POST /api/disciplinas
 * Criar nova disciplina
 * Body: { nome: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nome } = body

    if (!nome) {
      return NextResponse.json({ erro: 'Nome é obrigatório' }, { status: 400 })
    }

    const nova = await disciplinaService.create(nome)
    return NextResponse.json(nova, { status: 201 })
  } catch (error) {
    console.error('POST /api/disciplinas:', error)
    const mensagem = error instanceof Error ? error.message : 'Erro ao criar disciplina'
    const status = mensagem.includes('já existe') ? 409 : 500
    return NextResponse.json({ erro: mensagem }, { status })
  }
}
