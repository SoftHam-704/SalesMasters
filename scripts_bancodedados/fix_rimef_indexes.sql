-- ============================================================================
-- SCRIPT DE CORREÇÃO - ÍNDICES E PRIMARY KEYS PARA SCHEMA RIMEF
-- Execute após analisar o resultado de analyze_rimef_performance.sql
-- Database: basesales | Schema: rimef
-- ============================================================================

-- INÍCIO DA TRANSAÇÃO (permite rollback em caso de erro)
BEGIN;

-- ============================================================================
-- PARTE 1: ADICIONAR PRIMARY KEYS FALTANTES
-- ============================================================================

-- Tabela AREA_ATU (se tiver coluna identificadora)
-- ALTER TABLE rimef.area_atu ADD PRIMARY KEY (are_codigo);

-- Tabela USER_MENU_SUPERIOR (se tiver coluna identificadora)
-- ALTER TABLE rimef.user_menu_superior ADD PRIMARY KEY (id);

-- Tabela VENDEDOR_REG (se tiver coluna identificadora)
-- ALTER TABLE rimef.vendedor_reg ADD PRIMARY KEY (vrg_codigo);

-- Tabela GRUPOS (se tiver coluna identificadora)
-- ALTER TABLE rimef.grupos ADD PRIMARY KEY (gru_codigo);

-- ============================================================================
-- PARTE 2: CRIAR ÍNDICES PARA TABELAS PRINCIPAIS
-- ============================================================================

-- PEDIDOS - Índices críticos para consultas de vendas
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_rimef_pedidos_industria 
    ON rimef.pedidos(ped_industria);

CREATE INDEX IF NOT EXISTS idx_rimef_pedidos_cliente 
    ON rimef.pedidos(ped_cliente);

CREATE INDEX IF NOT EXISTS idx_rimef_pedidos_data 
    ON rimef.pedidos(ped_data);

CREATE INDEX IF NOT EXISTS idx_rimef_pedidos_situacao 
    ON rimef.pedidos(ped_situacao);

CREATE INDEX IF NOT EXISTS idx_rimef_pedidos_vendedor 
    ON rimef.pedidos(ped_vendedor);

-- Índice composto para consulta principal (indústria + data + situação)
CREATE INDEX IF NOT EXISTS idx_rimef_pedidos_ind_data_sit 
    ON rimef.pedidos(ped_industria, ped_data DESC, ped_situacao);

-- Índice composto para relatórios por cliente
CREATE INDEX IF NOT EXISTS idx_rimef_pedidos_cli_ind_data 
    ON rimef.pedidos(ped_cliente, ped_industria, ped_data DESC);


-- ITENS_PED - Índices para itens de pedido
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_rimef_itens_pedido 
    ON rimef.itens_ped(ite_pedido);

CREATE INDEX IF NOT EXISTS idx_rimef_itens_industria 
    ON rimef.itens_ped(ite_industria);

CREATE INDEX IF NOT EXISTS idx_rimef_itens_produto 
    ON rimef.itens_ped(ite_produto);

-- Índice composto para buscar itens de um pedido específico
CREATE INDEX IF NOT EXISTS idx_rimef_itens_ped_ind 
    ON rimef.itens_ped(ite_pedido, ite_industria);


-- CLIENTES - Índices para consultas de clientes
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_rimef_clientes_cnpj 
    ON rimef.clientes(cli_cnpj);

CREATE INDEX IF NOT EXISTS idx_rimef_clientes_industria 
    ON rimef.clientes(cli_industria);

CREATE INDEX IF NOT EXISTS idx_rimef_clientes_vendedor 
    ON rimef.clientes(cli_vendedor);

CREATE INDEX IF NOT EXISTS idx_rimef_clientes_cidade 
    ON rimef.clientes(cli_cidade);

CREATE INDEX IF NOT EXISTS idx_rimef_clientes_status 
    ON rimef.clientes(cli_status);

-- Índice para busca por nome (parcial, case insensitive)
CREATE INDEX IF NOT EXISTS idx_rimef_clientes_nome 
    ON rimef.clientes(LOWER(cli_nome));


-- VENDEDORES - Índices
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_rimef_vendedores_codigo 
    ON rimef.vendedores(ven_codigo);


-- FORNECEDORES - Índices
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_rimef_fornecedores_codigo 
    ON rimef.fornecedores(for_codigo);


-- TRANSPORTADORA - Índices
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_rimef_transportadora_codigo 
    ON rimef.transportadora(tra_codigo);


-- ============================================================================
-- PARTE 3: CRIAR SEQUENCES (GENERATORS) NO SCHEMA RIMEF
-- (Apenas se necessário - verifique se as tabelas usam auto-increment)
-- ============================================================================

-- Verificar se as sequences já existem antes de criar
DO $$
BEGIN
    -- Sequence para pedidos
    IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'rimef' AND sequencename = 'gen_pedidos_id') THEN
        CREATE SEQUENCE rimef.gen_pedidos_id START WITH 1 INCREMENT BY 1;
    END IF;
    
    -- Sequence para itens
    IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'rimef' AND sequencename = 'gen_itens_ped_id') THEN
        CREATE SEQUENCE rimef.gen_itens_ped_id START WITH 1 INCREMENT BY 1;
    END IF;
    
    -- Sequence para clientes
    IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'rimef' AND sequencename = 'gen_clientes_id') THEN
        CREATE SEQUENCE rimef.gen_clientes_id START WITH 1 INCREMENT BY 1;
    END IF;
END $$;


-- ============================================================================
-- PARTE 4: EXECUTAR ANALYZE NAS TABELAS (ATUALIZA ESTATÍSTICAS)
-- ============================================================================

ANALYZE rimef.pedidos;
ANALYZE rimef.itens_ped;
ANALYZE rimef.clientes;
ANALYZE rimef.vendedores;
ANALYZE rimef.fornecedores;
ANALYZE rimef.transportadora;


-- ============================================================================
-- PARTE 5: VACUUM (LIMPEZA DE REGISTROS MORTOS)
-- NOTA: VACUUM não pode rodar dentro de transação, execute separadamente!
-- ============================================================================

-- Execute estes comandos FORA da transação (após o COMMIT):
-- VACUUM ANALYZE rimef.pedidos;
-- VACUUM ANALYZE rimef.itens_ped;
-- VACUUM ANALYZE rimef.clientes;


-- ============================================================================
-- CONFIRMAR ALTERAÇÕES
-- ============================================================================
COMMIT;

-- ============================================================================
-- VERIFICAÇÃO PÓS-EXECUÇÃO
-- ============================================================================

-- Verificar índices criados
SELECT 
    i.tablename as "Tabela",
    i.indexname as "Indice",
    pg_size_pretty(pg_relation_size(quote_ident(i.schemaname) || '.' || quote_ident(i.indexname))) as "Tamanho"
FROM pg_indexes i
WHERE i.schemaname = 'rimef'
ORDER BY i.tablename, i.indexname;

-- Verificar se há tabelas ainda sem índices
SELECT t.table_name as "Tabelas ainda SEM Indices"
FROM information_schema.tables t
WHERE t.table_schema = 'rimef' 
AND t.table_type = 'BASE TABLE'
AND NOT EXISTS (
    SELECT 1 FROM pg_indexes i 
    WHERE i.schemaname = 'rimef' AND i.tablename = t.table_name
);

SELECT 'SCRIPT DE CORREÇÃO EXECUTADO COM SUCESSO!' as resultado;
