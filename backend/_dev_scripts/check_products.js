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
        console.log("🔍 Checking Product Industry Alignment for Client 334 (CDR)...");

        // Get one sold item
        const q1 = await pool.query(`
            SELECT i.ite_produto, i.ite_quant, p.ped_industria
            FROM itens_ped i
            JOIN pedidos p ON i.ite_pedido = p.ped_pedido
            WHERE p.ped_cliente = 334 AND p.ped_industria = 8
            LIMIT 1
        `);

        if (q1.rows.length === 0) {
            console.log("❌ No items found for Client 334 Ind 8 (Expected 334 items!)");
        } else {
            console.log("✅ Sample Item:", q1.rows[0]);
            const prodCode = q1.rows[0].ite_produto;

            // Check this product in cad_prod
            const q2 = await pool.query(`
                SELECT pro_codprod, pro_nome, pro_industria
                FROM cad_prod
                WHERE pro_codprod = $1
            `, [prodCode]);

            console.log("📦 CAD_PROD Info:", q2.rows[0]);

            if (q2.rows[0].pro_industria !== 8) {
                console.warn("⚠️ MISMATCH! Product Industry in CAD_PROD is", q2.rows[0].pro_industria, "but sold in Industry 8.");
            } else {
                console.log("✅ Industry OK.");
            }
        }

    } catch (e) {
        console.error("❌ Error:", e.message);
    } finally {
        pool.end();
    }
}
run();
