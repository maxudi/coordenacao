# 📑 ÍNDICE DE REFERÊNCIA RÁPIDA - Modelo Pedagógico v1.0

## 🗂️ Estrutura de Arquivos Criados

```
coordenacao/
│
├── lib/
│   ├── services/
│   │   ├── disciplinaService.ts          ← 9 funções de negócio
│   │   └── vinculoService.ts             ← 11 funções de negócio
│   ├── utils/
│   │   └── compatibilidade.ts            ← 5 helpers de compatibilidade
│   └── pedagogicalModel.ts               ← Documentação (150 linhas)
│
├── app/api/
│   ├── disciplinas/
│   │   ├── route.ts                      ← POST, GET
│   │   └── [id]/route.ts                 ← GET, PUT, DELETE
│   └── vinculos/
│       ├── route.ts                      ← POST, GET
│       └── [id]/route.ts                 ← DELETE
│
├── supabase/
│   └── setup_completo.sql                ← Atualizado com constraints
│
├── API_PEDAGOGICA_GUIA.md                ← Guia de teste (200 linhas)
├── PEDAGOGICAL_MODEL_v1_CHANGELOG.md     ← Changelog executivo
├── STATUS_IMPLEMENTACAO.md               ← Status final
├── TESTES_MODELO_PEDAGOGICO.ts           ← Suite de testes
└── INDICE_REFERENCIA.md                  ← Este arquivo
```

---

## 🔍 Localizações Rápidas

### Para Começar
1. **Leia primeiro:** `STATUS_IMPLEMENTACAO.md` (resumo executivo)
2. **Teste rápido:** `API_PEDAGOGICA_GUIA.md` (exemplos curl)
3. **Implementar:** `lib/services/disciplinaService.ts` (copiar padrão)

### Para Entender o Modelo
- Documentação completa: `lib/pedagogicalModel.ts`
- Schema SQL: `supabase/setup_completo.sql` (linhas 63-105)

### Para Testar
- Exemplos de teste: `TESTES_MODELO_PEDAGOGICO.ts`
- Guia detalhado: `API_PEDAGOGICA_GUIA.md`

### Para Usar no Código
```typescript
// Disciplinas
import { disciplinaService } from '@/lib/services/disciplinaService'

// Vínculos
import { vinculoService } from '@/lib/services/vinculoService'

// Compatibilidade
import { getTurmaComProfessorCompat } from '@/lib/utils/compatibilidade'
```

---

## 📋 Checklist de Implementação

- [ ] Ler `STATUS_IMPLEMENTACAO.md`
- [ ] Executar `setup_completo.sql` no Supabase
- [ ] Testar disciplinas com curl
- [ ] Testar vínculos com curl
- [ ] Importar serviços no frontend
- [ ] Criar UI para disciplinas
- [ ] Criar UI para vínculos
- [ ] Executar TESTES_MODELO_PEDAGOGICO.ts
- [ ] Migrar queries legadas
- [ ] Deploy em produção

---

## 🎯 Endpoints Disponíveis

### Disciplinas (8 endpoints)
```
GET    /api/disciplinas                  → Listar todas
POST   /api/disciplinas                  → Criar nova
GET    /api/disciplinas/[id]             → Buscar uma
PUT    /api/disciplinas/[id]             → Atualizar
DELETE /api/disciplinas/[id]             → Deletar
```

### Vínculos (3 endpoints)
```
GET    /api/vinculos                     → Listar com filtros
POST   /api/vinculos                     → Criar vínculo
DELETE /api/vinculos/[id]                → Deletar vínculo
```

---

## 🔑 Funções-Chave

### disciplinaService
| Função | Descrição |
|--------|-----------|
| getAll() | Listar todas ordenadas |
| getById(id) | Buscar uma |
| getByNome(nome) | Verificar duplicação |
| create(nome) | Criar com validação |
| update(id, nome) | Atualizar |
| delete(id) | Deletar se sem vínculos |
| getDisciplinasByProfessorTurma() | Disciplinas do professor em turma |
| getDisciplinasTurmaComProfessores() | Disciplinas turma com professores |

### vinculoService
| Função | Descrição |
|--------|-----------|
| getAll(filtros) | Listar com expansão de dados |
| getById(id) | Buscar um vínculo |
| getByProfessor() | Vínculos do professor |
| getByTurma() | Vínculos da turma |
| getByDisciplina() | Vínculos da disciplina |
| create() | Criar com validação |
| delete() | Deletar |
| getProfessoresTurma() | Array de professores |
| getProfessorResponsavelTurma() | Primeiro professor [COMPAT] |

---

## ⚠️ Pontos Importantes

1. **Setup necessário:** Execute `setup_completo.sql` antes de usar
2. **Async/await:** Todos os serviços retornam Promises
3. **Validações:** Estão nos serviços, não nos routes
4. **Compatibilidade:** turma.professor_id nunca será deletado
5. **HTTP Status:** Use 400 (validação), 404 (não encontrado), 409 (conflito)
6. **TypeScript:** 100% type-safe com types em database.types.ts

---

## 🚀 Início Rápido (5 minutos)

```bash
# 1. Executar SQL (Supabase Console)
# Cole supabase/setup_completo.sql

# 2. Testar disciplinas
curl -X POST http://localhost:3000/api/disciplinas \
  -H "Content-Type: application/json" \
  -d '{"nome": "Português"}'

# 3. Listar
curl http://localhost:3000/api/disciplinas

# 4. Usar no código
import { disciplinaService } from '@/lib/services/disciplinaService'
const discs = await disciplinaService.getAll()
```

---

## 💡 Padrões Implementados

### Service Pattern
```typescript
// Toda lógica de negócio aqui
export const meuService = {
  async funcao1() { ... },
  async funcao2() { ... },
}
```

### API Handler Pattern
```typescript
export async function GET(request) {
  try {
    const data = await meuService.funcao1()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ erro: msg }, { status: 500 })
  }
}
```

### Error Handling Pattern
```typescript
// Status codes:
400 → Validação falhou (nome vazio, etc)
404 → Recurso não encontrado
409 → Conflito (duplicação, etc)
500 → Erro do servidor
```

---

## 📞 FAQ Rápido

**P: Posso deletar turma?**
R: Sim, vínculos são deletados automaticamente (cascade)

**P: Posso deletar disciplina?**
R: Não se tem vínculos. Remova vínculos primeiro ou deletar turma.

**P: professor_id em turmas?**
R: Mantido para compatibilidade, mas novo código usa professor_turma_disciplina

**P: Como saber se vínculo existe?**
R: GET /api/vinculos?professorId=X&turmaId=Y&disciplinaId=Z

**P: Qual é o primeiro professor de uma turma?**
R: Use `vinculoService.getProfessorResponsavelTurma(turmaId)`

---

## 🎓 Próximas Lições

Após implementar isto, considere:
1. Criar CRUD UI para disciplinas
2. Criar CRUD UI para vínculos
3. Integração com página de avaliações
4. Seed de dados
5. Testes automatizados (Jest)

---

**Versão:** 1.0  
**Status:** ✅ COMPLETO  
**Última Atualização:** Jan 2025  
**Mantido por:** Modelo Pedagógico v1.0
