# Design System — Gestão Pedagógica

> Fonte única de verdade para todos os padrões visuais e de interação do sistema.
> Consultar este documento antes de criar qualquer componente ou tela.

---

## 1. PRINCÍPIOS

| Princípio | Descrição |
|---|---|
| **Consistência** | Mesmos padrões visuais em todo o sistema, sem estilos isolados por página |
| **Reutilização** | Todo elemento é um componente ou classe utilitária compartilhada |
| **Clareza** | Hierarquia visual óbvia, sem ruído desnecessário |
| **Feedback** | Toda ação tem resposta visual imediata (loading, sucesso, erro) |
| **Acessibilidade** | Focus rings, contraste adequado, semântica HTML correta |

---

## 2. CORES

### 2.1 Paleta Principal

| Token | Hex | Uso |
|---|---|---|
| `primary-600` | `#2563eb` | CTA principal, links, foco |
| `primary-700` | `#1d4ed8` | Hover de primary |
| `primary-800` | `#1e40af` | Active / pressed |
| `secondary-600` | `#7c3aed` | Ação secundária, tags |
| `secondary-700` | `#6d28d9` | Hover de secondary |

### 2.2 Feedback

| Token | Hex | Uso |
|---|---|---|
| `success-600` | `#16a34a` | Confirmação, salvo, ativo |
| `success-700` | `#15803d` | Hover de success |
| `danger-600` | `#dc2626` | Erro, exclusão, crítico |
| `danger-700` | `#b91c1c` | Hover de danger |
| `warning-500` | `#f59e0b` | Atenção, pendente |
| `warning-600` | `#d97706` | Hover de warning |

### 2.3 Neutros / Superfícies

| Token | Hex | Uso |
|---|---|---|
| `color-background` | `#f8fafc` | Fundo da página |
| `color-surface` | `#ffffff` | Cards, modais, inputs |
| `color-surface-subtle` | `#f1f5f9` | Hover de linhas, header de tabela |
| `color-border` | `#e2e8f0` | Bordas gerais |
| `color-border-strong` | `#cbd5e1` | Bordas com ênfase |
| `color-ink` | `#0f172a` | Texto principal |
| `color-ink-muted` | `#64748b` | Texto secundário, placeholders |
| `color-ink-faint` | `#94a3b8` | Texto desativado, hints |

### 2.4 Regra de Uso

```
NUNCA usar hex direto no código.
SEMPRE usar os tokens via classes Tailwind ou variáveis CSS.

✅ bg-primary-600
✅ text-ink-muted
✅ border-surface-border

❌ bg-[#2563eb]
❌ color: #64748b
```

---

## 3. TIPOGRAFIA

### 3.1 Fonte

- **Família:** Inter (Google Fonts)
- **Fallback:** ui-sans-serif, system-ui, sans-serif

### 3.2 Escala

| Classe | Tamanho | Line Height | Uso |
|---|---|---|---|
| `text-display-xl` | 48px | 1.15 | Hero, landing |
| `text-display-lg` | 36px | 1.20 | Títulos de página grandes |
| `text-display` | 30px | 1.25 | Título de página |
| `text-heading-xl` | 24px | 1.33 | Seção principal |
| `text-heading-lg` | 20px | 1.40 | Subtítulo de seção |
| `text-heading` | 18px | 1.50 | Título de card |
| `text-heading-sm` | 16px | 1.50 | Título de modal |
| `text-body-lg` | 16px | 1.625 | Texto principal |
| `text-body` | 14px | 1.571 | Texto padrão, inputs |
| `text-body-sm` | 13px | 1.538 | Texto auxiliar, tabelas |
| `text-caption` | 12px | 1.500 | Legendas, helper text |
| `text-overline` | 11px | 1.450 | Labels de tabela, badges |

### 3.3 Pesos

| Classe | Peso | Uso |
|---|---|---|
| `font-regular` | 400 | Texto corrido |
| `font-medium` | 500 | Destaque sutil |
| `font-semibold` | 600 | Títulos, botões |
| `font-bold` | 700 | Números, valores |

### 3.4 Hierarquia em tela

```
Título da página    → text-display    font-semibold  text-ink
Título de seção     → text-heading-xl font-semibold  text-ink
Subtítulo           → text-heading-lg font-medium    text-ink-muted
Título de card      → text-heading    font-semibold  text-ink
Texto padrão        → text-body       font-regular   text-ink
Texto auxiliar      → text-body-sm    font-regular   text-ink-muted
Legenda             → text-caption    font-regular   text-ink-muted
```

---

## 4. ESPAÇAMENTOS

