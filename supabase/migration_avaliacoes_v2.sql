-- =============================================================================
-- MIGRATION: Avaliações v2 — Modelo acadêmico com etapas
-- Execute no Supabase > SQL Editor se já tiver o banco criado
-- NÃO perde dados existentes
-- =============================================================================

-- =========================================================
-- 1. TABELA ETAPAS (nova)
-- =========================================================

create table if not exists etapas (
  id     uuid primary key default uuid_generate_v4(),
  nome   text not null,
  ordem  int  not null default 1,
  peso   numeric not null default 25
);

-- RLS etapas
alter table etapas enable row level security;
drop policy if exists "anon read etapas"  on etapas;
drop policy if exists "anon write etapas" on etapas;
create policy "anon read etapas"  on etapas for select using (true);
create policy "anon write etapas" on etapas for all    using (true) with check (true);

-- =========================================================
-- 2. ETAPAS PADRÃO (4 bimestres com peso igual de 25%)
-- =========================================================

insert into etapas (nome, ordem, peso)
select nome, ordem, peso
from (values
  ('1º Bimestre', 1, 25),
  ('2º Bimestre', 2, 25),
  ('3º Bimestre', 3, 25),
  ('4º Bimestre', 4, 25)
) as t(nome, ordem, peso)
where not exists (select 1 from etapas limit 1);

-- =========================================================
-- 3. COLUNA nota_maxima EM DISCIPLINAS
-- =========================================================

alter table disciplinas add column if not exists nota_maxima numeric not null default 100;

-- =========================================================
-- 4. NOVAS COLUNAS EM AVALIACOES
-- =========================================================

-- etapa_id: referência à etapa (opcional para dados antigos)
alter table avaliacoes
  add column if not exists etapa_id     uuid references etapas(id) on delete set null;

-- professor_id: professor que lançou a nota
alter table avaliacoes
  add column if not exists professor_id uuid references professores(id) on delete set null;

-- turma_id: turma da avaliação
alter table avaliacoes
  add column if not exists turma_id     uuid references turmas(id) on delete set null;

-- valor_maximo: escala da avaliação (default 10 para compatibilidade com dados antigos)
alter table avaliacoes
  add column if not exists valor_maximo numeric not null default 10;

-- =========================================================
-- 5. PREENCHER turma_id EM AVALIACOES EXISTENTES
--    (inferir a partir do aluno)
-- =========================================================

update avaliacoes a
set    turma_id = al.turma_id
from   alunos al
where  a.aluno_id  = al.id
and    a.turma_id  is null
and    al.turma_id is not null;

-- =========================================================
-- 6. ÍNDICES NOVOS
-- =========================================================

create index if not exists idx_avaliacoes_etapa      on avaliacoes(etapa_id);
create index if not exists idx_avaliacoes_disciplina  on avaliacoes(disciplina_id);
create index if not exists idx_etapas_ordem           on etapas(ordem);

-- =========================================================
-- 7. VERIFICAÇÃO
-- =========================================================

select
  'etapas'   as tabela, count(*) as total from etapas
union all
select
  'avaliacoes com etapa', count(*) from avaliacoes where etapa_id is not null
union all
select
  'avaliacoes sem etapa', count(*) from avaliacoes where etapa_id is null;
