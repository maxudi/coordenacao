/**
 * Serviço compartilhado para operações com Vínculos
 * Gerencia relação Professor ↔ Turma ↔ Disciplina
 */

import { supabase } from '@/lib/supabase'
import type { ProfessorTurmaDisciplina } from '@/lib/database.types'

export interface VinculoComDados extends ProfessorTurmaDisciplina {
  professor_nome?: string
  turma_nome?: string
  disciplina_nome?: string
}

export const vinculoService = {
  /**
   * Buscar todos os vínculos com dados expandidos
   */
  async getAll(filtros?: { professorId?: string; turmaId?: string; disciplinaId?: string }) {
    let query = (supabase as any).from('professor_turma_disciplina').select(`
      id,
      professor_id,
      turma_id,
      disciplina_id,
      professores(nome),
      turmas(nome),
      disciplinas(nome)
    `)

    if (filtros?.professorId) query = query.eq('professor_id', filtros.professorId)
    if (filtros?.turmaId) query = query.eq('turma_id', filtros.turmaId)
    if (filtros?.disciplinaId) query = query.eq('disciplina_id', filtros.disciplinaId)

    const { data, error } = await query

    if (error) throw error

    return (data ?? []).map((row: any) => ({
      id: row.id,
      professor_id: row.professor_id,
      turma_id: row.turma_id,
      disciplina_id: row.disciplina_id,
      professor_nome: row.professores?.nome,
      turma_nome: row.turmas?.nome,
      disciplina_nome: row.disciplinas?.nome,
    })) as VinculoComDados[]
  },

  /**
   * Buscar vínculo por ID
   */
  async getById(id: string) {
    const { data, error } = await (supabase as any)
      .from('professor_turma_disciplina')
      .select(`
        id,
        professor_id,
        turma_id,
        disciplina_id,
        professores(nome),
        turmas(nome),
        disciplinas(nome)
      `)
      .eq('id', id)
      .single()

    if (error) throw error

    const row = data as any
    return {
      id: row.id,
      professor_id: row.professor_id,
      turma_id: row.turma_id,
      disciplina_id: row.disciplina_id,
      professor_nome: row.professores?.nome,
      turma_nome: row.turmas?.nome,
      disciplina_nome: row.disciplinas?.nome,
    } as VinculoComDados
  },

  /**
   * Buscar vínculos de um professor
   */
  async getByProfessor(professorId: string) {
    return this.getAll({ professorId })
  },

  /**
   * Buscar vínculos de uma turma
   */
  async getByTurma(turmaId: string) {
    return this.getAll({ turmaId })
  },

  /**
   * Buscar vínculos de uma disciplina
   */
  async getByDisciplina(disciplinaId: string) {
    return this.getAll({ disciplinaId })
  },

  /**
   * Criar novo vínculo
   * @throws Se vínculo já existe ou entidades não existem
   */
  async create(professorId: string, turmaId: string, disciplinaId: string) {
    // Validar entrada
    if (!professorId || !turmaId || !disciplinaId) {
      throw new Error('Professor, turma e disciplina são obrigatórios')
    }

    // Verificar se entidades existem
    const [prof, turma, disc] = await Promise.all([
      (supabase as any).from('professores').select('id').eq('id', professorId).maybeSingle(),
      (supabase as any).from('turmas').select('id').eq('id', turmaId).maybeSingle(),
      (supabase as any).from('disciplinas').select('id').eq('id', disciplinaId).maybeSingle(),
    ])

    if (!prof.data) throw new Error('Professor não encontrado')
    if (!turma.data) throw new Error('Turma não encontrada')
    if (!disc.data) throw new Error('Disciplina não encontrada')

    // Verificar duplicação
    const existente = await (supabase as any)
      .from('professor_turma_disciplina')
      .select('id')
      .eq('professor_id', professorId)
      .eq('turma_id', turmaId)
      .eq('disciplina_id', disciplinaId)
      .maybeSingle()

    if (existente.data) {
      throw new Error('Este vínculo já existe')
    }

    const { data, error } = await (supabase as any)
      .from('professor_turma_disciplina')
      .insert({
        professor_id: professorId,
        turma_id: turmaId,
        disciplina_id: disciplinaId,
      })
      .select()
      .single()

    if (error) throw error
    return data as ProfessorTurmaDisciplina
  },

  /**
   * Deletar vínculo
   */
  async delete(id: string) {
    const { error } = await (supabase as any)
      .from('professor_turma_disciplina')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  /**
   * Deletar todos os vínculos de um professor
   * (útil para cleanup ao remover professor)
   */
  async deleteByProfessor(professorId: string) {
    const { error } = await (supabase as any)
      .from('professor_turma_disciplina')
      .delete()
      .eq('professor_id', professorId)

    if (error) throw error
  },

  /**
   * Deletar todos os vínculos de uma turma
   * (útil para cleanup ao remover turma)
   */
  async deleteByTurma(turmaId: string) {
    const { error } = await (supabase as any)
      .from('professor_turma_disciplina')
      .delete()
      .eq('turma_id', turmaId)

    if (error) throw error
  },

  /**
   * Buscar professores de uma turma
   * Compatibilidade: retorna primeiro professor como "responsável"
   */
  async getProfessoresTurma(turmaId: string) {
    const { data, error } = await (supabase as any)
      .from('professor_turma_disciplina')
      .select('professores(id, nome, email)')
      .eq('turma_id', turmaId)

    if (error) throw error

    const professores = [...new Set((data ?? []).map((row: any) => row.professores))].filter(Boolean)
    return professores
  },

  /**
   * Buscar primeiro professor de uma turma como "professor responsável"
   * (compatibilidade com antigo modelo turma.professor_id)
   */
  async getProfessorResponsavelTurma(turmaId: string) {
    const { data, error } = await (supabase as any)
      .from('professor_turma_disciplina')
      .select('professores(id, nome, email)')
      .eq('turma_id', turmaId)
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows

    return data?.professores ?? null
  },
}
