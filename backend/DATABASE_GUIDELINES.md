# Diretrizes de Gerenciamento de Banco de Dados Multi-Tenant
> Data de Criação: 29/01/2026

## 1. Princípio Fundamental: Paridade do Schema Public
O schema `public` atua como o **Master Template** para todos os novos clientes (tenants) e como referência de integridade para o sistema.

**Regra:** 
> "Qualquer alteração feita em um schema de cliente (ex: `repsoma`) DEVE ser replicada no `public`."

### Motivação
- Se corrigirmos um bug ou melhorarmos a performance para um cliente, todos devem se beneficiar.
- A criação de novos tenants copia a estrutura do `public`. Se o `public` estiver desatualizado, novos clientes nascem com código "velho" e bugs já resolvidos.

## 2. Otimizações de BI (Case Repsoma)
Durante a otimização do BI-Engine (Jan/2026), identificamos melhorias críticas que devem ser padrão:

### A. Otimização de Performance
- **Sintoma:** Queries do dashboard levavam >5s em grandes bases.
- **Solução:**
    1. Criação de Views Materializadas ou Views Otimizadas locais (`vw_performance_mensal`, `vw_metricas_cliente`).
    2. Uso de `ANALYZE` nas tabelas principais (`pedidos`, `itens_ped`) periodicamente.
    3. Criação de índices específicos em colunas de filtro (`ped_data`, `ped_industria`, `ped_situacao`).

### B. Integridade de Dados
- **Normalização de Produtos:** 
    - A coluna `itens_ped.ite_codigonormalizado` deve ser populada.
    - A coluna `itens_ped.ite_idproduto` deve ser vinculada à tabela `cad_prod` para permitir categorização (Curva ABC).
- **Cascata de Exclusão:**
    - A relação entre `itens_ped` e `pedidos` deve ter `ON DELETE CASCADE` para evitar itens órfãos.

## 3. Procedimento de Update (Script Referência)
Use o script padrão localizado em `backend/sql/apply_bi_fix_all_schemas.sql` para propagar mudanças.

```sql
-- Exemplo de Loop seguro para updates
DO $$
DECLARE r RECORD;
BEGIN
    FOR r IN SELECT nspname FROM pg_namespace WHERE nspname NOT IN ('information_schema', ...) LOOP
        -- Executar update dinâmico
        EXECUTE format('CREATE VIEW %I.minha_view AS ...', r.nspname);
    END LOOP;
END;
$$;
```
