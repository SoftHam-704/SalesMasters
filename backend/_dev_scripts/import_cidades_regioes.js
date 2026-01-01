const XLSX = require('xlsx');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

async function importCidadesRegioes() {
    try {
        console.log('📂 Lendo arquivo cidades_regioes.xlsx...');
        const workbook = XLSX.readFile('../data/cidades_regioes.xlsx');
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        console.log(`📊 Encontrados ${data.length} registros`);

        // Limpar tabela
        console.log('🗑️  Limpando tabela cidades_regioes...');
        await pool.query('DELETE FROM cidades_regioes');
        console.log('✅ Tabela limpa');

        // Inserir dados
        console.log('📥 Importando dados...');
        let imported = 0;
        let errors = 0;

        for (const row of data) {
            try {
                const reg_id = row.reg_id || row.REG_ID;
                const cid_id = row.cid_id || row.CID_ID;

                if (!reg_id || !cid_id) {
                    console.log(`⚠️  Linha ignorada (dados incompletos):`, row);
                    errors++;
                    continue;
                }

                await pool.query(
                    'INSERT INTO cidades_regioes (reg_id, cid_id) VALUES ($1, $2)',
                    [reg_id, cid_id]
                );
                imported++;
            } catch (error) {
                console.error(`❌ Erro ao importar linha:`, row, error.message);
                errors++;
            }
        }

        console.log(`\n✅ Importação concluída!`);
        console.log(`   - Registros importados: ${imported}`);
        console.log(`   - Erros: ${errors}`);

    } catch (error) {
        console.error('❌ Erro na importação:', error);
    } finally {
        await pool.end();
    }
}

importCidadesRegioes();
