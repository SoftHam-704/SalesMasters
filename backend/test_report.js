
const { Pool } = require('pg');

const connectionString = 'postgresql://webadmin:ytAyO0u043@node254557-salesmaster.sp1.br.saveincloud.net.br:13062/basesales';

// Use pool similar to server.js
const pool = new Pool({
    connectionString,
});

async function runTest() {
    const client = await pool.connect();
    try {
        console.log("--- TEST REPORT QUERY (NODE.JS) ---");

        // Simulate Tenant Context
        await client.query("SET search_path TO ndsrep, public");
        const schemaCheck = await client.query('SELECT current_schema()');
        console.log(`Current Schema: ${schemaCheck.rows[0].current_schema}`);

        // Params from frontend default
        const start = '2025-01-01';
        const end = '2025-12-31';

        let params = [start, end];
        let conditions = [`p.ped_data BETWEEN $1 AND $2`, `p.ped_situacao IN ('P', 'F')`];

        // Hardcoded logic for clientCol/group
        let clientCol = 'c.cli_nomred';
        // If group was true: 'c.cli_redeloja'

        const query = `
        SELECT 
            ${clientCol} AS cliente_nome,
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
        // console.log(query);

        const res = await client.query(query, params);
        console.log(`Success! Row count: ${res.rows.length}`);

        if (res.rows.length > 0) {
            console.log("First Row Sample:", res.rows[0]);
        } else {
            console.log("No rows returned (filters too strict?)");
        }

    } catch (err) {
        console.error("QUERY FAILED!");
        console.error("Message:", err.message);
        if (err.routine) console.error("Routine:", err.routine); // e.g. errorMissingColumn
        if (err.file) console.error("File:", err.file);
        if (err.position) console.error("Position:", err.position);
    } finally {
        client.release();
        pool.end();
    }
}

runTest();
