import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

type RouteContext = { params: Promise<{ id: string }> }

/**
 * PUT /api/etapas/[id]
 */
export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params
    const body = await request.json()
    const { nome, ordem, peso } = body

    if (!nome?.trim()) {
      return NextResponse.json({ erro: 'Nome é obrigatório' }, { status: 400 })
    }

    const { data, error } = await (supabase as any)
      .from('etapas')
      .update({ nome: nome.trim(), ordem, peso })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data)
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro ao atualizar etapa'
    return NextResponse.json({ erro: msg }, { status: 500 })
  }
}

/**
 * DELETE /api/etapas/[id]
 */
export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params

    // Verificar se há avaliações vinculadas
    const { count } = await (supabase as any)
      .from('avaliacoes')
      .select('id', { count: 'exact', head: true })
      .eq('etapa_id', id)

    if (count && count > 0) {
      return NextResponse.json(
        { erro: `Não é possível excluir — há ${count} avaliação(ões) nessa etapa` },
        { status: 409 }
      )
    }

    const { error } = await (supabase as any).from('etapas').delete().eq('id', id)
    if (error) throw error

    return NextResponse.json({ mensagem: 'Etapa excluída' })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro ao excluir etapa'
    return NextResponse.json({ erro: msg }, { status: 500 })
  }
}
