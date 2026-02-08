# 📱 Especificação Técnica: Implementação da Agenda (Mobile)
**Versão:** 1.0 (Fevereiro/2026)
**Contexto:** SalesMaster Pro - Sincronização Multi-Tenant

---

## 1. Arquitetura de Dados e Autenticação

A agenda opera sobre o **Banco Master** (PostgreSQL), garantindo que um vendedor veja seus dados independente de qual instância ele acesse. O acesso é filtrado por **Contexto de Segurança** enviado via Headers.

### Fluxo de Autenticação Inicial
Ao realizar o login via `/api/auth/master-login`, o App **DEVE** armazenar o objeto de usuário completo.
**Campos Críticos:**
- `user.id`: ID único do vendedor (usado no header `x-user-id`).
- `user.empresa_id` (novo): ID da empresa vinculada (usado no header `x-empresa-id`).

---

## 2. Padrão de Comunicação (Headers)

Todas as requisições para a Agenda **DEVEM** incluir obrigatoriamente:

```http
Content-Type: application/json
x-access-token: [TOKEN_JWT_AQUI]
x-user-id: [O_ID_DO_USUARIO]
x-empresa-id: [O_ID_DA_EMPRESA]
```

---

## 3. Endpoints da API (Backend Node.js)

URL Base: `https://salesmasters.softham.com.br/api/agenda`

### A. Resumo para Dashboard (Home do App)
Retorna os contadores para os cards de status.
- **Rota:** `GET /resumo`
- **Retorno:** `{ success: true, hoje: 5, atrasadas: 2, concluidas: 10 }`

### B. Listagem de Tarefas
Filtra por período. Ideal para visualização em Lista ou Calendário.
- **Rota:** `GET /?data_inicio=YYYY-MM-DD&data_fim=YYYY-MM-DD`
- **Parâmetros Sugeridos:**
  - `visualizacao`: `lista`, `dia`, `semana` ou `mes` (opcional).
  - `status`: `pendente` ou `concluida` (opcional).

### C. Criação / Atualização
- **Rota:** `POST /` (Criação) ou `PUT /:id` (Edição)
- **Carga Útil (JSON):**
```json
{
  "titulo": "Reunião de Vendas",
  "descricao": "Apresentação dos resultados trimestrais",
  "tipo": "reuniao",
  "data_inicio": "2026-02-10",
  "hora_inicio": "09:00",
  "prioridade": "A",
  "lembrete_ativo": true,
  "lembrete_antes": 15
}
```

---

## 4. Tipos de Atividades e Identidade Visual (Enums)

Para manter a consistência com o Web, use estes tipos:

| Tipo | Ícone Sugerido | Cor Hex (Light Mode) |
| :--- | :--- | :--- |
| **tarefa** | CheckCircle | #059669 (Emerald) |
| **lembrete** | Bell | #D97706 (Amber) |
| **visita** | MapPin | #2563EB (Blue) |
| **ligacao** | Phone | #7C3AED (Violet) |
| **reuniao** | Users | #0891B2 (Cyan) |
| **followup** | RefreshCw | #EA580C (Orange) |

---

## 5. Lógica de Negócio e "Gotchas"

1. **Formato de Data:** O campo de data (`data_inicio`) deve trafegar no formato `YYYY-MM-DD`. Nunca envie formatos regionais (DD/MM/AAAA) para o backend.
2. **Prioridades:** O sistema usa os códigos `A` (Alta), `M` (Média) e `B` (Baixa).
3. **Sincronização Offline:** Como é uma agenda de vendas, o ideal é que o App faça cache local do `GET /resumo` para que o vendedor veja suas pendências mesmo com sinal fraco.
4. **Resolução de Usuário:** Se no retorno do login o `empresa_id` vier nulo (padrão antigo), o App deve assumir `1` como fallback, mas o ideal é atualizar o cadastro no Master DB.

---

## 6. Checklist de Implementação Mobile

- [ ] Tela de Login capturando e salvando `empresa_id`.
- [ ] Interceptor de Redes adicionando os headers `x-user-id` e `x-empresa-id`.
- [ ] Widget de "Status Hoje" na Home chamando o `/resumo`.
- [ ] Tela de Lista com agrupamento por data (Sticky Headers).
- [ ] Modal de cadastro com validação de campos obrigatórios (Título e Data).

---
*Gerado por Antigravity AI - SalesMaster Technical Team*
