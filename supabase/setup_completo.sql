-- =============================================================================
-- SETUP COMPLETO -- Execute no Supabase > SQL Editor
-- Contém schema + RLS + triggers de automação
-- =============================================================================

-- =========================================================
-- RESET (CUIDADO: apaga tudo se já existir)
-- =========================================================

drop table if exists mensagens_agendadas cascade;
drop table if exists etapas cascade;
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

drop function if exists set_updated_at cascade;
drop function if exists fn_auto_ocorrencia_frequencia cascade;
drop function if exists fn_auto_ocorrencia_nota cascade;

-- =========================================================
-- EXTENSAO
-- =========================================================

create extension if not exists "uuid-ossp";

-- =========================================================
-- ENUMS
-- =========================================================

create type status_aluno     as enum ('ativo', 'inativo', 'transferido');
create type status_usuario   as enum ('ativo', 'inativo', 'pendente');
create type perfil_usuario   as enum ('admin', 'coordenador', 'professor', 'secretaria');
create type turno_turma      as enum ('manha', 'tarde', 'noite', 'integral');
create type status_ocorrencia as enum ('aberta', 'resolvida');

-- =========================================================
-- USUÁRIOS
-- =========================================================

create table usuarios (
  id         uuid primary key default uuid_generate_v4(),
  nome       text not null,
  email      text unique not null,
  perfil     perfil_usuario default 'secretaria',
  status     status_usuario default 'pendente',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =========================================================
-- ETAPAS (bimestres/trimestres configuráveis)
-- =========================================================

create table etapas (
  id     uuid primary key default uuid_generate_v4(),
  nome   text not null,
  ordem  int  not null default 1,
  peso   numeric not null default 25  -- percentual do total (soma deve ser 100)
);

-- =========================================================
-- DISCIPLINAS
-- =========================================================

create table disciplinas (
  id           uuid primary key default uuid_generate_v4(),
  nome         text not null unique,
  nota_maxima  numeric not null default 100  -- valor máximo padrão por disciplina
);

-- =========================================================
-- PROFESSORES (antes de TURMAS!)
-- =========================================================

create table professores (
  id         uuid primary key default uuid_generate_v4(),
  nome       text not null,
  email      text,
  telefone   text,
  status     text default 'ativo',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =========================================================
-- TURMAS
-- =========================================================

create table turmas (
  id            uuid primary key default uuid_generate_v4(),
  nome          text not null,
  serie         text not null,
  turno         turno_turma default 'manha',
  professor_id  uuid references professores(id) on delete set null,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- =========================================================
-- RELACAO PROFESSOR / TURMA / DISCIPLINA
-- =========================================================

create table professor_turma_disciplina (
  id            uuid primary key default uuid_generate_v4(),
  professor_id  uuid references professores(id) on delete cascade,
  turma_id      uuid references turmas(id) on delete cascade,
  disciplina_id uuid references disciplinas(id) on delete cascade,
  unique(professor_id, turma_id, disciplina_id)
);

-- =========================================================
-- ALUNOS
-- =========================================================

create table alunos (
  id              uuid primary key default uuid_generate_v4(),
  matricula       text unique not null,
  nome            text not null,
  data_nascimento date,
  turma_id        uuid references turmas(id) on delete set null,
  responsavel     text,
  telefone        text,
  email           text,
  status          status_aluno default 'ativo',
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- =========================================================
-- AVALIACOES
-- =========================================================

create table avaliacoes (
  id            uuid primary key default uuid_generate_v4(),
  aluno_id      uuid references alunos(id) on delete cascade,
  disciplina_id uuid references disciplinas(id),
  etapa_id      uuid references etapas(id) on delete set null,
  professor_id  uuid references professores(id) on delete set null,
  turma_id      uuid references turmas(id) on delete set null,
  tipo          text,
  valor         numeric not null,
  valor_maximo  numeric not null default 10,  -- permite notas em escalas diferentes
  data          date default now(),
  created_at    timestamptz default now()
);

-- =========================================================
-- FREQUENCIA DIARIA
-- =========================================================

create table frequencia_diaria (
  id         uuid primary key default uuid_generate_v4(),
  aluno_id   uuid references alunos(id) on delete cascade,
  data       date not null,
  presente   boolean not null,
  created_at timestamptz default now(),
  unique(aluno_id, data)
);

-- =========================================================
-- FREQUENCIA RESUMO
-- =========================================================

create table frequencia_resumo (
  id         uuid primary key default uuid_generate_v4(),
  aluno_id   uuid references alunos(id) on delete cascade,
  mes        int,
  ano        int,
  percentual numeric,
  updated_at timestamptz default now(),
  unique(aluno_id, mes, ano)
);

-- =========================================================
-- OCORRENCIAS
-- =========================================================

create table ocorrencias (
  id         uuid primary key default uuid_generate_v4(),
  aluno_id   uuid references alunos(id) on delete cascade,
  tipo       text,
  descricao  text,
  status     status_ocorrencia default 'aberta',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =========================================================
-- HISTORICO DO ALUNO
-- =========================================================

create table historico_aluno (
  id         uuid primary key default uuid_generate_v4(),
  aluno_id   uuid references alunos(id) on delete cascade,
  tipo       text,
  descricao  text,
  created_at timestamptz default now()
);

-- =========================================================
-- MENSAGENS
-- =========================================================

create table mensagens (
  id         uuid primary key default uuid_generate_v4(),
  aluno_id   uuid references alunos(id) on delete set null,
  telefone   text,
  conteudo   text,
  status     text,
  created_at timestamptz default now()
);

-- =========================================================
-- MENSAGENS AGENDADAS
-- =========================================================

create table mensagens_agendadas (
  id        uuid primary key default uuid_generate_v4(),
  aluno_id  uuid references alunos(id),
  conteudo  text,
  enviar_em timestamptz,
  status    text default 'pendente'
);

-- =========================================================
-- AUTOMACOES
-- =========================================================

create table automacoes (
  id         uuid primary key default uuid_generate_v4(),
  nome       text not null,
  condicao   jsonb not null,
  acao       jsonb not null,
  ativo      boolean default true,
  created_at timestamptz default now()
);

-- =========================================================
-- EVENTOS
-- =========================================================

create table eventos (
  id          uuid primary key default uuid_generate_v4(),
  titulo      text not null,
  descricao   text,
  data_inicio date,
  tipo        text,
  created_at  timestamptz default now()
);

-- =========================================================
-- ÍNDICES
-- =========================================================

create index if not exists idx_aluno_turma       on alunos(turma_id);
create index if not exists idx_aluno_status      on alunos(status);
create index if not exists idx_avaliacoes_aluno     on avaliacoes(aluno_id);
create index if not exists idx_avaliacoes_etapa     on avaliacoes(etapa_id);
create index if not exists idx_avaliacoes_disciplina on avaliacoes(disciplina_id);
create index if not exists idx_etapas_ordem         on etapas(ordem);
create index if not exists idx_freq_diaria_aluno on frequencia_diaria(aluno_id);
create index if not exists idx_freq_resumo_aluno on frequencia_resumo(aluno_id);
create index if not exists idx_ocorr_aluno       on ocorrencias(aluno_id);
create index if not exists idx_ocorr_status      on ocorrencias(status);
create index if not exists idx_hist_aluno        on historico_aluno(aluno_id);
create index if not exists idx_eventos_data      on eventos(data_inicio);
create index if not exists idx_ptd_professor     on professor_turma_disciplina(professor_id);
create index if not exists idx_ptd_turma         on professor_turma_disciplina(turma_id);
create index if not exists idx_ptd_disciplina    on professor_turma_disciplina(disciplina_id);

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

drop trigger if exists trg_usuarios on usuarios;
drop trigger if exists trg_professores on professores;
drop trigger if exists trg_turmas on turmas;
drop trigger if exists trg_alunos on alunos;
drop trigger if exists trg_ocorrencias on ocorrencias;

create trigger trg_usuarios    before update on usuarios    for each row execute function set_updated_at();
create trigger trg_professores before update on professores for each row execute function set_updated_at();
create trigger trg_turmas      before update on turmas      for each row execute function set_updated_at();
create trigger trg_alunos      before update on alunos      for each row execute function set_updated_at();
create trigger trg_ocorrencias before update on ocorrencias for each row execute function set_updated_at();

-- =========================================================
-- ROW LEVEL SECURITY
-- =========================================================

alter table etapas                enable row level security;
alter table usuarios              enable row level security;
alter table turmas                enable row level security;
alter table disciplinas           enable row level security;
alter table professores           enable row level security;
alter table professor_turma_disciplina enable row level security;
alter table alunos                enable row level security;
alter table avaliacoes            enable row level security;
alter table frequencia_diaria     enable row level security;
alter table frequencia_resumo     enable row level security;
alter table ocorrencias           enable row level security;
alter table historico_aluno       enable row level security;
alter table mensagens             enable row level security;
alter table mensagens_agendadas   enable row level security;
alter table automacoes            enable row level security;
alter table eventos               enable row level security;

-- Politicas anon (dev) -- REMOVER em produção e substituir por auth.uid()
do $$
declare t text;
begin
  foreach t in array array[
    'usuarios','turmas','disciplinas','professores','professor_turma_disciplina',
    'alunos','etapas','avaliacoes','frequencia_diaria','frequencia_resumo',
    'ocorrencias','historico_aluno','mensagens','mensagens_agendadas',
    'automacoes','eventos'
  ]
  loop
    execute format('drop policy if exists %I on %I', 'anon read ' || t, t);
    execute format('drop policy if exists %I on %I', 'anon write ' || t, t);
    execute format('create policy "anon read %s"  on %s for select using (true)', t, t);
    execute format('create policy "anon write %s" on %s for all    using (true) with check (true)', t, t);
  end loop;
end;
$$;

-- =========================================================
-- TRIGGERS DE AUTOMACAO
-- =========================================================

-- Ocorrência automática quando frequência resumo cai abaixo de 75%
create or replace function fn_auto_ocorrencia_frequencia()
returns trigger language plpgsql as $$
declare
  v_aluno_status text;
  v_mes_inicio   timestamptz;
  v_existe       int;
begin
  if (new.percentual is null or new.percentual >= 75) then
    return new;
  end if;

  select status into v_aluno_status from alunos where id = new.aluno_id;
  if v_aluno_status <> 'ativo' then return new; end if;

  v_mes_inicio := date_trunc('month', now());
  select count(*) into v_existe
    from ocorrencias
   where aluno_id = new.aluno_id
     and tipo = 'frequencia'
     and created_at >= v_mes_inicio;

  if v_existe > 0 then return new; end if;

  insert into ocorrencias (aluno_id, tipo, descricao, status)
  values (
    new.aluno_id,
    'frequencia',
    format(
      'Frequência automática: %s%% no mês %s/%s (abaixo de 75%%). Acompanhamento necessário.',
      new.percentual, new.mes, new.ano
    ),
    'aberta'
  );

  return new;
end;
$$;

drop trigger if exists trg_auto_frequencia_baixa on frequencia_resumo;

create trigger trg_auto_frequencia_baixa
  after insert or update of percentual
  on frequencia_resumo
  for each row execute function fn_auto_ocorrencia_frequencia();

-- Ocorrência automática quando avaliação cai abaixo de 5,0
create or replace function fn_auto_ocorrencia_nota()
returns trigger language plpgsql as $$
declare
  v_aluno_status   text;
  v_ano_inicio     timestamptz;
  v_existe         int;
  v_disciplina_nome text;
begin
  if (new.valor is null or new.valor >= 5) then
    return new;
  end if;

  select status into v_aluno_status from alunos where id = new.aluno_id;
  if v_aluno_status <> 'ativo' then return new; end if;

  select nome into v_disciplina_nome from disciplinas where id = new.disciplina_id;
  v_disciplina_nome := coalesce(v_disciplina_nome, 'Disciplina desconhecida');

  v_ano_inicio := date_trunc('year', now());
  select count(*) into v_existe
    from ocorrencias
   where aluno_id = new.aluno_id
     and tipo = 'desempenho'
     and descricao ilike ('%' || v_disciplina_nome || '%')
     and created_at >= v_ano_inicio;

  if v_existe > 0 then return new; end if;

  insert into ocorrencias (aluno_id, tipo, descricao, status)
  values (
    new.aluno_id,
    'desempenho',
    format(
      'Desempenho automático: nota %.1f em %s (abaixo de 5,0). Requer atenção pedagógica.',
      new.valor, v_disciplina_nome
    ),
    'aberta'
  );

  return new;
end;
$$;

drop trigger if exists trg_auto_nota_baixa on avaliacoes;

create trigger trg_auto_nota_baixa
  after insert or update of valor
  on avaliacoes
  for each row execute function fn_auto_ocorrencia_nota();

-- =========================================================
-- VERIFICACAO FINAL
-- =========================================================
select 'tabelas'  as tipo, count(*) as total
  from information_schema.tables
 where table_schema = 'public' and table_type = 'BASE TABLE'
union all
select 'triggers', count(*)
  from information_schema.triggers
 where trigger_schema = 'public';
