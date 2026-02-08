
const { Pool } = require('pg');

const connectionString = 'postgresql://webadmin:ytAyO0u043@node254557-salesmaster.sp1.br.saveincloud.net.br:13062/basesales';

const pool = new Pool({
    connectionString,
});

async function runTest() {
    const client = await pool.connect();
    try {
        console.log("--- TESTANDO QUERY DE RELATÓRIO (NODE.JS) ---");

        // 1. Set Schema
        // In the real app, this is set by middleware via search_path
        await client.query("SET search_path TO ndsrep, public");

        console.log("Schema set to ndsrep, public");

        const start = '2025-01-01';
        const end = '2025-12-31';

        // Simulate params
        let params = [start, end];
        let conditions = [`p.ped_data BETWEEN $1 AND $2`, `p.ped_situacao IN ('P', 'F')`];

        // Query exactly as in reports_endpoints.js
        const query = `
        SELECT 
            c.cli_nomred AS cliente_nome,
            f.for_nomered AS industria_nome,
            to_char(p.ped_data, 'MM/YYYY') AS mes,
            SUM(ip.ite_totliquido) AS valor,
            SUM(ip.ite_quant) AS qtd
        FROM pedidos p
        JOIN itens_ped ip ON p.ped_pedido = ip.ite_pedido
        JOIN clientes c ON p.ped_cliente = c.cli_codigo
        JOIN fornecedores f ON p.ped_industria = f.for_codigo
        WHERE ${conditions.join(' AND ')}
        GROUP BY 1, 2, 3
        ORDER BY 2, 1, to_date(to_char(p.ped_data, 'MM/YYYY'), 'MM/YYYY')
    `;

        console.log("Executing Query...");
        const res = await client.query(query, params);
        console.log(`Success! Row count: ${res.rows.length}`);
        if (res.rows.length > 0) {
            console.log("First row sample:", res.rows[0]);
        }

    } catch (err) {
        console.error("QUERY ERROR:", err);
        console.error("ERROR MESSAGE:", err.message);
        console.error(" ERROR CODE:", err.code);
        if (err.hint) console.error("HINT:", err.hint);
        if (err.position) console.error("POSITION:", err.position);

    } finally {
        client.release();
        pool.end();
    }
}

runTest();