Base de **4 px**. Usar múltiplos da escala Tailwind.

| Uso | Valor | Classe |
|---|---|---|
| Gap entre ícone e texto | 8px | `gap-2` |
| Padding interno de botão (md) | 16px | `px-4` |
| Padding de card | 20–24px | `p-5` / `p-6` |
| Gap entre campos de formulário | 16–20px | `gap-4` / `gap-5` |
| Margem entre seções | 24–32px | `mb-6` / `mb-8` |
| Padding de página | 24–32px | `p-6` / `p-8` |
| Gap entre cards no grid | 16–24px | `gap-4` / `gap-6` |

---

## 5. BORDAS E SOMBRAS

### 5.1 Raios

| Token | Valor | Uso |
|---|---|---|
| `rounded-sm` | 4px | Badges, chips pequenos |
| `rounded` | 6px | Botões, inputs |
| `rounded-md` | 8px | Botões maiores |
| `rounded-lg` | 12px | Cards, tabelas |
| `rounded-xl` | 16px | Modais |
| `rounded-full` | 9999px | Avatars, pills |

### 5.2 Sombras

| Token | Uso |
|---|---|
| `shadow-xs` | Botões, chips |
| `shadow-sm` | Cards padrão, tabelas |
| `shadow` | Cards elevados, dropdowns |
| `shadow-md` | Cards interativos no hover |
| `shadow-lg` | Toasts, popovers |
| `shadow-xl` | Modais |
| `shadow-primary-glow` | Botão primary no hover |

---

## 6. COMPONENTES

### 6.1 Botões

```
Hierarquia de ações:
1. Ação principal      → btn btn-primary btn-md
2. Ação secundária     → btn btn-outline btn-md
3. Ação destrutiva     → btn btn-danger btn-md
4. Ação sutil          → btn btn-ghost btn-md

Tamanhos: btn-xs | btn-sm | btn-md | btn-lg | btn-xl

Estados:
- Padrão:   estilo base
- Hover:    cor 700 + sombra aumentada
- Active:   cor 800
- Disabled: opacity-50 + pointer-events-none
- Loading:  btn-loading (spinner, texto invisível)
```

**Regra:** nunca criar botão com classes ad-hoc. Sempre compor com `.btn` + variante + tamanho.

---

### 6.2 Inputs

```
Input padrão:   <input class="input-base input-md" />
Input com erro: <input class="input-base input-md input-error" />
Select:         <select class="select-base" />
Textarea:       <textarea class="textarea-base" />

Estados:
- Padrão:    borda cinza, fundo branco
- Foco:      ring azul (primary-500) + borda primary
- Erro:      borda danger + ring danger
- Disabled:  fundo subtle + texto faint
- Read-only: fundo subtle
```

**Estrutura de campo completo:**
```html
<div>
  <label class="input-label input-label-required">Nome</label>
  <div class="input-group">
    <span class="input-group-icon-left"><Icon /></span>
    <input class="input-base input-md input-with-icon-left" />
  </div>
  <span class="input-error-msg">Campo obrigatório</span>
</div>
```

---

### 6.3 Cards

```
Card padrão:      card
Card sem sombra:  card-flat
Card elevado:     card-elevated
Card clicável:    card-interactive
Card de stat:     card-stat

Subcomponentes:
  .card-header   → título + ações
  .card-body     → conteúdo principal
  .card-footer   → rodapé / ações secundárias
```

---

### 6.4 Tabelas

```html
<div class="table-wrapper">
  <table class="table">
    <thead>
      <tr>
        <th>Nome</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      <tr>           <!-- hover automático -->
        <td>...</td>
        <td>...</td>
      </tr>
      <tr class="selected">  <!-- linha selecionada -->
        <td>...</td>
      </tr>
    </tbody>
  </table>
</div>
```

---

### 6.5 Modais

```
Tamanhos: modal-sm | modal-md | modal-lg | modal-xl | modal-full

Estrutura obrigatória:
  .modal-overlay   → fundo escuro + blur
    .modal-md      → container
      .modal-header  → título + botão fechar
      .modal-body    → conteúdo
      .modal-footer  → botões de ação

Tipos:
  - Confirmação → modal-sm com ícone + mensagem + btn-danger + btn-outline
  - Sucesso     → modal-sm com ícone success + mensagem + btn-primary
  - Erro        → modal-sm com ícone danger + detalhe do erro + btn-outline
  - Formulário  → modal-md ou modal-lg
```

**Regra:** toda ação destrutiva ou irreversível obrigatoriamente passa por modal de confirmação.

---

### 6.6 Alerts

