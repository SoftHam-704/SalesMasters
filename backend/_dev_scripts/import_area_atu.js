const XLSX = require('xlsx');
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: false
});

const SCHEMA = 'ro_consult';

async function importAreaAtu() {
    try {
        console.log(`🚀 IMPORTANDO ÁREAS DE ATUAÇÃO -> SCHEMA: [${SCHEMA}] (SaveInCloud)\n`);

        const filePath = path.join(__dirname, '../../data/area_atu.xlsx');
        if (!require('fs').existsSync(filePath)) {
            console.error(`❌ ERRO: Arquivo não encontrado em ${filePath}`);
            return;
        }

        const workbook = XLSX.readFile(filePath);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(worksheet);

        console.log(`📊 ${data.length} registros encontrados no Excel\n`);

        // Set search path to target schema
        await pool.query(`SET search_path TO "${SCHEMA}"`);

        let imported = 0;
        for (const row of data) {
            try {
                // Remove ID if present to let DB generate via sequence
                const descricao = row.ATU_DESCRICAO || row.atu_descricao || row.DESCRICAO || '';

                await pool.query(`
                    INSERT INTO area_atu (atu_descricao)
                    VALUES ($1)
                `, [descricao]);
                imported++;
            } catch (err) {
                console.error(`❌ Erro no registro [${row.ATU_DESCRICAO || 'sem nome'}]: ${err.message}`);
            }
        }

        console.log(`\n✅ Carga concluída!`);
        console.log(`   Total: ${data.length} | Importados: ${imported}\n`);

        const result = await pool.query('SELECT * FROM area_atu ORDER BY atu_id');
        console.table(result.rows);

    } catch (err) {
        console.error('❌ Erro fatal:', err.message);
    } finally {
        await pool.end();
    }
}

importAreaAtu();
