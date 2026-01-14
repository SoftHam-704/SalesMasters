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

async function importCliAniv() {
    try {
        console.log(`🚀 IMPORTANDO CONTATOS DE CLIENTES (CLI_ANIV) -> SCHEMA: [${SCHEMA}] (SaveInCloud)\n`);

        const filePath = path.join(__dirname, '../../data/cli_aniv.xlsx');
        if (!require('fs').existsSync(filePath)) {
            console.error(`❌ ERRO: Arquivo não encontrado em ${filePath}`);
            return;
        }

        const workbook = XLSX.readFile(filePath);
        const data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

        console.log(`📊 ${data.length} contatos encontrados no Excel\n`);

        await pool.query(`SET search_path TO "${SCHEMA}"`);

        let imported = 0;
        let errors = 0;

        for (const row of data) {
            try {
                // Montar data de aniversário: ano fixo 2001 + mês + dia
                let dataNiver = null;
                if (row.ANI_MES && row.ANI_DIAANIV) {
                    const mes = String(row.ANI_MES).padStart(2, '0');
                    const dia = String(row.ANI_DIAANIV).padStart(2, '0');
                    dataNiver = `2001-${mes}-${dia}`;
                }

                await pool.query(`
                    INSERT INTO cli_aniv (
                        ani_cliente, ani_nome, ani_funcao, ani_fone, ani_email,
                        ani_diaaniv, ani_mes, ani_niver, ani_lancto, gid
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                `, [
                    row.ANI_CLIENTE || 0,
                    row.ANI_NOME || '',
                    row.ANI_FUNCAO || '',
                    row.ANI_FONE || '',
                    row.ANI_EMAIL || '',
                    row.ANI_DIAANIV || null,
                    row.ANI_MES || null,
                    dataNiver,
                    row.ANI_LANCTO || null,
                    row.GID || ''
                ]);
                imported++;

                if (imported % 100 === 0) {
                    process.stdout.write(`\r🚀 Processando: ${imported}/${data.length}`);
                }
            } catch (err) {
                errors++;
                // Silently ignore duplicates if any, or log if unique constraint exists
            }
        }

        console.log(`\n\n✅ Importação concluída!`);
        console.log(`   Total: ${data.length} | Sucesso: ${imported} | Erros: ${errors}\n`);

    } catch (err) {
        console.error('❌ Erro fatal:', err.message);
    } finally {
        await pool.end();
    }
}

importCliAniv();
