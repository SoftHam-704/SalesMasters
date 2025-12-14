const XLSX = require('xlsx');
const { Pool } = require('pg');
const path = require('path');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'basesales',
    user: 'postgres',
    password: '@12Pilabo',
});

async function importGoals() {
    try {
        console.log('📊 Iniciando importação de metas...\n');

        // Read XLSX file
        const filePath = path.join(__dirname, '../data/ind_metas.xlsx');
        console.log(`Lendo arquivo: ${filePath}`);

        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        console.log(`✅ Arquivo lido: ${data.length} registros encontrados\n`);

        // First, add PRIMARY KEY constraint
        console.log('🔑 Adicionando PRIMARY KEY...');
        try {
            await pool.query('ALTER TABLE ind_metas DROP CONSTRAINT IF EXISTS ind_metas_pkey');
            await pool.query('ALTER TABLE ind_metas ADD PRIMARY KEY (met_ano, met_industria)');
            console.log('✅ PRIMARY KEY adicionada\n');
        } catch (err) {
            console.log('⚠️  PRIMARY KEY já existe ou erro:', err.message, '\n');
        }

        let imported = 0;
        let errors = 0;

        for (const row of data) {
            try {
                const query = `
                    INSERT INTO ind_metas (
                        met_ano, met_industria,
                        met_jan, met_fev, met_mar, met_abr, met_mai, met_jun,
                        met_jul, met_ago, met_set, met_out, met_nov, met_dez
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
                    ON CONFLICT (met_ano, met_industria) DO UPDATE SET
                        met_jan = EXCLUDED.met_jan,
                        met_fev = EXCLUDED.met_fev,
                        met_mar = EXCLUDED.met_mar,
                        met_abr = EXCLUDED.met_abr,
                        met_mai = EXCLUDED.met_mai,
                        met_jun = EXCLUDED.met_jun,
                        met_jul = EXCLUDED.met_jul,
                        met_ago = EXCLUDED.met_ago,
                        met_set = EXCLUDED.met_set,
                        met_out = EXCLUDED.met_out,
                        met_nov = EXCLUDED.met_nov,
                        met_dez = EXCLUDED.met_dez
                `;

                const values = [
                    row.MET_ANO || new Date().getFullYear(),
                    row.MET_INDUSTRIA || 0,
                    row.MET_JAN || 0,
                    row.MET_FEV || 0,
                    row.MET_MAR || 0,
                    row.MET_ABR || 0,
                    row.MET_MAI || 0,
                    row.MET_JUN || 0,
                    row.MET_JUL || 0,
                    row.MET_AGO || 0,
                    row.MET_SET || 0,
                    row.MET_OUT || 0,
                    row.MET_NOV || 0,
                    row.MET_DEZ || 0
                ];

                await pool.query(query, values);
                imported++;

                if (imported % 10 === 0) {
                    process.stdout.write(`\rImportados: ${imported}/${data.length}`);
                }
            } catch (err) {
                errors++;
                console.error(`\n❌ Erro ao importar meta ${row.MET_ANO}/${row.MET_INDUSTRIA}: ${err.message}`);
            }
        }

        console.log(`\n\n✅ Importação concluída!`);
        console.log(`   📊 Total: ${data.length} registros`);
        console.log(`   ✅ Importados: ${imported}`);
        console.log(`   ❌ Erros: ${errors}`);

        // Show sample data
        const sample = await pool.query(`
            SELECT * FROM ind_metas 
            WHERE met_industria = 20
            ORDER BY met_ano DESC 
            LIMIT 3
        `);
        console.log('\n📋 Amostra dos dados importados (Fornecedor 20):');
        console.table(sample.rows);

    } catch (err) {
        console.error('❌ Erro fatal:', err.message);
        console.error(err.stack);
    } finally {
        await pool.end();
    }
}

importGoals();
