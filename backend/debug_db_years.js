const { Pool } = require('pg');
const pool = new Pool({
    connectionString: 'postgres://postgres:@12Pilabo@localhost:5432/basesales'
});

(async () => {
    try {
        console.log('Checking years in DB...');
        const res = await pool.query('SELECT EXTRACT(YEAR FROM ped_data) as ano, COUNT(*) as qtd FROM pedidos GROUP BY ano ORDER BY ano DESC');
        console.log('YEARS IN DB:', res.rows);

        console.log('Checking metrics for 2025...');
        const metrics2025 = await pool.query('SELECT * FROM get_dashboard_metrics(2025, NULL)');
        console.log('METRICS 2025:', metrics2025.rows[0]);
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
})();
