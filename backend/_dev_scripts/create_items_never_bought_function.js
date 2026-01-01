const { Pool } = require('pg');
require('dotenv').config();

console.log("DB URL exists?", !!process.env.DATABASE_URL);

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function createFunctions() {
    let client;
    try {
        console.log("Connecting to pool...");
        client = await pool.connect();
        console.log("Connected. Creating function...");

        await client.query(`
            CREATE OR REPLACE FUNCTION fn_itens_nunca_comprados(
                p_industria INTEGER,
                p_cliente INTEGER
            )
            RETURNS TABLE (
                codigo VARCHAR,
                descricao VARCHAR,
                aplicacao VARCHAR
            ) AS $$
            BEGIN
                RETURN QUERY
                SELECT
                    p.pro_codprod::VARCHAR AS codigo,
                    p.pro_nome::VARCHAR AS descricao,
                    COALESCE(p.pro_aplicacao, '')::VARCHAR AS aplicacao
                FROM cad_prod p
                WHERE p.pro_industria = p_industria
                AND p.pro_status = 'A'
                AND NOT EXISTS (
                    SELECT 1
                    FROM itens_ped ip
                    JOIN pedidos ped ON ip.ite_pedido = ped.ped_pedido
                    WHERE ip.ite_produto = p.pro_codprod
                    AND ped.ped_cliente = p_cliente
                    and ped.ped_industria = p_industria
                    AND ped.ped_situacao != 'C'
                )
                ORDER BY p.pro_codprod;
            END;
            $$ LANGUAGE plpgsql;
        `);

        console.log('Função fn_itens_nunca_comprados criada com sucesso!');
    } catch (error) {
        console.error('Erro ao criar função:', error);
    } finally {
        if (client) client.release();
        await pool.end();
    }
}

createFunctions();
