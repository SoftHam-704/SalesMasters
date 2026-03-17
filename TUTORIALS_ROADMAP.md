# 🎬 Tutorial System Roadmap - SalesMasters 2026

Este documento rastreia a criação, gravação e integração dos vídeos tutoriais do sistema. Os vídeos serão hospedados no YouTube e linkados contextualmente dentro do SalesMasters.

---

## 🏗️ Estrutura Técnica (Status)

- [x] **Banco de Dados:** Tabela `config_tutoriais` (para armazenar Links e IDs de Rota/Módulo)
- [x] **Backend:** API `/api/config/tutorials/:route` para buscar vídeo contextual
- [x] **Frontend Component:** `<HelpVideoModal />` (Player flutuante premium)
- [x] **Frontend Trigger:** Botão flutuante de Ajuda ou Ícone de "Play" no Header
- [x] **Central de Vídeos:** Criada em `Utilitários > Central de Vídeos` para acesso privado.

---

## 🚀 Vídeo de Apresentação (60s)
- [ ] Gravação da Demo Geral (Roteiro em `RECORDING_SCRIPT.md`)
- [ ] Edição básica e Upload no YouTube (Unlisted)
- [ ] Cadastro no Banco de Dados (Schema Master/Tenants)

---

## 📺 Lista de Reprodução (Prioridades)

### Fase 1: Core & Projetos (Atuais)
| Rotina | Rota | Vídeo ID (YouTube) | Status | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| Console de Projetos | `/projetos/console` | - | 📝 Pendente | Tutorial completo de briefing técnico e lançamento de projetos. |
| Pedidos de Venda | `/pedidos` | - | 📝 Pendente | Fluxo de criação, seleção de itens e sincronização. |
| Dashboard Master | `/` | - | 📝 Pendente | Visão geral dos indicadores e filtros de BI. |
| CRM Interativo | `/crm` | - | 📝 Pendente | Registro de interações e pipeline de vendas. |
| Cadastro Indústria | `/suppliers` | - | 📝 Pendente | Metas, contatos e política comercial. |

---

## 📝 Scripts de Gravação (Em Elaboração)

### 1. Tutorial Console de Projetos
- **Cena 1**: Acesso ao menu "Console de Projetos MASTER"
- **Cena 2**: Início de "Novo Lançamento"
- **Cena 3**: Busca por cliente real
- **Cena 4**: Preenchimento de dados técnicos (Área, Pé-direito)
- **Cena 5**: Salvamento e verificação do ID gerado

---

## 🛠️ Como Adicionar Novos Vídeos
1. Suba o vídeo no YouTube (Não listado ou Público).
2. Adicione uma entrada na tabela `config_tutoriais` via Admin ou script SQL.
3. O ícone de ajuda aparecerá automaticamente na rora correspondente.
