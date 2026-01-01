const pool = require('./db');

(async () => {
    try {
        const res = await pool.query('SELECT pro_status, pg_typeof(pro_status) FROM cad_prod LIMIT 1');
        console.log('Result:', res.rows[0]);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
