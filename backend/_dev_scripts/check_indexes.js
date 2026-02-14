
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function checkIndexes() {
    const pool = new Pool({
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        options: '-c search_path=ro_consult,public'
    });

    try {
        console.log("--- ANALISANDO ÍNDICES (ro_consult) ---");

        const tables = ['pedidos', 'itens_ped', 'cad_prod', 'cad_tabelaspre'];

        for (const table of tables) {
            console.log(`\nÍndices da tabela: ${table}`);
            const query = `
                SELECT
                    t.relname as table_name,
                    i.relname as index_name,
                    a.attname as column_name
                FROM
                    pg_class t,
                    pg_class i,
                    pg_index ix,
                    pg_attribute a
                WHERE
                    t.oid = ix.indrelid
                    AND i.oid = ix.indexrelid
                    AND a.attrelid = t.oid
                    AND a.attnum = ANY(ix.indkey)
                    AND t.relkind = 'r'
                    AND t.relname = $1
                ORDER BY
                    t.relname,
                    i.relname;
            `;
            const res = await pool.query(query, [table]);
            console.table(res.rows);
        }

    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

checkIndexes();
