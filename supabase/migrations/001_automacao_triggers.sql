-- =============================================================================
-- MIGRATION 001: Database-level automation triggers
-- Execute no Supabase > SQL Editor (após schema.sql)
-- =============================================================================

-- ─── TRIGGER: Ocorrência automática por frequência baixa ─────────────────────
-- Quando frequencias.percentual < 75, cria ocorrência automaticamente

create or replace function fn_auto_ocorrencia_frequencia()
returns trigger language plpgsql as $$
declare
  v_aluno_status text;
  v_mes_inicio   timestamptz;
  v_existe       int;
begin
  -- Só age se o percentual ficou abaixo de 75
  if (new.percentual is null or new.percentual >= 75) then
    return new;
  end if;

  -- Verificar se aluno está ativo
  select status into v_aluno_status from alunos where id = new.aluno_id;
  if v_aluno_status <> 'ativo' then return new; end if;

  -- Evitar duplicata no mesmo mês
  v_mes_inicio := date_trunc('month', now());
  select count(*) into v_existe
  from ocorrencias
  where aluno_id = new.aluno_id
    and tipo = 'frequencia'
    and created_at >= v_mes_inicio;

  if v_existe > 0 then return new; end if;

  -- Criar ocorrência
  insert into ocorrencias (aluno_id, tipo, descricao, status, data_ocorrencia)
  values (
    new.aluno_id,
    'frequencia',
    format(
      'Frequência automática: %s%% no mês %s/%s (abaixo de 75%%). Acompanhamento necessário.',
      new.percentual, new.mes, new.ano
    ),
    'aberta',
    current_date
  );

  return new;
end;
$$;

drop trigger if exists trg_auto_frequencia_baixa on frequencias;
create trigger trg_auto_frequencia_baixa
  after insert or update of percentual, faltas, aulas_total
  on frequencias
  for each row
  execute function fn_auto_ocorrencia_frequencia();


-- ─── TRIGGER: Ocorrência automática por nota baixa ───────────────────────────
-- Quando notas.media_final < 5, cria ocorrência de desempenho

create or replace function fn_auto_ocorrencia_nota()
returns trigger language plpgsql as $$
declare
  v_aluno_status text;
  v_ano_inicio   timestamptz;
  v_existe       int;
begin
  -- Só age se media_final ficou abaixo de 5
  if (new.media_final is null or new.media_final >= 5) then
    return new;
  end if;

  -- Verificar se aluno está ativo
  select status into v_aluno_status from alunos where id = new.aluno_id;
  if v_aluno_status <> 'ativo' then return new; end if;

  -- Evitar duplicata por aluno + disciplina no mesmo ano
  v_ano_inicio := date_trunc('year', now());
  select count(*) into v_existe
  from ocorrencias
  where aluno_id = new.aluno_id
    and tipo = 'desempenho'
    and descricao ilike ('%' || new.disciplina || '%')
    and created_at >= v_ano_inicio;

  if v_existe > 0 then return new; end if;

  -- Criar ocorrência
  insert into ocorrencias (aluno_id, tipo, descricao, status, data_ocorrencia)
  values (
    new.aluno_id,
    'desempenho',
    format(
      'Desempenho automático: média %.1f em %s (%s). Requer atenção pedagógica.',
      new.media_final, new.disciplina, new.ano
    ),
    'aberta',
    current_date
  );

  return new;
end;
$$;

drop trigger if exists trg_auto_nota_baixa on notas;
create trigger trg_auto_nota_baixa
  after insert or update of bimestre_1, bimestre_2, bimestre_3, bimestre_4
  on notas
  for each row
  execute function fn_auto_ocorrencia_nota();


-- ─── VERIFICAÇÃO ─────────────────────────────────────────────────────────────
-- Após executar, cheque se os triggers foram criados:
select trigger_name, event_object_table, event_manipulation
from information_schema.triggers
where trigger_schema = 'public'
  and trigger_name like 'trg_auto_%'
order by trigger_name;
