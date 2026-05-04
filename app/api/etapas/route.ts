import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * GET /api/etapas
 * Lista etapas ordenadas
 */
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('etapas')
      .select('*')
      .order('ordem')

    if (error) throw error
    return NextResponse.json(data ?? [])
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro ao buscar etapas'
    return NextResponse.json({ erro: msg }, { status: 500 })
  }
}

/**
 * POST /api/etapas
 * Criar nova etapa
 * Body: { nome, ordem, peso }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nome, ordem, peso } = body

    if (!nome?.trim()) {
      return NextResponse.json({ erro: 'Nome é obrigatório' }, { status: 400 })
    }
    if (typeof peso !== 'number' || peso <= 0 || peso > 100) {
      return NextResponse.json({ erro: 'Peso deve ser entre 1 e 100' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('etapas')
      .insert({ nome: nome.trim(), ordem: ordem ?? 1, peso })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro ao criar etapa'
    return NextResponse.json({ erro: msg }, { status: 500 })
  }
}
