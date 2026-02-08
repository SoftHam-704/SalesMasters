
const { Pool } = require('pg');
require('dotenv').config({ path: './backend/.env' });

async function createTenantViews() {
    const pool = new Pool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: 'basesales',
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        statement_timeout: 30000
    });

    try {
        console.log('--- Criando Views de Performance no Schema repsoma ---');

        // 1. vw_performance_mensal
        await pool.query(`
            CREATE OR REPLACE VIEW repsoma.vw_performance_mensal AS
            SELECT 
                EXTRACT(year FROM ped_data) AS ano,
                EXTRACT(month FROM ped_data) AS mes,
                ped_industria AS industry_id,
                sum(ped_totliq) AS valor_total,
                count(DISTINCT ped_numero) AS qtd_pedidos,
                count(DISTINCT ped_cliente) AS clientes_ativos,
                avg(ped_totliq) AS ticket_medio
            FROM repsoma.pedidos
            WHERE ped_situacao IN ('P', 'F')
            GROUP BY (EXTRACT(year FROM ped_data)), (EXTRACT(month FROM ped_data)), ped_industria;
        `);
        console.log('✅ View vw_performance_mensal criada em repsoma.');

        // 2. vw_metricas_cliente
        await pool.query(`
            CREATE OR REPLACE VIEW repsoma.vw_metricas_cliente AS
            SELECT 
                p.ped_cliente AS cliente_id,
                c.cli_nomred AS cliente_nome,
                p.ped_industria AS industry_id,
                (CURRENT_DATE - max(p.ped_data)) AS dias_sem_compra,
                sum(p.ped_totliq) AS valor_total,
                count(p.ped_numero) AS total_pedidos,
                avg(p.ped_totliq) AS ticket_medio
            FROM repsoma.pedidos p
            JOIN public.clientes c ON p.ped_cliente = c.cli_codigo
            WHERE p.ped_situacao IN ('P', 'F')
            GROUP BY p.ped_cliente, c.cli_nomred, p.ped_industria;
        `);
        console.log('✅ View vw_metricas_cliente criada em repsoma.');

        // 3. Otimização (Analyze)
        // console.log('--- Executando ANALYZE para otimizar o planner ---');
        // await pool.query('ANALYZE repsoma.pedidos');
        // await pool.query('ANALYZE repsoma.itens_ped');
        // console.log('✅ ANALYZE concluído.');

    } catch (err) {
        console.error('❌ Erro:', err.message);
    } finally {
        await pool.end();
    }
}

createTenantViews();
