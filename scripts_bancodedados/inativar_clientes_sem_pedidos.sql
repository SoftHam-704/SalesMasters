-- Script para inativar clientes que não possuem pedidos
-- Schema: rimef
-- Data: 16/01/2026

BEGIN;

DO $$
DECLARE
    v_total_clientes INTEGER;
    v_clientes_sem_pedidos INTEGER;
BEGIN
    -- 1. Contar total de clientes antes
    SELECT COUNT(*) INTO v_total_clientes FROM rimef.clientes;
    
    -- 2. Contar quantos serão afetados
    SELECT COUNT(*) INTO v_clientes_sem_pedidos 
    FROM rimef.clientes c
    WHERE NOT EXISTS (
        SELECT 1 
        FROM rimef.pedidos p 
        WHERE p.ped_cliente = c.cli_codigo
    );

    RAISE NOTICE 'Total de Clientes: %', v_total_clientes;
    RAISE NOTICE 'Clientes sem pedidos a inativar: %', v_clientes_sem_pedidos;

    -- 3. Executar a atualização
    UPDATE rimef.clientes
    SET cli_tipopes = 'I'
    WHERE NOT EXISTS (
        SELECT 1 
        FROM rimef.pedidos p 
        WHERE p.ped_cliente = cli_codigo
    );

    RAISE NOTICE 'Atualização concluída com sucesso.';
END $$;

COMMIT;

-- Verificação pós-execução
-- SELECT count(*) as inativos FROM rimef.clientes WHERE cli_tipopes = 'I';
