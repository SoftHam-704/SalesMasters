const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'basesales',
    user: 'postgres',
    password: '@12Pilabo',
});

const createTopClientsFunctionSQL = `
CREATE OR REPLACE FUNCTION get_top_clients(
    p_ano INTEGER,
    p_mes INTEGER DEFAULT NULL,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    cliente_codigo INTEGER,
    cliente_nome VARCHAR,
    total_vendido NUMERIC,
    quantidade_pedidos BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.ped_cliente as cliente_codigo,
        c.cli_nomred as cliente_nome,
        SUM(p.ped_totliq)::NUMERIC as total_vendido,
        COUNT(p.ped_pedido) as quantidade_pedidos
    FROM pedidos p
    INNER JOIN clientes c ON p.ped_cliente = c.cli_codigo
    WHERE 
        p.ped_situacao IN ('P', 'F')
        AND EXTRACT(YEAR FROM p.ped_data) = p_ano
        AND (p_mes IS NULL OR EXTRACT(MONTH FROM p.ped_data) = p_mes)
    GROUP BY p.ped_cliente, c.cli_nomred
    ORDER BY total_vendido DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;
`;

async function createFunction() {
    try {
        await pool.query(createTopClientsFunctionSQL);
        console.log('✅ Função get_top_clients criada com sucesso!');

        // Test the function
        const testResult = await pool.query(
            'SELECT * FROM get_top_clients($1, $2, $3)',
            [2025, null, 10]
        );

        console.log('\n📊 Teste da função (Top 10 Clientes 2025):');
        console.table(testResult.rows);

    } catch (error) {
        console.error('❌ Erro ao criar função:', error);
    } finally {
        await pool.end();
    }
}

createFunction();
