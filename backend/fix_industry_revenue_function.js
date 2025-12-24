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
        DROP FUNCTION IF EXISTS get_industry_revenue(INTEGER, INTEGER);
        
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
                COALESCE(SUM(p.ped_totliq), 0)::NUMERIC AS total_faturamento
            FROM 
                fornecedores f
            LEFT JOIN 
                pedidos p ON f.for_codigo = p.ped_industria
                AND EXTRACT(YEAR FROM p.ped_data) = p_ano
                AND (p_mes IS NULL OR EXTRACT(MONTH FROM p.ped_data) = p_mes)
                AND p.ped_situacao IN ('P', 'F')
            WHERE 
                f.for_tipo2 = 'A'
            GROUP BY 
                f.for_codigo, f.for_nomered
            HAVING
                COALESCE(SUM(p.ped_totliq), 0) > 0
            ORDER BY 
                total_faturamento DESC
            LIMIT 10;
        END;
        $$ LANGUAGE plpgsql;
    `;

    try {
        await pool.query(sql);
        console.log('✓ Function get_industry_revenue created successfully');
        
        // Test the function
        console.log('\nTesting function with ano=2025...');
        const testResult = await pool.query('SELECT * FROM get_industry_revenue(2025, NULL)');
        console.log(`✓ Function returned ${testResult.rows.length} industries`);
        if (testResult.rows.length > 0) {
            console.log('\nTop 3 industries:');
            console.table(testResult.rows.slice(0, 3));
        }
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating function:', error);
        process.exit(1);
    }
}

createFunction();
