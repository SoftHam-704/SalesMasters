const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'basesales',
    user: 'postgres',
    password: '@12Pilabo',
});

async function testFunction() {
    try {
        console.log('\n🧪 [TEST] Testing get_orders_stats function...\n');

        // Test 1: All industries
        console.log('📊 Test 1: Period 01/11/2024 to 22/12/2024 (All industries)');
        const result1 = await pool.query(
            `SELECT * FROM get_orders_stats($1, $2, $3)`,
            ['2024-11-01', '2024-12-22', null]
        );
        console.log('Result:', result1.rows[0]);
        console.log('');

        // Test 2: Specific industry (if exists)
        console.log('📊 Test 2: Same period, Industry 5');
        const result2 = await pool.query(
            `SELECT * FROM get_orders_stats($1, $2, $3)`,
            ['2024-11-01', '2024-12-22', 5]
        );
        console.log('Result:', result2.rows[0]);
        console.log('');

        console.log('✅ [TEST] All tests completed!');

    } catch (error) {
        console.error('❌ [TEST] Error:', error);
    } finally {
        await pool.end();
    }
}

testFunction();
