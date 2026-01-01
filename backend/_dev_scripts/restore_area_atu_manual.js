const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

const areas = [
    { id: 1, name: 'AGRICOLA-TODAS' },
    { id: 27, name: 'LEVE' },
    { id: 28, name: 'LINHA UTILITARIO' },
    { id: 29, name: 'PESADA-TODOS' }
];

async function restore() {
    try {
        console.log("Restoring missing Area Definitions...");

        for (const area of areas) {
            await pool.query(
                `INSERT INTO area_atu (atu_id, atu_descricao) 
                 SELECT $1, $2
                 WHERE NOT EXISTS (SELECT 1 FROM area_atu WHERE atu_id = $1)`,
                [area.id, area.name]
            );
            console.log(`Restored: [${area.id}] ${area.name}`);
        }
        console.log("Done.");

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

restore();