```
alert-info     → informação geral (azul)
alert-success  → operação bem-sucedida (verde)
alert-warning  → atenção / dados incompletos (amarelo)
alert-danger   → erro / falha crítica (vermelho)

Estrutura:
<div class="alert-info">
  <Icon class="alert-icon" />
  <div>
    <p class="alert-title">Título</p>
    <p class="alert-desc">Descrição detalhada.</p>
  </div>
</div>
```

---

### 6.7 Badges

```
badge-primary   → ativo, destaque
badge-secondary → categoria, tag
badge-success   → aprovado, concluído
badge-danger    → reprovado, bloqueado
badge-warning   → pendente, aguardando
badge-neutral   → rascunho, padrão
```

---

### 6.8 Upload / Dropzone

```
.dropzone          → estado padrão (borda tracejada cinza)
.dropzone-active   → arquivo arrastado (borda azul + fundo azul claro)
.dropzone-reject   → tipo inválido (borda vermelha + fundo vermelho claro)

Comportamento obrigatório:
1. Aceitar clique E arrastar-soltar
2. Mostrar preview (imagem ou nome do arquivo)
3. Barra de progresso (.progress-track > .progress-fill) durante upload
4. Botão de remoção antes de enviar
5. Feedback de erro se tipo/tamanho inválido
```

---

### 6.9 Loading States

```
Skeleton:     .skeleton / .skeleton-text / .skeleton-heading
Spinner:      border-2 border-primary-200 border-t-primary-600 animate-spin
Botão:        .btn-loading (spinner inline)
Overlay:      div fixed inset-0 + spinner centralizado
```

**Regra:** toda operação assíncrona (fetch, submit, upload) deve ter loading state visível.

---

## 7. PADRÕES DE INTERAÇÃO

### 7.1 Formulários

1. Validação inline (não apenas ao submeter)
2. Erro exibido abaixo do campo com `.input-error-msg`
3. Botão de submit em loading enquanto processa
4. Modal de sucesso ou toast ao completar

### 7.2 Exclusão

```
Fluxo obrigatório:
1. Usuário clica "Excluir"
2. Modal de confirmação (modal-sm) com:
   - Ícone de danger
   - Mensagem clara: "Tem certeza que deseja excluir [item]?"
   - Botão "Cancelar" (btn-outline)
   - Botão "Excluir" (btn-danger) → loading ao confirmar
3. Toast de sucesso após exclusão
4. Lista atualizada sem recarregar a página
```

### 7.3 Navegação

- Sidebar fixa no desktop, drawer no mobile
- Breadcrumb em telas de detalhe
- Active state evidente no item de menu atual

---

## 8. RESPONSIVIDADE

| Breakpoint | Largura | Layout |
|---|---|---|
| `sm` | 640px | Mobile landscape |
| `md` | 768px | Tablet |
| `lg` | 1024px | Desktop pequeno |
| `xl` | 1280px | Desktop padrão |
| `2xl` | 1440px | Desktop large |

**Padrão de grid:**
- Mobile:  1 coluna
- Tablet:  2 colunas
- Desktop: 3–4 colunas

**Sidebar:**
- Desktop: fixa, expandida
- Mobile:  drawer/overlay, fechada por padrão

---

## 9. NOMENCLATURA

### Classes CSS

```
Padrão: [componente]-[variante]-[modificador]

✅ btn-primary-lg
✅ card-interactive
✅ input-error
✅ badge-success

❌ blue-button
❌ big-card
❌ error-input-red
```

### Componentes React

```
PascalCase para componentes: Button, InputField, DataTable, ConfirmModal
camelCase para props:        variant, isLoading, onConfirm, hasError
kebab-case para arquivos:    button.tsx, input-field.tsx, data-table.tsx
```

---

## 10. ARQUIVOS DO DESIGN SYSTEM

```
design-system/
├── globals.css          ← tokens CSS + @layer components (classes reutilizáveis)
├── tailwind.config.ts   ← extensão do tema Tailwind
└── DESIGN-SYSTEM.md     ← este documento
```

---

## 11. REGRAS ABSOLUTAS

1. **Nunca** criar cor, sombra ou espaçamento fora dos tokens definidos
2. **Nunca** criar estilo inline (`style={{}}`) para visual (apenas posicionamento dinâmico)
3. **Nunca** duplicar classe de componente — sempre reutilizar
4. **Sempre** usar modal para confirmações e ações destrutivas
5. **Sempre** incluir loading state em operações assíncronas
6. **Sempre** usar a hierarquia correta de botões (primary > outline > ghost)
7. **Sempre** exibir erro inline nos campos, não apenas em alert global
