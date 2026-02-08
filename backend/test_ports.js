const { Pool } = require('pg');

async function testPort(port) {
    console.log(`Testing port ${port}...`);
    const p = new Pool({
        host: 'node254557-salesmaster.sp1.br.saveincloud.net.br',
        port: port,
        database: 'basesales',
        user: 'sistemas',
        password: 'hamilton123',
        connectionTimeoutMillis: 5000
    });
    try {
        const res = await p.query('SELECT current_schema()');
        console.log(`✅ Success on port ${port}:`, res.rows[0]);
    } catch (err) {
        console.log(`❌ Fail on port ${port}:`, err.message);
    } finally {
        await p.end();
    }
}

async function run() {
    await testPort(5432);
    await testPort(13062);
}

run();
