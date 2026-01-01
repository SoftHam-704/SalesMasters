const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function run() {
    try {
        console.log("🧩 Testing Comparativo Clientes (SWAPPED for Local Data)...");

        // Swapping to verify logic (Ref must have sales)
        // Ref: 334 (CDR) - Has 334 items locally
        // Target: 243 (Comagri) - Has 0 items locally
        // Mode: GAP (Referencia comprou e alvo nao)

        const params = [8, 334, 243, '2024-01-01', '2025-12-28', 'GAP'];
        console.log("👉 Parameters:", params);

        const res = await pool.query(
            `SELECT * FROM fn_comparativo_clientes($1, $2, $3, $4, $5, $6)`,
            params
        );

        console.log(`✅ Success! Query executed without 500 compilation error.`);
        console.log(`📊 Rows returned: ${res.rowCount}`);
        if (res.rowCount > 0) {
            console.log("📝 First 3 rows sample:");
            console.table(res.rows.slice(0, 3).map(r => ({
                code: r.codigo,
                desc: r.descricao.substring(0, 20) + '...',
                ref_qtd: r.qtd_ref,
                alvo_qtd: r.qtd_alvo
            })));
        } else {
            console.log("⚠️ No data found (Empty definition or filters mismatch), but Function works!");
        }

    } catch (e) {
        console.error("❌ Error:", e.message);
        if (e.detail) console.error("Detail:", e.detail);
        if (e.hint) console.error("Hint:", e.hint);
    } finally {
        pool.end();
    }
}
run();
