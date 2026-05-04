import { NextRequest, NextResponse } from 'next/server'
import { disciplinaService } from '@/lib/services/disciplinaService'

type RouteContext = { params: Promise<{ id: string }> }

/**
 * GET /api/disciplinas/[id]
 * Buscar disciplina específica
 */
export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params
    const disciplina = await disciplinaService.getById(id)
    return NextResponse.json(disciplina)
  } catch (error) {
    console.error('GET /api/disciplinas/[id]:', error)
    const mensagem = error instanceof Error ? error.message : 'Disciplina não encontrada'
    return NextResponse.json({ erro: mensagem }, { status: 404 })
  }
}

/**
 * PUT /api/disciplinas/[id]
 * Atualizar disciplina
 * Body: { nome: string }
 */
export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params
    const body = await request.json()
    const { nome } = body

    if (!nome) {
      return NextResponse.json({ erro: 'Nome é obrigatório' }, { status: 400 })
    }

    const atualizada = await disciplinaService.update(id, nome)
    return NextResponse.json(atualizada)
  } catch (error) {
    console.error('PUT /api/disciplinas/[id]:', error)
    const mensagem = error instanceof Error ? error.message : 'Erro ao atualizar disciplina'
    const status = mensagem.includes('não encontrada') ? 404 : mensagem.includes('já existe') ? 409 : 500
    return NextResponse.json({ erro: mensagem }, { status })
  }
}

/**
 * DELETE /api/disciplinas/[id]
 * Deletar disciplina (falha se há vínculos)
 */
export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params
    await disciplinaService.delete(id)
    return NextResponse.json({ mensagem: 'Disciplina deletada com sucesso' })
  } catch (error) {
    console.error('DELETE /api/disciplinas/[id]:', error)
    const mensagem = error instanceof Error ? error.message : 'Erro ao deletar disciplina'
    const status = mensagem.includes('vínculos') ? 409 : 500
    return NextResponse.json({ erro: mensagem }, { status })
  }
}
