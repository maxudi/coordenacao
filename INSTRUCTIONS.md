# Instruções do Projeto — Sistema de Gestão Pedagógica

## OBJETIVO

Criar um sistema moderno, elegante e funcional para gestão pedagógica, com interface padronizada e arquitetura escalável.

---

## STACK OBRIGATÓRIA

* Next.js (App Router)
* React
* Tailwind CSS
* Supabase (backend e banco)
* Docker (projeto pronto para deploy)
* Estrutura compatível com GitHub

---

## PADRÃO VISUAL (DESIGN SYSTEM)

Crie um design system completo e consistente:

### Estilo

* moderno
* clean
* minimalista
* estilo SaaS profissional

### Cores

* definir paleta principal (primária, secundária, neutra)
* cores devem ser reutilizadas em TODO o sistema
* manter consistência visual em todos os módulos

### Tipografia

* padrão único
* hierarquia clara (títulos, subtítulos, texto)

---

## COMPONENTES (OBRIGATÓRIO PADRONIZAR)

Todos os elementos devem ser reutilizáveis:

* Botões (primary, secondary, danger)
* Inputs
* Selects
* Tabelas
* Cards
* Modais
* Alerts

Nunca criar estilos isolados por página.

---

## COMPORTAMENTO PADRÃO

### Upload de arquivos

* usar drag and drop (arrastar e soltar)
* exibir preview do arquivo
* mostrar progresso de upload
* permitir remoção antes de enviar

### Modais

* TODAS as confirmações devem usar modal
* padrão único para:
  * confirmação
  * erro
  * sucesso

### Feedback visual

* loading states em TODAS as ações
* mensagens de erro claras
* mensagens de sucesso consistentes

---

## UX (EXPERIÊNCIA DO USUÁRIO)

* interface intuitiva
* navegação simples
* evitar sobrecarga visual
* feedback imediato em todas as ações

---

## ESTRUTURA DO PROJETO

```
/app
/components
/hooks
/services
/lib
/styles
```

Separar lógica de UI.

---

## PADRÕES DE CÓDIGO

* código limpo e modular
* evitar repetição
* usar boas práticas de React
* componentes pequenos e reutilizáveis

---

## RESPONSIVIDADE

* sistema deve funcionar bem em:
  * desktop
  * tablet
  * mobile

---

## DOCKER

Gerar Dockerfile e docker-compose:

* pronto para produção
* fácil deploy em servidores (ex: EasyPanel)

---

## RESULTADO ESPERADO

* sistema visualmente consistente
* código organizado e escalável
* pronto para produção
* pronto para versionamento no GitHub
* pronto para deploy via Docker

---

## IMPORTANTE

* pensar como arquiteto de software
* garantir consistência global
* criar padrões reutilizáveis
* evitar soluções improvisadas
* criar design system antes de iniciar as telas quando necessário
