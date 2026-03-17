const { Pool } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

async function diff() {
    const pool = new Pool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME || 'basesales',
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        ssl: false
    });

    try {
        console.log('--- DIFF TABLES (public vs lagrep) ---');
        const publicTables = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'");
        const lagrepTables = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'lagrep' AND table_type = 'BASE TABLE'");
        
        const pubT = publicTables.rows.map(r => r.table_name);
        const lagT = lagrepTables.rows.map(r => r.table_name);
        
        console.log('Missing in lagrep:', pubT.filter(x => !lagT.includes(x)));
        console.log('Extra in lagrep:', lagT.filter(x => !pubT.includes(x)));

        console.log('\n--- DIFF VIEWS (public vs lagrep) ---');
        const publicViews = await pool.query("SELECT table_name FROM information_schema.views WHERE table_schema = 'public'");
        const lagrepViews = await pool.query("SELECT table_name FROM information_schema.views WHERE table_schema = 'lagrep'");
        
        const pubV = publicViews.rows.map(r => r.table_name);
        const lagV = lagrepViews.rows.map(r => r.table_name);
        
        console.log('Missing in lagrep:', pubV.filter(x => !lagV.includes(x)));

    } catch (err) {
        console.error('❌ Erro:', err.message);
    } finally {
        await pool.end();
    }
}

diff();
