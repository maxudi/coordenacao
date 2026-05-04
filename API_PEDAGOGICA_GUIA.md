# API Pedagógica - Guia de Teste e Integração

## Resumo das Mudanças

O sistema foi refatorado para implementar o modelo pedagógico correto:
- **Disciplinas**: Tabela independente com validação de unicidade
- **Vínculos**: Tabela `professor_turma_disciplina` com unique constraint
- **Compatibilidade**: Campo deprecated `turma.professor_id` mantido para fallback

## Estrutura de Pastas Criada

```
lib/
├── services/
│   ├── disciplinaService.ts    ← Lógica de negócio para Disciplinas
│   └── vinculoService.ts       ← Lógica de negócio para Vínculos
├── utils/
│   └── compatibilidade.ts      ← Funções helper de compatibilidade
└── pedagogicalModel.ts         ← Documentação do modelo

app/api/
├── disciplinas/
│   ├── route.ts                ← GET all, POST create
│   └── [id]/route.ts           ← GET one, PUT update, DELETE
└── vinculos/
    ├── route.ts                ← GET with filters, POST create
    └── [id]/route.ts           ← DELETE
```

## APIs Disponíveis

### Disciplinas

#### Listar todas as disciplinas
```bash
curl "http://localhost:3000/api/disciplinas" \
  -H "Content-Type: application/json"
```

**Response (200):**
```json
[
  { "id": "uuid-1", "nome": "Português" },
  { "id": "uuid-2", "nome": "Matemática" }
]
```

#### Criar disciplina
```bash
curl -X POST "http://localhost:3000/api/disciplinas" \
  -H "Content-Type: application/json" \
  -d '{ "nome": "Português" }'
```

**Response (201):**
```json
{ "id": "uuid-1", "nome": "Português" }
```

**Errors:**
- `400`: Nome vazio, muito curto (<2 chars) ou muito longo (>100)
- `409`: Disciplina já existe com este nome

#### Buscar disciplina específica
```bash
curl "http://localhost:3000/api/disciplinas/uuid-1" \
  -H "Content-Type: application/json"
```

#### Atualizar disciplina
```bash
curl -X PUT "http://localhost:3000/api/disciplinas/uuid-1" \
  -H "Content-Type: application/json" \
  -d '{ "nome": "Português I" }'
```

#### Deletar disciplina
```bash
curl -X DELETE "http://localhost:3000/api/disciplinas/uuid-1" \
  -H "Content-Type: application/json"
```

**Errors:**
- `409`: Disciplina tem vínculos ativos (não pode deletar)

---

### Vínculos (Professor ↔ Turma ↔ Disciplina)

#### Listar todos os vínculos
```bash
curl "http://localhost:3000/api/vinculos" \
  -H "Content-Type: application/json"
```

**Response (200):**
```json
[
  {
    "id": "uuid-v1",
    "professor_id": "prof-1",
    "turma_id": "turma-1",
    "disciplina_id": "disc-1",
    "professor_nome": "João Silva",
    "turma_nome": "8º A",
    "disciplina_nome": "Português"
  }
]
```

#### Listar vínculos com filtros
```bash
# Vínculos de um professor
curl "http://localhost:3000/api/vinculos?professorId=prof-1" \

# Vínculos de uma turma
curl "http://localhost:3000/api/vinculos?turmaId=turma-1" \

# Vínculos de uma disciplina
curl "http://localhost:3000/api/vinculos?disciplinaId=disc-1" \

# Combinações
curl "http://localhost:3000/api/vinculos?professorId=prof-1&turmaId=turma-1" \
```

#### Criar vínculo
```bash
curl -X POST "http://localhost:3000/api/vinculos" \
  -H "Content-Type: application/json" \
  -d '{
    "professorId": "prof-1",
    "turmaId": "turma-1",
    "disciplinaId": "disc-1"
  }'
```

