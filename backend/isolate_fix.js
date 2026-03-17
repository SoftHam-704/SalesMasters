const { Pool } = require('pg');
require('dotenv').config({ path: 'e:/Sistemas_ia/SalesMasters/backend/.env' });

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: 'basesales',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: false
});

async function isolateError() {
    const v_curr_start = '2026-01-01';
    const v_curr_end = '2026-12-31';

    const tests = [
        {
            name: "Part 1: Mix Penetration - total_catalog",
            query: "SELECT COUNT(*)::INTEGER as total FROM public.cad_prod WHERE (NULL IS NULL OR pro_industria = NULL)"
        },
        {
            name: "Part 1: Mix Penetration - sold_catalog",
            query: `SELECT COUNT(DISTINCT i.ite_idproduto)::INTEGER as sold
                    FROM public.itens_ped i
                    JOIN public.pedidos p ON p.ped_pedido = i.ite_pedido AND p.ped_industria = i.ite_industria
                    WHERE p.ped_data >= '${v_curr_start}' AND p.ped_data <= '${v_curr_end}'
                      AND p.ped_situacao IN ('P', 'F')`
        },
        {
            name: "Part 2: Ativacao",
            query: `SELECT COUNT(DISTINCT ped_cliente)::INTEGER as ativos
                    FROM public.pedidos 
                    WHERE ped_data >= '${v_curr_start}' AND ped_data <= '${v_curr_end}' 
                      AND ped_situacao IN ('P', 'F')`
        },
        {
            name: "Part 3: Saúde - Recuperados",
            query: `SELECT COUNT(DISTINCT p.ped_cliente)::INTEGER
                    FROM public.pedidos p
                    WHERE p.ped_data >= '${v_curr_start}' AND p.ped_data <= '${v_curr_end}'
                      AND p.ped_situacao IN ('P', 'F')
                      AND NOT EXISTS (
                          SELECT 1 FROM public.pedidos p2 
                          WHERE p2.ped_cliente = p.ped_cliente 
                            AND p2.ped_data >= '${v_curr_start}'::DATE - INTERVAL '4 months' 
                            AND p2.ped_data < '${v_curr_start}'::DATE
                      )`
        },
        {
            name: "Part 4: Top SKUs",
            query: `SELECT 
                        COALESCE(pr.pro_nome, 'SKU ' || i.ite_idproduto)::TEXT as name,
                        SUM(i.ite_quant)::NUMERIC as value
                    FROM public.itens_ped i
                    JOIN public.pedidos p ON p.ped_pedido = i.ite_pedido AND p.ped_industria = i.ite_industria
                    LEFT JOIN public.cad_prod pr ON pr.pro_id = i.ite_idproduto
                    WHERE p.ped_data >= '${v_curr_start}' AND p.ped_data <= '${v_curr_end}'
                      AND p.ped_situacao IN ('P', 'F')
                    GROUP BY 1
                    ORDER BY 2 DESC
                    LIMIT 5`
        }
    ];

    for (const test of tests) {
        try {
            console.log(`🔍 Testing ${test.name}...`);
            await pool.query(test.query);
            console.log(`✅ Success: ${test.name}`);
        } catch (err) {
            console.error(`❌ Error in ${test.name}:`, err.message);
        }
    }
    await pool.end();
}

isolateError();
