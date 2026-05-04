-- =========================================================
-- RESET (CUIDADO: apaga tudo se já existir)
-- =========================================================

drop table if exists mensagens_agendadas cascade;
drop table if exists mensagens cascade;
drop table if exists historico_aluno cascade;
drop table if exists ocorrencias cascade;
drop table if exists frequencia_resumo cascade;
drop table if exists frequencia_diaria cascade;
drop table if exists avaliacoes cascade;
drop table if exists alunos cascade;
drop table if exists professor_turma_disciplina cascade;
drop table if exists professores cascade;
drop table if exists disciplinas cascade;
drop table if exists turmas cascade;
drop table if exists usuarios cascade;
drop table if exists automacoes cascade;
drop table if exists eventos cascade;

drop type if exists status_aluno cascade;
drop type if exists status_usuario cascade;
drop type if exists perfil_usuario cascade;
drop type if exists turno_turma cascade;
drop type if exists status_ocorrencia cascade;

-- =========================================================
-- EXTENSÃO
-- =========================================================

create extension if not exists "uuid-ossp";

-- =========================================================
-- ENUMS
-- =========================================================

create type status_aluno as enum ('ativo', 'inativo', 'transferido');
create type status_usuario as enum ('ativo', 'inativo', 'pendente');
create type perfil_usuario as enum ('admin', 'coordenador', 'professor', 'secretaria');
create type turno_turma as enum ('manha', 'tarde', 'noite', 'integral');
create type status_ocorrencia as enum ('aberta', 'resolvida');

-- =========================================================
-- USUÁRIOS
-- =========================================================

create table usuarios (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  email text unique not null,
  perfil perfil_usuario default 'secretaria',
  status status_usuario default 'pendente',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =========================================================
-- TURMAS
-- =========================================================

create table turmas (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  serie text not null,
  turno turno_turma default 'manha',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =========================================================
-- DISCIPLINAS
-- =========================================================

create table disciplinas (
  id uuid primary key default uuid_generate_v4(),
  nome text not null unique
);

-- =========================================================
-- PROFESSORES
-- =========================================================

create table professores (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  email text,
  telefone text,
  status text default 'ativo',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =========================================================
-- RELAÇÃO PROFESSOR / TURMA / DISCIPLINA
-- =========================================================

create table professor_turma_disciplina (
  id uuid primary key default uuid_generate_v4(),
  professor_id uuid references professores(id) on delete cascade,
  turma_id uuid references turmas(id) on delete cascade,
  disciplina_id uuid references disciplinas(id) on delete cascade
);

-- =========================================================
-- ALUNOS
-- =========================================================

create table alunos (
  id uuid primary key default uuid_generate_v4(),
  matricula text unique not null,
  nome text not null,
  data_nascimento date,
  turma_id uuid references turmas(id) on delete set null,
  responsavel text,
  telefone text,
  email text,
  status status_aluno default 'ativo',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =========================================================
-- AVALIAÇÕES
-- =========================================================

create table avaliacoes (
  id uuid primary key default uuid_generate_v4(),
  aluno_id uuid references alunos(id) on delete cascade,
  disciplina_id uuid references disciplinas(id),
  tipo text,
  valor numeric not null,
  data date default now(),
  created_at timestamptz default now()
);

-- =========================================================
-- FREQUÊNCIA DIÁRIA
-- =========================================================

create table frequencia_diaria (
  id uuid primary key default uuid_generate_v4(),
  aluno_id uuid references alunos(id) on delete cascade,
  data date not null,
  presente boolean not null,
  created_at timestamptz default now(),
  unique(aluno_id, data)
);

-- =========================================================
-- FREQUÊNCIA RESUMO
-- =========================================================

create table frequencia_resumo (
  id uuid primary key default uuid_generate_v4(),
  aluno_id uuid references alunos(id) on delete cascade,
  mes int,
  ano int,
  percentual numeric,
  updated_at timestamptz default now(),
  unique(aluno_id, mes, ano)
);

-- =========================================================
-- OCORRÊNCIAS
-- =========================================================

create table ocorrencias (
  id uuid primary key default uuid_generate_v4(),
  aluno_id uuid references alunos(id) on delete cascade,
  tipo text,
  descricao text,
  status status_ocorrencia default 'aberta',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =========================================================
-- HISTÓRICO DO ALUNO
-- =========================================================

create table historico_aluno (
  id uuid primary key default uuid_generate_v4(),
  aluno_id uuid references alunos(id) on delete cascade,
  tipo text,
  descricao text,
  created_at timestamptz default now()
);

-- =========================================================
-- MENSAGENS
-- =========================================================

create table mensagens (
  id uuid primary key default uuid_generate_v4(),
  aluno_id uuid references alunos(id) on delete set null,
  telefone text,
  conteudo text,
  status text,
  created_at timestamptz default now()
);

-- =========================================================
-- MENSAGENS AGENDADAS
-- =========================================================

create table mensagens_agendadas (
  id uuid primary key default uuid_generate_v4(),
  aluno_id uuid references alunos(id),
  conteudo text,
  enviar_em timestamptz,
  status text default 'pendente'
);

-- =========================================================
-- AUTOMAÇÕES
-- =========================================================

create table automacoes (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  condicao jsonb not null,
  acao jsonb not null,
  ativo boolean default true,
  created_at timestamptz default now()
);

-- =========================================================
-- EVENTOS
-- =========================================================

create table eventos (
  id uuid primary key default uuid_generate_v4(),
  titulo text not null,
  descricao text,
  data_inicio date,
  tipo text,
  created_at timestamptz default now()
);

-- =========================================================
-- ÍNDICES
-- =========================================================

create index idx_aluno_turma on alunos(turma_id);
create index idx_avaliacoes_aluno on avaliacoes(aluno_id);

create index if not exists idx_freq_aluno on frequencia_diaria(aluno_id);
create index idx_hist_aluno on historico_aluno(aluno_id);

-- =========================================================
-- TRIGGER UPDATED_AT
-- =========================================================

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_usuarios before update on usuarios
for each row execute function set_updated_at();

create trigger trg_alunos before update on alunos
for each row execute function set_updated_at();

create trigger trg_professores before update on professores
for each row execute function set_updated_at();

create trigger trg_turmas before update on turmas
for each row execute function set_updated_at();

create trigger trg_ocorrencias before update on ocorrencias
for each row execute function set_updated_at();

-- =========================================================
-- FIM
-- =========================================================