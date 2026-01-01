
const axios = require('axios');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function testSave() {
    try {
        console.log('--- Testing API Save ---');

        // 1. Create Order (POST)
        const newOrder = {
            ped_cliente: 1, // Must exist
            ped_vendedor: 1, // Must exist
            ped_transp: 1, // Must exist
            ped_tabela: 2, // Must exist
            ped_industria: 104, // Must exist (Using 104 based on previous logs)
            ped_condpag: 'Test Cond',
            ped_cliind: 'CLI-TEST-001',
            ped_nffat: 'IND-TEST-001'
        };

        console.log('Sending POST...', newOrder);
        const postRes = await axios.post('http://localhost:3005/api/orders', newOrder);

        if (!postRes.data.success) {
            console.error('POST Failed:', postRes.data);
            return;
        }

        const createdOrder = postRes.data.data;
        const pedPedido = createdOrder.ped_pedido;
        console.log('Created Order:', pedPedido);

        // 2. Verify Database Content for POST
        const dbRes1 = await pool.query('SELECT ped_cliind, ped_nffat FROM pedidos WHERE ped_pedido = $1', [pedPedido]);
        console.log('DB After POST:', dbRes1.rows[0]);

        if (dbRes1.rows[0].ped_cliind !== 'CLI-TEST-001' || dbRes1.rows[0].ped_nffat !== 'IND-TEST-001') {
            console.error('CRITICAL: POST Data Mismatch!');
        } else {
            console.log('POST Verified Correctly.');
        }

        // 3. Update Order (PUT)
        const updateData = {
            ...createdOrder,
            ped_cliind: 'CLI-UPDATED',
            ped_nffat: 'IND-UPDATED'
        };

        console.log('Sending PUT...', updateData.ped_cliind, updateData.ped_nffat);
        const putRes = await axios.put(`http://localhost:3005/api/orders/${pedPedido}`, updateData);

        if (!putRes.data.success) {
            console.error('PUT Failed:', putRes.data);
            return;
        }

        // 4. Verify Database Content for PUT
        const dbRes2 = await pool.query('SELECT ped_cliind, ped_nffat FROM pedidos WHERE ped_pedido = $1', [pedPedido]);
        console.log('DB After PUT:', dbRes2.rows[0]);

        if (dbRes2.rows[0].ped_cliind !== 'CLI-UPDATED' || dbRes2.rows[0].ped_nffat !== 'IND-UPDATED') {
            console.error('CRITICAL: PUT Data Mismatch!');
        } else {
            console.log('PUT Verified Correctly.');
        }

    } catch (err) {
        console.error('Test Error:', err.message);
        if (err.response) console.error(err.response.data);
    } finally {
        pool.end();
    }
}

testSave();
