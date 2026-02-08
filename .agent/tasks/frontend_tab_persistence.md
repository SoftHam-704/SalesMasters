---
status: completed
priority: medium
created_at: 2026-01-29
completed_at: 2026-01-30

## ✅ Implementação Realizada
- **Persistência de Estado:** Implementada usando `display: none` para abas inativas.
- **Componentes:**
    - Criado `src/utils/componentMapping.jsx` para mapear rotas -> componentes.
    - Criado `src/components/layout/TabContentManager.jsx` para gerenciar a renderização.
    - Refatorado `App.jsx` para usar o novo gerenciador.

# 🧠 Persistência de Estado nas Abas (Multitarefa)

## 🛑 O Problema
- **Sintoma:** Ao navegar entre as abas internas do sistema (ex: "Clientes" -> "Dashboard"), o estado da aba anterior é perdido.
- **Exemplo Real:**
  1. Usuário filtra Dashboard para "2025".
  2. Abre nova aba "Consulta Clientes".
  3. Ao clicar de volta na aba "Dashboard", o filtro reseta para o ano corrente (padrão) e os dados recarregam.
- **Causa Técnica:** O sistema de roteamento/abas provavelmente está **desmontando** (unmounting) os componentes React ao trocar de aba, destruindo suas variáveis de estado (`useState`).

## 🎯 Objetivo
- Manter o estado (filtros, scroll, formulários preenchidos) de cada aba "viva".
- **CRÍTICO:** Eliminar as requisições desnecessárias ao banco de dados que ocorrem toda vez que o usuário troca de aba (o sistema hoje refaz a consulta "default" ao resetar).

## 🛠️ Plano de Ação

### 1. Análise da Arquitetura de Abas
- Verificar componente `MainLayout` ou `TabManager`.
- Confirmar se está usando renderização condicional que remove do DOM (`{activeTab === 'id' && <Component />}`) ou apenas CSS (`style={{display: activeTab === 'id' ? 'block' : 'none'}}`).

### 2. Estratégias de Solução
- **Opção A (Mais Simples - CSS):** Alterar para `display: none`. Mantém o componente vivo e o estado preservado, mas pode pesar na memória se houver muitas abas pesadas (DOM nodes).
- **Opção B (Global State - Zustand/Context):** Mover os estados críticos (filtros do dashboard, pesquisa de clientes) para um Store Global, persistindo mesmo se o componente desmontar.
- **Opção C (Session Storage):** Salvar filtros no `sessionStorage` no `useEffect` de desmontagem e restaurar na montagem.

### 3. Implementação Recomendada
- Para o Dashboard: Usar um hook personalizado `useDashboardFilters` que sincroniza com um Contexto Global ou Storage.
- Para Telas de Consulta: Verificar viabilidade do estilo `display: none` para evitar refetching desnecessário.
