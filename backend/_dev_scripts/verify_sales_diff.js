const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'basesales',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '@12Pilabo',
});

async function verifySalesData() {
    try {
        // Vendedor 1 (FABIO SILVA MASCARENHAS) - 2025
        console.log('===== VERIFICAÇÃO DE VENDAS - FABIO SILVA MASCARENHAS =====\n');

        // Total usando ped_totliq (valor no pedido)
        const totalPedTotliq = await pool.query(`
            SELECT 
                SUM(p.ped_totliq) as total_ped_totliq,
                COUNT(p.ped_pedido) as qtd_pedidos
            FROM pedidos p
            WHERE p.ped_vendedor = 1
            AND EXTRACT(YEAR FROM p.ped_data) = 2025
            AND p.ped_situacao IN ('P', 'F')
        `);

        console.log('📊 Total usando PED_TOTLIQ (valor agregado do pedido):');
        console.table(totalPedTotliq.rows);

        // Total somando os itens
        const totalItens = await pool.query(`
            SELECT 
                SUM(i.ite_totbruto) as total_itens_bruto,
                SUM(i.ite_totliquido) as total_itens_liquido,
                COUNT(DISTINCT i.ite_pedido) as qtd_pedidos_com_itens
            FROM itens_ped i
            INNER JOIN pedidos p ON i.ite_pedido = p.ped_pedido
            WHERE p.ped_vendedor = 1
            AND EXTRACT(YEAR FROM p.ped_data) = 2025
            AND p.ped_situacao IN ('P', 'F')
        `);

        console.log('\n📦 Total somando ITENS_PED:');
        console.table(totalItens.rows);

        // Diferença
        const diff = parseFloat(totalPedTotliq.rows[0].total_ped_totliq || 0) - parseFloat(totalItens.rows[0].total_itens_liquido || 0);
        console.log(`\n💡 Diferença (ped_totliq - ite_totliquido): R$ ${diff.toFixed(2)}`);

        // Pedidos sem itens
        const pedidosSemItens = await pool.query(`
            SELECT 
                p.ped_pedido,
                p.ped_totliq,
                p.ped_data,
                COUNT(i.ite_pedido) as qtd_itens
            FROM pedidos p
            LEFT JOIN itens_ped i ON p.ped_pedido = i.ite_pedido
            WHERE p.ped_vendedor = 1
            AND EXTRACT(YEAR FROM p.ped_data) = 2025
            AND p.ped_situacao IN ('P', 'F')
            GROUP BY p.ped_pedido, p.ped_totliq, p.ped_data
            HAVING COUNT(i.ite_pedido) = 0
        `);

        if (pedidosSemItens.rows.length > 0) {
            console.log(`\n⚠️  ${pedidosSemItens.rows.length} pedido(s) SEM ITENS cadastrados:`);
            console.table(pedidosSemItens.rows);
        }

    } catch (e) {
        console.error('❌ Erro:', e);
    } finally {
        await pool.end();
    }
}

verifySalesData();
