const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function debugData() {
    try {
        console.log("--- DEBUG AREA OF ACTIVITY DATA ---");

        // 1. Get Mercenova ID
        const clientRes = await pool.query("SELECT cli_codigo, cli_nome, cli_nomred FROM clientes WHERE cli_nomred LIKE '%MERCENOVA%' OR cli_nome LIKE '%MERCENOVA%'");
        if (clientRes.rows.length === 0) {
            console.log("Client MERCENOVA not found!");
            return;
        }
        const client = clientRes.rows[0];
        console.log(`Client Found: ID=${client.cli_codigo}, Name=${client.cli_nome}, Reduced=${client.cli_nomred}`);

        // 2. Check atua_cli for this client
        const relRes = await pool.query("SELECT * FROM atua_cli WHERE atu_idcli = $1", [client.cli_codigo]);
        console.log(`Found ${relRes.rowCount} records in atua_cli for client ${client.cli_codigo}:`);
        console.table(relRes.rows);

        // 3. Check area_atu for the found IDs
        if (relRes.rows.length > 0) {
            const areaIds = relRes.rows.map(r => r.atu_atuaid);
            const areasRes = await pool.query("SELECT * FROM area_atu WHERE atu_id = ANY($1::int[])", [areaIds]);
            console.log("Corresponding Areas in area_atu:");
            console.table(areasRes.rows);
        } else {
            console.log("No areas linked to this client.");
        }

        // 4. Check ALL atua_cli records (first 10) just to see what was imported
        const allRes = await pool.query("SELECT * FROM atua_cli LIMIT 10");
        console.log("First 10 records in atua_cli (Any client):");
        console.table(allRes.rows);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        pool.end();
    }
}

debugData();
