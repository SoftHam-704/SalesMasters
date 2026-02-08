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

const SCHEMA = process.env.SCHEMA || 'soma';

async function importGrupos() {
    try {
        console.log(`🚀 IMPORTANDO GRUPOS -> SCHEMA: [${SCHEMA}] (SaveInCloud)\n`);

        const filePath = path.join(__dirname, '../../data/grupos.xlsx');
        if (!require('fs').existsSync(filePath)) {
            console.error(`❌ ERRO: Arquivo não encontrado em ${filePath}`);
            return;
        }

        const workbook = XLSX.readFile(filePath);
        const data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

        console.log(`📊 ${data.length} registros encontrados no Excel\n`);

        await pool.query(`SET search_path TO "${SCHEMA}"`);

        // Como a tabela está sem PK, vamos apenas inserir.
        // Se precisar rodar de novo, o usuário pode truncar a tabela.
        let imported = 0;
        for (const row of data) {
            try {
                await pool.query(`
                    INSERT INTO grupos (gru_codigo, gru_nome, gru_percomiss, gid)
                    VALUES ($1, $2, $3, $4)
                `, [
                    row.GRU_CODIGO || row.gru_codigo || 0,
                    row.GRU_NOME || row.gru_nome || '',
                    row.GRU_PERCOMISS || row.gru_percomiss || 0,
                    row.GID || row.gid || ''
                ]);
                imported++;
            } catch (err) {
                console.error(`❌ Erro no grupo [${row.GRU_NOME}]: ${err.message}`);
            }
        }

        console.log(`\n✅ Carga concluída!`);
        console.log(`   Total: ${data.length} | Importados: ${imported}\n`);

    } catch (err) {
        console.error('❌ Erro fatal:', err.message);
    } finally {
        await pool.end();
    }
}

importGrupos();
