import { NextRequest, NextResponse } from 'next/server'
import { vinculoService } from '@/lib/services/vinculoService'

/**
 * GET /api/vinculos
 * Listar vínculos com opções de filtro
 * Params: ?professorId=X&turmaId=Y&disciplinaId=Z
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const professorId = searchParams.get('professorId') ?? undefined
    const turmaId = searchParams.get('turmaId') ?? undefined
    const disciplinaId = searchParams.get('disciplinaId') ?? undefined

    const vinculos = await vinculoService.getAll({
      professorId: professorId || undefined,
      turmaId: turmaId || undefined,
      disciplinaId: disciplinaId || undefined,
    })

    return NextResponse.json(vinculos)
  } catch (error) {
    console.error('GET /api/vinculos:', error)
    const mensagem = error instanceof Error ? error.message : 'Erro ao buscar vínculos'
    return NextResponse.json({ erro: mensagem }, { status: 500 })
  }
}

/**
 * POST /api/vinculos
 * Criar novo vínculo
 * Body: { professorId: string, turmaId: string, disciplinaId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { professorId, turmaId, disciplinaId } = body

    if (!professorId || !turmaId || !disciplinaId) {
      return NextResponse.json(
        { erro: 'professorId, turmaId e disciplinaId são obrigatórios' },
        { status: 400 }
      )
    }

    const novo = await vinculoService.create(professorId, turmaId, disciplinaId)
    return NextResponse.json(novo, { status: 201 })
  } catch (error) {
    console.error('POST /api/vinculos:', error)
    const mensagem = error instanceof Error ? error.message : 'Erro ao criar vínculo'
    const status = mensagem.includes('não encontrado') || mensagem.includes('não existe')
      ? 404
      : mensagem.includes('já existe')
        ? 409
        : 500
    return NextResponse.json({ erro: mensagem }, { status })
  }
}
