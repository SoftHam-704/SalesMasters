
const fs = require('fs');
const { Pool } = require('pg');
require('dotenv').config({ path: './backend/.env' });

async function importJson() {
    const pool = new Pool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: 'basesales',
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD
    });

    const schema = 'repsoma';

    try {
        console.log('🚀 Iniciando Importação Repsoma...');

        // 1. Importar Pedidos
        console.log('--- Importando Pedidos ---');
        const pedidosData = JSON.parse(fs.readFileSync('./data/pedidos.json', 'utf8'));
        const pedidos = pedidosData.RecordSet;
        console.log(`Encontrados ${pedidos.length} pedidos.`);

        await pool.query('BEGIN');
        for (let i = 0; i < pedidos.length; i += 1000) {
            const chunk = pedidos.slice(i, i + 1000);
            const values = [];
            const placeholders = [];

            chunk.forEach((p, idx) => {
                const base = idx * 10;
                // Formatar data DD.MM.YYYY HH:MM -> YYYY-MM-DD
                let pedDataFormatted = null;
                if (p.PED_DATA) {
                    const parts = p.PED_DATA.split('.');
                    if (parts.length === 3) {
                        const day = parts[0];
                        const month = parts[1];
                        const year = parts[2].split(' ')[0];
                        pedDataFormatted = `${year}-${month}-${day}`;
                    }
                }

                values.push(
                    p.PED_NUMERO,               // 1
                    p.PED_PEDIDO,               // 2
                    p.PED_TABELA || '',         // 3
                    pedDataFormatted,           // 4
                    p.PED_INDUSTRIA || 0,       // 5
                    p.PED_CLIENTE || 0,         // 6
                    p.PED_TRANSP || 0,          // 7
                    p.PED_VENDEDOR || 0,        // 8
                    p.PED_SITUACAO || 'A',      // 9
                    p.PED_TOTLIQ || 0           // 10
                );
                placeholders.push(`($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8}, $${base + 9}, $${base + 10})`);
            });

            const sql = `INSERT INTO ${schema}.pedidos (ped_numero, ped_pedido, ped_tabela, ped_data, ped_industria, ped_cliente, ped_transp, ped_vendedor, ped_situacao, ped_totliq) VALUES ${placeholders.join(',')} ON CONFLICT (ped_pedido) DO NOTHING`;
            await pool.query(sql, values);
            process.stdout.write(`\rProcessado: ${Math.min(i + 1000, pedidos.length)}/${pedidos.length}`);
        }
        await pool.query('COMMIT');
        console.log('\n✅ Pedidos importados.');

        // 2. Importar Itens
        console.log('--- Importando Itens de Pedido ---');
        const itensData = JSON.parse(fs.readFileSync('./data/itens_ped.json', 'utf8'));
        const itens = itensData.RecordSet;
        console.log(`Encontrados ${itens.length} itens.`);

        await pool.query('BEGIN');
        for (let i = 0; i < itens.length; i += 1000) {
            const chunk = itens.slice(i, i + 1000);
            const values = [];
            const placeholders = [];

            chunk.forEach((item, idx) => {
                const base = idx * 10;
                let iteDataFormatted = null;
                if (item.ITE_DATA) {
                    const parts = item.ITE_DATA.split('.');
                    if (parts.length === 3) {
                        const day = parts[0];
                        const month = parts[1];
                        const yearTime = parts[2].split(' ');
                        const year = yearTime[0];
                        const time = yearTime[1] || '00:00';
                        iteDataFormatted = `${year}-${month}-${day} ${time}`;
                    }
                }

                values.push(
                    item.ITE_LANCTO,            // 1
                    item.ITE_PEDIDO,            // 2
                    item.ITE_INDUSTRIA || 0,    // 3
                    item.ITE_PRODUTO || '',     // 4
                    item.ITE_NOMEPROD || '',    // 5
                    iteDataFormatted,           // 6
                    item.ITE_QUANT || 0,        // 7
                    item.ITE_PUNI || 0,         // 8
                    item.ITE_PUNILIQ || 0,      // 9
                    item.ITE_TOTLIQUIDO || 0    // 10
                );
                placeholders.push(`($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8}, $${base + 9}, $${base + 10})`);
            });

            const sql = `INSERT INTO ${schema}.itens_ped (ite_lancto, ite_pedido, ite_industria, ite_produto, ite_nomeprod, ite_data, ite_quant, ite_puni, ite_puniliq, ite_totliquido) VALUES ${placeholders.join(',')} ON CONFLICT (ite_lancto) DO NOTHING`;
            await pool.query(sql, values);
            process.stdout.write(`\rProcessado: ${Math.min(i + 1000, itens.length)}/${itens.length}`);
        }
        await pool.query('COMMIT');
        console.log('\n✅ Itens importados.');

    } catch (err) {
        if (pool) await pool.query('ROLLBACK');
        console.error('\n❌ Erro Crítico:', err.message);
    } finally {
        await pool.end();
    }
}

importJson();
