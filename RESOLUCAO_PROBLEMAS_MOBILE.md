# Guia de Resolução: Problemas na Finalização de Pedido Mobile

Este documento descreve as causas e soluções para os erros encontrados na finalização de pedidos, para auxiliar no desenvolvimento e debugging.

## 1. Contexto do Erro

**Sintomas:**
1. Erro visual no mobile: `"Error: Não foi possível gerar um número para o pedido. Tente novamente."`
2. Erro no console do navegador (DevTools): `Failed to load resource: the server responded with a status of 500 (...) /api/mobile/v2/carriers`
3. A tela de "Revisão Final" carrega parcialmente, mas falha ao finalizar.

---

## 2. Diagnóstico e Soluções

### Problema A: Erro 500 em /v2/carriers (Transportadoras)

**Causa Raiz:**
O endpoint `/api/mobile/v2/carriers` está tentando acessar uma tabela ou coluna que não existe ou está incorreta no banco de dados.

1. **Inconsistência de Tabela:** O código em `mobile_endpoints.js` faz uma query na tabela `transportadoras` (plural). O script de criação do banco (`05_create_supporting_tables_part1.sql`) cria a tabela `transportadora` (singular).
2. **Inconsistência de Coluna:** O código filtra por `WHERE tra_status = 'A'`. A tabela `transportadora` **não possui** a coluna `tra_status`.

**Solução (Código):**
Edite o arquivo `backend/mobile_endpoints.js` (aprox. linha 312):

**De (Incorreto):**
```javascript
let query = `
    SELECT tra_codigo, tra_nome
    FROM transportadoras
    WHERE tra_status = 'A'
`;
```

**Para (Correto):**
```javascript
let query = `
    SELECT tra_codigo, tra_nome
    FROM transportadora
`; 
// Removida condição da coluna 'tra_status' que não existe e corrigido nome da tabela
```

> **Nota:** Se a regra de negócio exigir status ativo, será necessário adicionar a coluna `tra_status` via alter table no banco de dados primeiro.

---

### Problema B: Erro na Geração do Número do Pedido

**Causa Raiz:**
A mensagem `"Não foi possível gerar um número para o pedido"` ocorre quando o backend falha ao executar a query de sequence.
O endpoint `GET /api/orders/next-number` executa `SELECT nextval('gen_pedidos_id')`.
Se a sequence `gen_pedidos_id` não existir no banco de dados do cliente/tenant atual, a query falha com erro 500.

**Solução (Banco de Dados):**
Execute o seguinte SQL no banco de dados onde o erro ocorre:

```sql
CREATE SEQUENCE gen_pedidos_id START WITH 1 INCREMENT BY 1;
COMMENT ON SEQUENCE gen_pedidos_id IS 'Sequence para tabela PEDIDOS';
```

---

## 3. Passo a Passo para Aplicação da Correção

1.  **Backend:**
    *   Abra `backend/mobile_endpoints.js`.
    *   Localize a rota `/v2/carriers`.
    *   Corrija o nome da tabela para `transportadora`.
    *   Remova a cláusula `WHERE tra_status = 'A'`.
    *   O endpoint deve ficar assim:
        ```javascript
        router.get('/v2/carriers', async (req, res) => {
             try {
                 const { pesquisa } = req.query;
                 let query = `SELECT tra_codigo, tra_nome FROM transportadora WHERE 1=1 `;
                 const params = [];
                 if (pesquisa) {
                     params.push(`%${pesquisa}%`);
                     query += ` AND tra_nome ILIKE $1`;
                 }
                 query += ` ORDER BY tra_nome LIMIT 50`;
                 // ... restante do código
        ```

2.  **Banco de Dados:**
    *   Acesse o banco de dados via ferramenta de gestão (DBeaver, pgAdmin, etc.).
    *   Verifique se a sequence `gen_pedidos_id` existe. Se não, crie-a.
    *   Verifique se a tabela `transportadora` existe.

3.  **Reiniciar Aplicação:**
    *   Após alterar o código JS, reinicie o servidor backend (`npm start` ou `rs` se usar nodemon, ou via PM2).

## 4. Prevenção Futura

*   Certifique-se de que todos os scripts de migração em `backend/scripts_bancodedados/` foram executados no ambiente de produção/SaveInCloud.
*   Verifique o arquivo `02_create_sequences.sql` e `05_create_supporting_tables_part1.sql` para garantir que a estrutura base está correta.
