/**
 * Utilitários de compatibilidade para transição de modelo pedagógico
 * Mantém compatibilidade com frontend antigo enquanto migra para novo modelo
 */

import { vinculoService } from '@/lib/services/vinculoService'
import type { Turma } from '@/lib/database.types'

/**
 * Retorna primeiro professor vinculado como "professor responsável"
 * Compatibilidade com antigo modelo: turma.professor_id
 */
export async function getTurmaComProfessorCompat(turmaId: string, turmaData?: any) {
  try {
    // Se já tem professor_id setado, use-o
    if (turmaData?.professor_id) {
      return turmaData
    }

    // Caso contrário, busque primeiro professor dos vínculos
    const prof = await vinculoService.getProfessorResponsavelTurma(turmaId)

    return {
      ...turmaData,
      professor: prof, // Campo novo para compatibilidade
    }
  } catch (error) {
    console.error('Erro ao buscar compatibilidade professor turma:', error)
    return turmaData
  }
}

/**
 * Enriquece array de turmas com professor responsável (compatibilidade)
 */
export async function enrichTurmasComProfessores(turmas: any[]) {
  const turmasComProfs = await Promise.all(
    turmas.map(async (turma) => {
      return getTurmaComProfessorCompat(turma.id, turma)
    })
  )
  return turmasComProfs
}

/**
 * Retorna disciplinas vinculadas a uma turma com seus professores
 */
export async function getTurmaDisciplinas(turmaId: string) {
  try {
    const { disciplinaService } = await import('@/lib/services/disciplinaService')
    return disciplinaService.getDisciplinasTurmaComProfessores(turmaId)
  } catch (error) {
    console.error('Erro ao buscar disciplinas turma:', error)
    return []
  }
}

/**
 * Retorna professores de uma turma
 */
export async function getTurmaProfessores(turmaId: string) {
  try {
    return await vinculoService.getProfessoresTurma(turmaId)
  } catch (error) {
    console.error('Erro ao buscar professores turma:', error)
    return []
  }
}
