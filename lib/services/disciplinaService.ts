/**
 * Serviço compartilhado para operações com Disciplinas
 * Encapsula lógica de negócio e validações
 */

import { supabase } from '@/lib/supabase'
import type { Disciplina } from '@/lib/database.types'

export const disciplinaService = {
  /**
   * Buscar todas as disciplinas
   */
  async getAll(options?: { orderBy?: 'nome' | 'created_at'; ascending?: boolean }) {
    const query = (supabase as any).from('disciplinas').select('*')

    if (options?.orderBy === 'nome') {
      query.order('nome', { ascending: options.ascending !== false })
    }

    const { data, error } = await query
    if (error) throw error
    return data as Disciplina[]
  },

  /**
   * Buscar disciplina por ID
   */
  async getById(id: string) {
    const { data, error } = await (supabase as any)
      .from('disciplinas')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data as Disciplina
  },

  /**
   * Buscar disciplina por nome (unique check)
   */
  async getByNome(nome: string) {
    const { data, error } = await (supabase as any)
      .from('disciplinas')
      .select('*')
      .eq('nome', nome.trim())
      .maybeSingle()

    if (error) throw error
    return data as Disciplina | null
  },

  /**
   * Criar nova disciplina
   * @throws Se nome já existe ou falha validação
   */
  async create(nome: string) {
    const nomeTrimmed = nome.trim()

    // Validar
    if (!nomeTrimmed || nomeTrimmed.length < 2) {
      throw new Error('Nome da disciplina deve ter pelo menos 2 caracteres')
    }

    if (nomeTrimmed.length > 100) {
      throw new Error('Nome da disciplina não pode exceder 100 caracteres')
    }

    // Verificar duplicação
    const existente = await this.getByNome(nomeTrimmed)
    if (existente) {
      throw new Error(`Disciplina "${nomeTrimmed}" já existe`)
    }

    const { data, error } = await (supabase as any)
      .from('disciplinas')
      .insert({ nome: nomeTrimmed })
      .select()
      .single()

    if (error) throw error
    return data as Disciplina
  },

  /**
   * Atualizar disciplina
   */
  async update(id: string, nome: string) {
    const nomeTrimmed = nome.trim()

    // Validar
    if (!nomeTrimmed || nomeTrimmed.length < 2) {
      throw new Error('Nome da disciplina deve ter pelo menos 2 caracteres')
    }

    if (nomeTrimmed.length > 100) {
      throw new Error('Nome da disciplina não pode exceder 100 caracteres')
    }

    // Verificar se novo nome já existe (em outro registro)
    const existente = await (supabase as any)
      .from('disciplinas')
      .select('id')
      .eq('nome', nomeTrimmed)
      .neq('id', id)
      .maybeSingle()

    if (existente.data) {
      throw new Error(`Disciplina "${nomeTrimmed}" já existe`)
    }

    const { data, error } = await (supabase as any)
      .from('disciplinas')
      .update({ nome: nomeTrimmed })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Disciplina
  },

  /**
   * Deletar disciplina
   * Lança erro se há vínculos ativos (professor_turma_disciplina)
   */
  async delete(id: string) {
    // Verificar se há vínculos
    const { count } = await (supabase as any)
      .from('professor_turma_disciplina')
      .select('id', { count: 'exact', head: true })
      .eq('disciplina_id', id)

    if (count && count > 0) {
      throw new Error(
        'Não é possível deletar disciplina com vínculos ativos. Remova os vínculos primeiro.'
      )
    }

    const { error } = await (supabase as any)
      .from('disciplinas')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  /**
   * Buscar disciplinas de um professor em uma turma específica
   */
  async getDisciplinasByProfessorTurma(professorId: string, turmaId: string) {
    const { data, error } = await (supabase as any)
      .from('professor_turma_disciplina')
      .select('disciplinas(*)')
      .eq('professor_id', professorId)
      .eq('turma_id', turmaId)

    if (error) throw error

    return data?.map((row: any) => row.disciplinas).filter(Boolean) as Disciplina[]
  },

  /**
   * Buscar todas as disciplinas de uma turma (com professores)
   */
  async getDisciplinasTurmaComProfessores(turmaId: string) {
    const { data, error } = await (supabase as any)
      .from('professor_turma_disciplina')
      .select('disciplinas(*), professores(id, nome)')
      .eq('turma_id', turmaId)

    if (error) throw error

    // Agrupar disciplinas únicas com seus professores
    const disciplinasMap = new Map<string, any>()

    data?.forEach((row: any) => {
      if (row.disciplinas) {
        const disciplina = row.disciplinas
        if (!disciplinasMap.has(disciplina.id)) {
          disciplinasMap.set(disciplina.id, {
            ...disciplina,
            professores: [],
          })
        }
        if (row.professores) {
          disciplinasMap.get(disciplina.id).professores.push(row.professores)
        }
      }
    })

    return Array.from(disciplinasMap.values())
  },
}
