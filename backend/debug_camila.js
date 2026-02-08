const { Pool } = require('pg');

const masterPool = new Pool({
    host: 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    port: 13062,
    database: 'salesmasters_master',
    user: 'webadmin',
    password: 'ytAyO0u043'
});

async function listTables() {
    try {
        const result = await masterPool.query("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public';");
        console.log(JSON.stringify(result.rows, null, 2));
        await masterPool.end();
    } catch (e) {
        console.error(e);
        await masterPool.end();
    }
}

listTables();
