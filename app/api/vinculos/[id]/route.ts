import { NextRequest, NextResponse } from 'next/server'
import { vinculoService } from '@/lib/services/vinculoService'

type RouteContext = { params: Promise<{ id: string }> }

/**
 * DELETE /api/vinculos/[id]
 * Deletar vínculo específico
 */
export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params
    await vinculoService.delete(id)
    return NextResponse.json({ mensagem: 'Vínculo deletado com sucesso' })
  } catch (error) {
    console.error('DELETE /api/vinculos/[id]:', error)
    const mensagem = error instanceof Error ? error.message : 'Erro ao deletar vínculo'
    return NextResponse.json({ erro: mensagem }, { status: 500 })
  }
}
