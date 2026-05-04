// Tipos gerados do schema Supabase
// Atualizar após rodar: npx supabase gen types typescript

export type StatusAluno     = 'ativo' | 'inativo' | 'transferido'
export type StatusUsuario   = 'ativo' | 'inativo' | 'pendente'
export type PerfilUsuario   = 'admin' | 'coordenador' | 'professor' | 'secretaria'
export type TurnoTurma      = 'manha' | 'tarde' | 'noite' | 'integral'
export type StatusOcorrencia = 'aberta' | 'resolvida'

// ─── JSONB tipado para automacoes ────────────────────────────────────────────

export interface AutomacaoCondicao {
  gatilho: 'frequencia' | 'nota' | 'data' | 'matricula'
  limiar?: number
  tipo?:   string
  [key: string]: unknown
}

export interface AutomacaoAcao {
  tipo:       'notificacao' | 'mensagem' | 'tarefa'
  descricao?: string
  [key: string]: unknown
}

// ─── ENTIDADES ───────────────────────────────────────────────────────────────

export interface Usuario {
  id:         string
  nome:       string
  email:      string
  perfil:     PerfilUsuario
  status:     StatusUsuario
  created_at: string
  updated_at: string
}

export interface Turma {
  id:           string
  nome:         string
  serie:        string
  turno:        TurnoTurma
  professor_id: string | null
  created_at:   string
  updated_at:   string
}

export interface Disciplina {
  id:          string
  nome:        string
  nota_maxima: number
}

export interface Professor {
  id:         string
  nome:       string
  email:      string | null
  telefone:   string | null
  status:     string
  created_at: string
  updated_at: string
}

export interface ProfessorTurmaDisciplina {
  id:            string
  professor_id:  string | null
  turma_id:      string | null
  disciplina_id: string | null
}

export interface Aluno {
  id:              string
  matricula:       string
  nome:            string
  data_nascimento: string | null
  turma_id:        string | null
  responsavel:     string | null
  telefone:        string | null
  email:           string | null
  status:          StatusAluno
  created_at:      string
  updated_at:      string
}

export interface Etapa {
  id:    string
  nome:  string
  ordem: number
  peso:  number
}

export interface Avaliacao {
  id:            string
  aluno_id:      string | null
  disciplina_id: string | null
  etapa_id:      string | null
  professor_id:  string | null
  turma_id:      string | null
  tipo:          string | null
  valor:         number
  valor_maximo:  number
  data:          string | null
  created_at:    string
}

export interface FrequenciaDiaria {
  id:         string
  aluno_id:   string | null
  data:       string
  presente:   boolean
  created_at: string
}

export interface FrequenciaResumo {
  id:         string
  aluno_id:   string | null
  mes:        number | null
  ano:        number | null
  percentual: number | null
  updated_at: string
}

export interface Ocorrencia {
  id:         string
  aluno_id:   string | null
  tipo:       string | null
  descricao:  string | null
  status:     StatusOcorrencia
  created_at: string
  updated_at: string
}

export interface HistoricoAluno {
  id:         string
  aluno_id:   string | null
  tipo:       string | null
  descricao:  string | null
  created_at: string
}

export interface Mensagem {
  id:         string
  aluno_id:   string | null
  telefone:   string | null
  conteudo:   string | null
  status:     string | null
  created_at: string
}

export interface MensagemAgendada {
  id:        string
  aluno_id:  string | null
  conteudo:  string | null
  enviar_em: string | null
  status:    string
}

export interface Automacao {
  id:         string
  nome:       string
  condicao:   AutomacaoCondicao
  acao:       AutomacaoAcao
  ativo:      boolean
  created_at: string
}

export interface Evento {
  id:          string
  titulo:      string
  descricao:   string | null
  data_inicio: string | null
  tipo:        string | null
  created_at:  string
}

// ─── DATABASE TYPE MAP ───────────────────────────────────────────────────────

export interface Database {
  public: {
    Tables: {
      usuarios:                  { Row: Usuario;               Insert: Omit<Usuario, 'id'|'created_at'|'updated_at'>;               Update: Partial<Omit<Usuario, 'id'|'created_at'>> }
      turmas:                    { Row: Turma;                 Insert: Omit<Turma, 'id'|'created_at'|'updated_at'>;                 Update: Partial<Omit<Turma, 'id'|'created_at'>> }
      disciplinas:               { Row: Disciplina;            Insert: Omit<Disciplina, 'id'>;                                      Update: Partial<Omit<Disciplina, 'id'>> }
      professores:               { Row: Professor;             Insert: Omit<Professor, 'id'|'created_at'|'updated_at'>;             Update: Partial<Omit<Professor, 'id'|'created_at'>> }
      professor_turma_disciplina:{ Row: ProfessorTurmaDisciplina; Insert: Omit<ProfessorTurmaDisciplina, 'id'>; Update: Partial<Omit<ProfessorTurmaDisciplina, 'id'>> }
      alunos:                    { Row: Aluno;                 Insert: Omit<Aluno, 'id'|'created_at'|'updated_at'>;                 Update: Partial<Omit<Aluno, 'id'|'created_at'>> }
      avaliacoes:                { Row: Avaliacao;             Insert: Omit<Avaliacao, 'id'|'created_at'>;                          Update: Partial<Omit<Avaliacao, 'id'|'created_at'>> }
      frequencia_diaria:         { Row: FrequenciaDiaria;      Insert: Omit<FrequenciaDiaria, 'id'|'created_at'>;                   Update: Partial<Omit<FrequenciaDiaria, 'id'|'created_at'>> }
      frequencia_resumo:         { Row: FrequenciaResumo;      Insert: Omit<FrequenciaResumo, 'id'>;                                Update: Partial<Omit<FrequenciaResumo, 'id'>> }
      ocorrencias:               { Row: Ocorrencia;            Insert: Omit<Ocorrencia, 'id'|'created_at'|'updated_at'>;            Update: Partial<Omit<Ocorrencia, 'id'|'created_at'>> }
      historico_aluno:           { Row: HistoricoAluno;        Insert: Omit<HistoricoAluno, 'id'|'created_at'>;                     Update: Partial<Omit<HistoricoAluno, 'id'|'created_at'>> }
      mensagens:                 { Row: Mensagem;              Insert: Omit<Mensagem, 'id'|'created_at'>;                           Update: Partial<Omit<Mensagem, 'id'|'created_at'>> }
      mensagens_agendadas:       { Row: MensagemAgendada;      Insert: Omit<MensagemAgendada, 'id'>;                                Update: Partial<Omit<MensagemAgendada, 'id'>> }
      automacoes:                { Row: Automacao;             Insert: Omit<Automacao, 'id'|'created_at'>;                          Update: Partial<Omit<Automacao, 'id'|'created_at'>> }
      eventos:                   { Row: Evento;                Insert: Omit<Evento, 'id'|'created_at'>;                             Update: Partial<Omit<Evento, 'id'|'created_at'>> }
    }
  }
}
