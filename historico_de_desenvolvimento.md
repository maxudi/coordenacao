# Histórico de Desenvolvimento — Sistema de Coordenação Escolar

Registro cronológico das solicitações e entregas ao longo do desenvolvimento.

---

## Fase 1 — Base do Sistema

**Pedido:** Criar sistema de gestão escolar (coordenação pedagógica) com Next.js e Supabase.

**Entregue:**
- Projeto Next.js 15.5 com App Router configurado
- Integração com Supabase self-hosted
- Sistema de design customizado com tokens (`text-ink`, `bg-surface`, etc.)
- Componentes UI reutilizáveis em `components/ui/`: `Button`, `Input`, `Select`, `Card`, `Table`, `Badge`, `Avatar`, `ConfirmModal`, `useToast`, `Upload`, `Modal`, `Alert`
- Layout principal com sidebar de navegação (`components/layout/Sidebar.tsx`)
- Schema SQL inicial em `supabase/setup_completo.sql`

---

## Fase 2 — Módulos Principais (Alunos, Professores, Turmas)

**Pedido:** CRUD completo para alunos, professores e turmas.

**Entregue:**

### Alunos
- `app/(app)/alunos/page.tsx` — listagem com busca, filtro por status e turma, contador
- `app/(app)/alunos/novo/page.tsx` — formulário de cadastro
- `app/(app)/alunos/[id]/page.tsx` — perfil completo do aluno (abas: dados, frequência, avaliações, ocorrências, histórico)
- `app/(app)/alunos/[id]/editar/page.tsx` — edição
- `app/api/alunos/route.ts` — GET/POST
- `app/api/alunos/[id]/route.ts` — GET/PUT/DELETE

### Professores
- `app/(app)/professores/page.tsx` — listagem com busca e filtro
- `app/(app)/professores/novo/page.tsx` — formulário de cadastro
- `app/(app)/professores/[id]/page.tsx` — perfil com turmas e disciplinas vinculadas
- `app/(app)/professores/[id]/editar/page.tsx` — edição
- `app/api/professores/route.ts` — GET/POST
- `app/api/professores/[id]/route.ts` — GET/PUT/DELETE

### Turmas
- `app/(app)/turmas/page.tsx` — listagem
- `app/(app)/turmas/novo/page.tsx` — formulário
- `app/(app)/turmas/[id]/page.tsx` — detalhe com alunos e professores vinculados
- `app/(app)/turmas/[id]/editar/page.tsx` — edição
- `app/api/turmas/route.ts` — GET/POST
- `app/api/turmas/[id]/route.ts` — GET/PUT/DELETE

---

## Fase 3 — Frequência

**Pedido:** Módulo de controle de frequência diária e resumo mensal.

**Entregue:**
- `app/(app)/frequencia/page.tsx` — lançamento diário por turma (presença/ausência por aluno)
- `app/(app)/frequencia/resumo/page.tsx` — visualização de percentual mensal por aluno
- `app/api/frequencia/route.ts` — GET/POST frequência diária
- `app/api/frequencia/resumo/route.ts` — GET/PUT resumo mensal
- Trigger automático no banco: gera ocorrência se frequência cair abaixo de 75%

---

## Fase 4 — Ocorrências e Histórico

**Pedido:** Registro de ocorrências pedagógicas e histórico do aluno.

**Entregue:**
- `app/(app)/ocorrencias/page.tsx` — listagem com filtros (tipo, status, busca)
- `app/(app)/ocorrencias/nova/page.tsx` — formulário de registro
- `app/(app)/ocorrencias/[id]/page.tsx` — detalhe com opção de resolver
- `app/api/ocorrencias/route.ts` — GET/POST
- `app/api/ocorrencias/[id]/route.ts` — GET/PUT/DELETE
- `app/api/historico/route.ts` — GET/POST histórico
- Trigger automático: gera ocorrência de desempenho se nota < 5

---

## Fase 5 — Mensagens e Automações

**Pedido:** Envio de mensagens (WhatsApp/SMS) e automações por gatilho.

**Entregue:**
- `app/(app)/mensagens/page.tsx` — listagem de mensagens enviadas
- `app/(app)/mensagens/nova/page.tsx` — composição e envio
- `app/(app)/automacoes/page.tsx` — CRUD de automações (gatilho + ação)
- `app/api/mensagens/route.ts` — GET/POST
- `app/api/mensagens/agendadas/route.ts` — GET/POST mensagens agendadas
- `app/api/automacoes/route.ts` — GET/POST
- `app/api/automacoes/[id]/route.ts` — PUT/DELETE

---

## Fase 6 — Dashboard e Eventos

**Pedido:** Painel com indicadores e calendário de eventos.

**Entregue:**
- `app/(app)/page.tsx` — dashboard com cards de totais, alertas de frequência baixa, últimas ocorrências, próximos eventos
- `app/(app)/eventos/page.tsx` — CRUD de eventos do calendário escolar
- `app/api/dashboard/route.ts` — agregação de indicadores
- `app/api/eventos/route.ts` — GET/POST
- `app/api/eventos/[id]/route.ts` — PUT/DELETE

---

## Fase 7 — Avaliações (versão inicial, escala 0–10)

**Pedido:** Módulo de avaliações (notas) com importação via planilha.

