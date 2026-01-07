# 🏆 PLANO: SALESMASTERS ARENA (GAMIFICAÇÃO GLOBAL)

**Objetivo:** Permitir competições entre usuários de diferentes empresas/schemas, aproveitando a infraestrutura compartilhada no PostgreSQL.

## 1. Arquitetura de Dados

Como todos os dados estarão no mesmo servidor PostgreSQL (SaveInCloud), usaremos o banco `salesmasters_master` (ou um schema `public` no `basesales`) para centralizar os recordes. Isso garante que os dados de jogos sejam públicos, enquanto os dados financeiros/vendas permanecem isolados nos schemas individuais.

### Tabela Global: `game_leaderboard`
Localização sugerida: Banco `salesmasters_master` (schema `public`)

```sql
CREATE TABLE game_leaderboard (
    id SERIAL PRIMARY KEY,
    game_type VARCHAR(20) NOT NULL, -- 'tetris', 'dice', etc.
    user_name VARCHAR(100) NOT NULL,
    company_name VARCHAR(100) NOT NULL, -- Para exibir "João (Empresa X)"
    score INTEGER NOT NULL,
    played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX idx_game_score ON game_leaderboard(game_type, score DESC);
```

## 2. Fluxo de Integração

### Backend (Node.js)
Criar novos endpoints globais em `server.js` (ou novo arquivo `games_endpoints.js`):

1.  **POST `/api/games/score`**
    *   Recebe: `{ game: 'tetris', score: 15000 }`
    *   Ação: Verifica quem é o usuário logado (via token), pega o nome e empresa, e salva no `salesmasters_master`.
    *   Lógica: Só salva se for maior que o recorde pessoal anterior (opcional).

2.  **GET `/api/games/leaderboard/:game`**
    *   Retorna: Top 10 ou 20 jogadores globais.
    *   Exemplo:
        ```json
        [
          { "rank": 1, "name": "Maria", "company": "Empresa A", "score": 15000 },
          { "rank": 2, "name": "Carlos", "company": "Empresa B", "score": 14200 }
        ]
        ```

### Frontend (React)
Atualizar os componentes `TetrisGame.jsx` e `DiceGame.jsx`:

1.  **Ao finalizar jogo:**
    *   Enviar score automaticamente para API.
    *   Exibir confete/aviso se entrou no Top 10 Global.

2.  **Visualização:**
    *   Adicionar aba "Ranking Global" ao lado do jogo.
    *   Mostrar posição atual do usuário.

## 3. Segurança & Isolamento

*   **Regra de Ouro:** A conexão para games **NUNCA** acessa as tabelas de pedidos/clientes. Ela apenas escreve na tabela de `game_leaderboard`.
*   A "visibilidade" é controlada apenas para os campos de Nome e Empresa. Nenhum dado sensível (faturamento, margem) é compartilhado.

## 4. Próximos Passos (Para Amanhã)

1.  [ ] Configurar deploy na SaveInCloud (Frontend + Backend).
2.  [ ] Criar tabela `game_leaderboard` no banco Master.
3.  [ ] Implementar endpoints da API de jogos.
4.  [ ] Conectar o Tetris e Dados ao Ranking Global.

---
*Documento gerado em 06/01/2026 para planejamento futuro.*
