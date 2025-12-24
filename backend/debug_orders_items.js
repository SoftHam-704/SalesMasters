const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'basesales',
    user: 'postgres',
    password: '@12Pilabo',
});

async function debugData() {
    try {
        console.log('\n--- DIAGNOSTICS ---\n');

        // Check a few orders from the period
        const ordersResult = await pool.query(`
            SELECT 
                p.ped_pedido, 
                p.ped_cliente, 
                c.cli_nomred,
                (SELECT COUNT(*) FROM itens_ped i WHERE i.ite_pedido = p.ped_pedido) as item_count,
                (SELECT SUM(i.ite_quant) FROM itens_ped i WHERE i.ite_pedido = p.ped_pedido) as total_quant
            FROM pedidos p
            INNER JOIN clientes c ON p.ped_cliente = c.cli_codigo
            WHERE p.ped_data BETWEEN '2024-11-01' AND '2024-12-22'
            LIMIT 10
        `);

        console.log('Sample Orders:');
        ordersResult.rows.forEach(r => {
            console.log(`Pedido: ${r.ped_pedido}, Cliente: ${r.ped_cliente} (${r.cli_nomred}), Items: ${r.item_count}, Units: ${r.total_quant}`);
        });

        // Check distinct clients count in the period
        const clientsResult = await pool.query(`
            SELECT COUNT(DISTINCT p.ped_cliente) as distinct_clients
            FROM pedidos p
            WHERE p.ped_data BETWEEN '2024-11-01' AND '2024-12-22'
            AND (p.ped_situacao = 'P' OR p.ped_situacao = 'F')
        `);
        console.log('\nDistinct Clients (P/F):', clientsResult.rows[0].distinct_clients);

        // Check if there are ANY items in itens_ped
        const itemsCount = await pool.query(`SELECT COUNT(*) FROM itens_ped`);
        console.log('Total items in database:', itemsCount.rows[0].count);

        if (ordersResult.rows.length > 0) {
            const firstPed = ordersResult.rows[0].ped_pedido;
            const itemsSample = await pool.query(`SELECT ite_pedido, ite_quant FROM itens_ped WHERE ite_pedido ILIKE $1 LIMIT 5`, [`%${firstPed.trim()}%`]);
            console.log(`\nItems for Pedido like '${firstPed}':`, itemsSample.rows);
        }

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

debugData();