**Entregue:**
- `app/(app)/avaliacoes/page.tsx` — listagem simples de avaliações
- `app/(app)/avaliacoes/novo/page.tsx` — formulário (aluno, disciplina, tipo, nota 0–10, data)
- `app/(app)/avaliacoes/importar/page.tsx` — upload de planilha Excel
- `app/api/avaliacoes/importar/route.ts` — processamento do Excel com validação
- Dependência: `npm install xlsx`

---

## Fase 8 — Menu Disciplinas

**Pedido:** "Faltou um menu para disciplinas né?" — adicionar Disciplinas à navegação com CRUD completo.

**Entregue:**
- `components/layout/Sidebar.tsx` — adicionado ícone `IconPuzzle` e item "Disciplinas" (entre Turmas e Avaliações)
- `app/(app)/disciplinas/page.tsx` — CRUD completo:
  - Layout dois painéis (formulário à esquerda, lista à direita)
  - Edição inline (Enter salva, Escape cancela)
  - Exclusão protegida (verifica vínculos em `professor_turma_disciplina` e `avaliacoes`)
  - Busca por nome e contador de registros

---

## Fase 9 — Modelo Acadêmico com Etapas (Evolução das Avaliações)

**Pedido:** Evoluir o módulo de avaliações para modelo acadêmico real com:
- Etapas configuráveis (bimestres/trimestres — qualquer quantidade)
- Nota proporcional (`valor / valor_maximo × 100`), sem escala fixa 0–10
- Cálculo ponderado por peso de cada etapa
- 100% de compatibilidade com dados antigos (etapa e valor_maximo opcionais)

**Entregue:**

### Banco de dados
- `supabase/setup_completo.sql` — atualizado com:
  - Tabela `etapas` (`id, nome, ordem, peso`)
  - Coluna `nota_maxima` em `disciplinas`
  - Colunas `etapa_id`, `professor_id`, `turma_id`, `valor_maximo` em `avaliacoes`
  - Novos índices: `idx_avaliacoes_etapa`, `idx_avaliacoes_disciplina`, `idx_etapas_ordem`
  - RLS e políticas anon para `etapas`
- `supabase/migration_avaliacoes_v2.sql` — migração sem perda de dados para bancos existentes:
  - Cria `etapas` se não existir
  - Semeia 4 bimestres padrão (25% cada) se tabela vazia
  - Adiciona colunas novas com `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`
  - Preenche `turma_id` retroativamente a partir dos alunos

### APIs
- `app/api/etapas/route.ts` — GET (lista ordenada) / POST (criar etapa)
- `app/api/etapas/[id]/route.ts` — PUT (editar) / DELETE (com proteção: 409 se tem avaliações)
- `app/api/avaliacoes/route.ts` — GET com joins completos + modo `?agrupado=true` (agrupa por etapa, calcula `nota_etapa` proporcional e `nota_final` ponderada) / POST com validação `valor ≤ valor_maximo`

### Frontend
- `app/(app)/avaliacoes/page.tsx` — substituído por nova view:
  - Dois modos: "Por Etapa" (padrão) e "Lista"
  - Notas exibidas como `valor/valor_maximo` + percentual colorido
  - Barra de progresso e `nota_etapa` por grupo
  - `nota_final ponderada` destacada no rodapé
  - Dados sem etapa agrupados em "Sem etapa" (fallback legado)
  - Filtros por disciplina, etapa, tipo e busca textual
- `app/(app)/avaliacoes/novo/page.tsx` — formulário atualizado:
  - Campos adicionados: `etapa_id` (obrigatório), `professor_id`, `turma_id` (auto-preenchido pelo aluno), `valor_maximo`
  - Validação: `valor ≤ valor_maximo` (sem limite fixo)
- `app/api/avaliacoes/importar/route.ts` — importação atualizada:
  - Busca e resolve `etapa_nome` → `etapa_id`
  - Aceita coluna `valor_maximo` (padrão 10 se ausente)
  - Validação proporcional ao invés do limite fixo 0–10

### Tipos
- `lib/database.types.ts` — atualizado:
  - Nova interface `Etapa { id, nome, ordem, peso }`
  - `Disciplina` com campo `nota_maxima`
  - `Avaliacao` com campos `etapa_id`, `professor_id`, `turma_id`, `valor_maximo`

---

## Resumo de Arquivos por Módulo

| Módulo | Arquivos de UI | Arquivos de API |
|--------|---------------|-----------------|
| Alunos | 4 | 2 |
| Professores | 4 | 2 |
| Turmas | 4 | 2 |
| Disciplinas | 1 | — |
| Frequência | 2 | 2 |
| Ocorrências | 3 | 2 |
| Mensagens | 2 | 2 |
| Automações | 1 | 2 |
| Dashboard | 1 | 1 |
| Eventos | 1 | 2 |
| Avaliações | 3 | 3 |
| Etapas | — | 2 |
| **Total** | **26** | **22** |

---

## Stack Técnica

- **Framework:** Next.js 15.5 (App Router)
- **Banco:** Supabase self-hosted (PostgreSQL)
- **Estilo:** Tailwind CSS com design tokens customizados
- **Dependências extras:** `recharts` (gráficos), `xlsx` (importação de planilhas)
- **Padrão de rota:** `app/(app)/` para UI, `app/api/` para backend
