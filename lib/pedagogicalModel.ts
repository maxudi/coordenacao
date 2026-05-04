/**
 * ═════════════════════════════════════════════════════════════════════════
 * MODELO PEDAGÓGICO REFATORADO - ESTRUTURA
 * ═════════════════════════════════════════════════════════════════════════
 *
 * OBJETIVO:
 * Implementar relacionamento correto Professor ↔ Turma ↔ Disciplina
 * mantendo 100% de compatibilidade com código frontend existente.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * TABELAS
 * ─────────────────────────────────────────────────────────────────────────
 *
 * 1. disciplinas
 *    ├─ id (uuid, pk)
 *    └─ nome (text, unique) — ex: "Português", "Matemática"
 *
 * 2. turmas
 *    ├─ id (uuid, pk)
 *    ├─ nome (text)
 *    ├─ serie (text)
 *    ├─ turno (turno_turma enum)
 *    ├─ professor_id (uuid fk→professores) [DEPRECATED - compatibilidade]
 *    └─ timestamps
 *
 * 3. professor_turma_disciplina
 *    ├─ id (uuid, pk)
 *    ├─ professor_id (uuid fk→professores, on delete cascade)
 *    ├─ turma_id (uuid fk→turmas, on delete cascade)
 *    ├─ disciplina_id (uuid fk→disciplinas, on delete cascade)
 *    └─ unique constraint: (professor_id, turma_id, disciplina_id)
 *
 * ─────────────────────────────────────────────────────────────────────────
 * RELACIONAMENTOS
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Professor → [professor_turma_disciplina] ← Turma
 *                         ↓
 *                    Disciplina
 *
 * Um professor pode ter múltiplas disciplinas em múltiplas turmas.
 * Uma turma pode ter múltiplos professores em múltiplas disciplinas.
 * Uma disciplina pode ser lecionada por múltiplos professores em múltiplas turmas.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * ÍNDICES DE PERFORMANCE
 * ─────────────────────────────────────────────────────────────────────────
 *
 * idx_ptd_professor   — Query: "Qual professor leciona em qual turma?"
 * idx_ptd_turma       — Query: "Quem leciona nesta turma?"
 * idx_ptd_disciplina  — Query: "Onde a disciplina X é lecionada?"
 *
 * ─────────────────────────────────────────────────────────────────────────
 * SERVIÇOS (lib/services)
 * ─────────────────────────────────────────────────────────────────────────
 *
 * disciplinaService.ts
 * ├─ getAll() — Lista todas disciplinas ordenadas
 * ├─ getById(id) — Busca single
 * ├─ getByNome(nome) — Unique check
 * ├─ create(nome) — Validação + inserção
 * ├─ update(id, nome) — Validação + atualização
 * ├─ delete(id) — Verificação de vínculos antes de deletar
 * ├─ getDisciplinasByProfessorTurma(prof, turma) — Disciplinas professor em turma
 * └─ getDisciplinasTurmaComProfessores(turma) — Disciplinas turma com professores
 *
 * vinculoService.ts
 * ├─ getAll(filtros) — Buscar vínculos com expansão de dados
 * ├─ getById(id) — Single vínculo com dados expandidos
 * ├─ getByProfessor(id) — Todos vínculos professor
 * ├─ getByTurma(id) — Todos vínculos turma
 * ├─ getByDisciplina(id) — Todos vínculos disciplina
 * ├─ create(prof, turma, disc) — Validação de duplicação + inserção
 * ├─ delete(id) — Deletar vínculo
 * ├─ deleteByProfessor(id) — Cleanup ao remover professor
 * ├─ deleteByTurma(id) — Cleanup ao remover turma
 * ├─ getProfessoresTurma(turma) — Array de professores únicos
 * └─ getProfessorResponsavelTurma(turma) — Primeiro professor [COMPAT]
 *
 * ─────────────────────────────────────────────────────────────────────────
 * API REST
 * ─────────────────────────────────────────────────────────────────────────
 *
 * DISCIPLINAS:
 *
 * GET    /api/disciplinas
 *        Query: ?orderBy=nome&ascending=true
 *        Response: Disciplina[]
 *
 * POST   /api/disciplinas
 *        Body: { nome: string }
 *        Response: Disciplina (status 201)
 *        Errors: 400 (validação), 409 (duplicação)
 *
 * GET    /api/disciplinas/[id]
 *        Response: Disciplina
 *        Errors: 404 (não encontrada)
 *
 * PUT    /api/disciplinas/[id]
 *        Body: { nome: string }
 *        Response: Disciplina
 *        Errors: 400 (validação), 404 (não encontrada), 409 (duplicação)
 *
 * DELETE /api/disciplinas/[id]
 *        Response: { mensagem: string }
 *        Errors: 409 (tem vínculos), 500 (erro)
 *
 * VÍNCULOS:
 *
 * GET    /api/vinculos
 *        Query: ?professorId=X&turmaId=Y&disciplinaId=Z (todos opcionais)
 *        Response: VinculoComDados[]
 *        Return Fields: id, professor_id, turma_id, disciplina_id,
 *                      professor_nome, turma_nome, disciplina_nome
 *
 * POST   /api/vinculos
 *        Body: { professorId: string, turmaId: string, disciplinaId: string }
 *        Response: ProfessorTurmaDisciplina (status 201)
 *        Errors: 400 (missing fields), 404 (entidade não existe),
 *               409 (vínculo já existe)
 *
 * DELETE /api/vinculos/[id]
 *        Response: { mensagem: string }
 *        Errors: 500 (erro)
 *
 * ─────────────────────────────────────────────────────────────────────────
 * COMPATIBILIDADE
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Campo DEPRECATED: turmas.professor_id
 * ├─ Não será deletado — apenas ignorado em queries novas
 * ├─ Servirá como fallback para código legado
 * └─ Nova regra: use professor_turma_disciplina no novo código
 *
 * Função helper: getTurmaComProfessorCompat(turmaId)
 * └─ Retorna primeiro professor do array professor_turma_disciplina
 *    para compatibilidade com frontend que espera turma.professor
 *
 * ─────────────────────────────────────────────────────────────────────────
 * FLUXO DE USO (EXEMPLO)
 * ─────────────────────────────────────────────────────────────────────────
 *
 * 1. CRIAR DISCIPLINA
 *    POST /api/disciplinas
 *    { "nome": "Português" }
 *    → Response: { id: "uuid-1", nome: "Português" }
 *
 * 2. VINCULAR PROFESSOR À TURMA EM DISCIPLINA
 *    POST /api/vinculos
 *    { professorId: "prof-1", turmaId: "turma-1", disciplinaId: "uuid-1" }
 *    → Response: { id: "uuid-2", professor_id: "prof-1", ... }
 *
 * 3. LISTAR DISCIPLINAS DE UMA TURMA
 *    GET /api/vinculos?turmaId=turma-1
 *    → Response: [
 *      { ..., professor_nome: "João", disciplina_nome: "Português" },
 *      { ..., professor_nome: "Maria", disciplina_nome: "Matemática" }
 *    ]
 *
 * 4. CRIAR AVALIAÇÃO (com disciplina_id correta)
 *    POST /api/avaliacoes/importar
 *    { aluno_id, disciplina_id, valor, data, ... }
 *    ✓ Agora disciplina_id é obrigatória e referencia tabela real
 *
 * ─────────────────────────────────────────────────────────────────────────
 * MUDANÇAS NECESSÁRIAS NO FRONTEND (PróXIMAS FASES)
 * ─────────────────────────────────────────────────────────────────────────
 *
 * ❌ REMOVIDO:    Usar turma.professor_id diretamente
 * ✓ NOVO:        Usar vinculoService.getProfessoresTurma(turmaId)
 *
 * ❌ REMOVIDO:    Hardcoded professor names em turmas
 * ✓ NOVO:        Query em professor_turma_disciplina com join
 *
 * ❌ REMOVIDO:    Avaliações sem disciplina_id
 * ✓ NOVO:        Avaliações com disciplina_id obrigatório
 *
 * ─────────────────────────────────────────────────────────────────────────
 * VALIDAÇÕES GARANTIDAS
 * ─────────────────────────────────────────────────────────────────────────
 *
 * ✓ Não há duplicação de (professor, turma, disciplina)
 * ✓ Não há orfãos: todosFK referem entidades existentes
 * ✓ Cascade delete: remover turma → limpar vínculos automaticamente
 * ✓ Unique disciplines: mesmo nome não pode aparecer 2x
 * ✓ Disciplinas com uso não podem ser deletadas
 *
 * ─────────────────────────────────────────────────────────────────────────
 * STATUS ATUAL (v1.0)
 * ─────────────────────────────────────────────────────────────────────────
 *
 * ✓ Serviços criados e testados
 * ✓ APIs REST implementadas com validação
 * ✓ Schema atualizado com unique constraint
 * ✓ Índices adicionados para performance
 * ✓ Funções de compatibilidade criadas
 * ⏳ Próximo: UI para gerenciar disciplinas e vínculos
 * ⏳ Próximo: Migração gradual do frontend
 * ⏳ Próximo: Seed de dados para teste
 *
 * ═════════════════════════════════════════════════════════════════════════
 */

export const PEDAGOGICAL_MODEL_V1 = 'Implemented' as const
