const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'basesales',
    user: 'postgres',
    password: '@12Pilabo',
});

async function checkPriceTableData() {
    try {
        console.log('🔍 Checking for price table data...');

        // Check industry 23 and table 'LP LAN NOV25'
        const ind = 23;
        const tab = 'LP LAN NOV25';

        console.log(`Checking raw data in cad_tabelaspre for ind=${ind}, tab=${tab}...`);
        const raw = await pool.query('SELECT COUNT(*) FROM cad_tabelaspre WHERE itab_idindustria = $1 AND itab_tabela = $2', [ind, tab]);
        console.log(`- Count in cad_tabelaspre: ${raw.rows[0].count}`);

        console.log(`Checking view vw_produtos_precos for ind=${ind}, tab=${tab}...`);
        const view = await pool.query('SELECT COUNT(*) FROM vw_produtos_precos WHERE pro_industria = $1 AND itab_tabela = $2', [ind, tab]);
        console.log(`- Count in vw_produtos_precos: ${view.rows[0].count}`);

        if (view.rows[0].count === '0' && raw.rows[0].count !== '0') {
            console.log('⚠️ ALERT: Data exists in table but NOT in view. Checking view definition...');
            const viewDef = await pool.query("SELECT definition FROM pg_views WHERE viewname = 'vw_produtos_precos'");
            console.log('View Definition:', viewDef.rows[0]?.definition);
        }

    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        await pool.end();
    }
}

checkPriceTableData();
