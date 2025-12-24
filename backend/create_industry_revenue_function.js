const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function createFunction() {
    const sql = `
        CREATE OR REPLACE FUNCTION get_industry_revenue(
            p_ano INTEGER,
            p_mes INTEGER DEFAULT NULL
        )
        RETURNS TABLE (
            industria_id INTEGER,
            industria_nome VARCHAR,
            total_faturamento NUMERIC
        ) AS $$
        BEGIN
            RETURN QUERY
            SELECT 
                f.for_codigo AS industria_id,
                f.for_nomered AS industria_nome,
                COALESCE(SUM(p.ped_totliq), 0) AS total_faturamento
            FROM 
                fornecedores f
            LEFT JOIN 
                pedidos p ON f.for_codigo = p.ped_industria
                AND EXTRACT(YEAR FROM p.ped_data) = p_ano
                AND (p_mes IS NULL OR EXTRACT(MONTH FROM p.ped_data) = p_mes)
                AND p.ped_situacao IN ('P', 'F')
            WHERE 
                f.tipo_tipo2 = 'A'
            GROUP BY 
                f.for_codigo, f.for_nomered
            ORDER BY 
                total_faturamento DESC;
        END;
        $$ LANGUAGE plpgsql;
    `;

    try {
        await pool.query(sql);
        console.log('✓ Function get_industry_revenue created successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error creating function:', error);
        process.exit(1);
    }
}

createFunction();
