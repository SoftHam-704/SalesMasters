const { Pool } = require('pg');

async function testWebadmin() {
    console.log(`Testing webadmin on port 13062...`);
    const p = new Pool({
        host: 'node254557-salesmaster.sp1.br.saveincloud.net.br',
        port: 13062,
        database: 'basesales',
        user: 'webadmin',
        password: 'ytAyO0u043',
        connectionTimeoutMillis: 5000
    });
    try {
        const res = await p.query('SELECT current_schema()');
        console.log(`✅ Success for webadmin:`, res.rows[0]);

        const schemas = await p.query("SELECT schema_name FROM information_schema.schemata");
        console.log('Available schemas:', schemas.rows.map(s => s.schema_name));
    } catch (err) {
        console.log(`❌ Fail for webadmin:`, err.message);
    } finally {
        await p.end();
    }
}

testWebadmin();