**Response (201):**
```json
{
  "id": "uuid-v1",
  "professor_id": "prof-1",
  "turma_id": "turma-1",
  "disciplina_id": "disc-1"
}
```

**Errors:**
- `400`: Campos obrigatórios faltando
- `404`: Professor/Turma/Disciplina não encontrado
- `409`: Vínculo já existe (não há duplicação)

#### Deletar vínculo
```bash
curl -X DELETE "http://localhost:3000/api/vinculos/uuid-v1" \
  -H "Content-Type: application/json"
```

**Response (200):**
```json
{ "mensagem": "Vínculo deletado com sucesso" }
```

---

## Usando os Serviços no Frontend

### Exemplo: Buscar disciplinas de uma turma

```typescript
import { vinculoService } from '@/lib/services/vinculoService'

// Buscar disciplinas e professores de uma turma
const disciplinas = await vinculoService.getByTurma(turmaId)
// → Array com estrutura expandida incluindo nomes

disciplinas.forEach(d => {
  console.log(`${d.professor_nome} leciona ${d.disciplina_nome} na ${d.turma_nome}`)
})
```

### Exemplo: Compatibilidade - Obter professor responsável

```typescript
import { getTurmaComProfessorCompat } from '@/lib/utils/compatibilidade'

const turmaData = { id: 'turma-1', nome: '8º A', professor_id: null }
const turmaEnriquecida = await getTurmaComProfessorCompat(turmaData.id, turmaData)

// Será retornado algo como:
// {
//   id: 'turma-1',
//   nome: '8º A',
//   professor_id: null,
//   professor: { id: 'prof-1', nome: 'João Silva' }  ← Novo campo compatível
// }
```

---

## Fluxo Recomendado de Teste

1. **Criar Disciplinas**
   ```bash
   POST /api/disciplinas → Português
   POST /api/disciplinas → Matemática
   POST /api/disciplinas → História
   ```

2. **Listar Disciplinas**
   ```bash
   GET /api/disciplinas
   # Copiar os IDs das disciplinas criadas
   ```

3. **Criar Vínculos**
   ```bash
   POST /api/vinculos → (professor-id, turma-id, portuguese-id)
   POST /api/vinculos → (professor-id, turma-id, math-id)
   ```

4. **Filtrar Vínculos**
   ```bash
   GET /api/vinculos?turmaId={turma-id}
   # Deve retornar 2 vínculos com dados expandidos
   ```

5. **Testar Duplicação**
   ```bash
   POST /api/vinculos → (professor-id, turma-id, portuguese-id)
   # Deve retornar erro 409 "Este vínculo já existe"
   ```

6. **Deletar Vínculo**
   ```bash
   DELETE /api/vinculos/{vínculo-id}
   ```

7. **Tentar Deletar Disciplina em Uso**
   ```bash
   # Crie novamente um vínculo
   POST /api/vinculos → (professor-id, turma-id, portuguese-id)
   # Agora tente deletar a disciplina
   DELETE /api/disciplinas/{português-id}
   # Deve retornar erro 409 "Não é possível deletar disciplina com vínculos"
   ```

---

## Validações Garantidas

| Validação | Onde | Erro |
|-----------|------|------|
| Nome disciplina 2-100 chars | POST/PUT /api/disciplinas | 400 |
| Disciplina única por nome | POST/PUT /api/disciplinas | 409 |
| Entidades existem | POST /api/vinculos | 404 |
| Sem vínculos duplicados | POST /api/vinculos | 409 |
| Não deletar disc com uso | DELETE /api/disciplinas | 409 |

---

## Próximas Etapas

1. ✓ APIs criadas e funcionais
2. ⏳ Criar UI (páginas) para gerenciar disciplinas
3. ⏳ Criar UI para gerenciar vínculos
4. ⏳ Integrar no dashboard de turmas
5. ⏳ Migração gradual de queries legadas
6. ⏳ Seed de dados para produção
