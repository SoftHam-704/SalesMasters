const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'basesales',
    user: 'postgres',
    password: '@12Pilabo',
});

async function createFunction() {
    const client = await pool.connect();
    try {
        console.log('🚀 [DATABASE] Creating get_orders_stats function (OPTIMIZED)...');

        const sql = `
            CREATE OR REPLACE FUNCTION get_orders_stats(
                p_data_inicio DATE,
                p_data_fim DATE,
                p_industria INTEGER DEFAULT NULL
            )
            RETURNS TABLE (
                total_vendido NUMERIC,
                total_quantidade NUMERIC,
                total_clientes BIGINT,
                ticket_medio NUMERIC
            ) AS $$
            BEGIN
                RETURN QUERY
                WITH pedidos_filtrados AS (
                    -- Filtra pedidos P ou F no período
                    SELECT 
                        p.ped_pedido,
                        p.ped_cliente,
                        p.ped_totliq
                    FROM pedidos p
                    WHERE p.ped_data BETWEEN p_data_inicio AND p_data_fim
                      AND (p.ped_situacao = 'P' OR p.ped_situacao = 'F')
                      AND (p_industria IS NULL OR p.ped_industria = p_industria)
                ),
                quantidades AS (
                    -- Agrega quantidades por pedido
                    SELECT 
                        i.ite_pedido,
                        SUM(i.ite_quant) as total_quant_pedido
                    FROM itens_ped i
                    WHERE EXISTS (
                        SELECT 1 FROM pedidos_filtrados pf 
                        WHERE pf.ped_pedido = i.ite_pedido
                    )
                    GROUP BY i.ite_pedido
                )
                SELECT 
                    COALESCE(SUM(pf.ped_totliq), 0)::NUMERIC as total_vendido,
                    COALESCE(SUM(q.total_quant_pedido), 0)::NUMERIC as total_quantidade,
                    COUNT(DISTINCT pf.ped_cliente)::BIGINT as total_clientes,
                    CASE 
                        WHEN COUNT(DISTINCT pf.ped_cliente) > 0 
                        THEN (COALESCE(SUM(pf.ped_totliq), 0) / COUNT(DISTINCT pf.ped_cliente))::NUMERIC
                        ELSE 0::NUMERIC
                    END as ticket_medio
                FROM pedidos_filtrados pf
                LEFT JOIN quantidades q ON pf.ped_pedido = q.ite_pedido;
            END;
            $$ LANGUAGE plpgsql;
        `;

        await client.query(sql);
        console.log('✅ [DATABASE] Function created successfully (OPTIMIZED VERSION)!');

    } catch (error) {
        console.error('❌ [DATABASE] Error creating function:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

createFunction();
