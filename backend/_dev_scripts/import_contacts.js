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

async function importContacts() {
    try {
        console.log('📊 Iniciando importação de contatos...\n');

        // Read XLSX file
        const filePath = path.join(__dirname, '../data/contato_for.xlsx');
        console.log(`Lendo arquivo: ${filePath}`);

        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        console.log(`✅ Arquivo lido: ${data.length} contatos encontrados\n`);

        let imported = 0;
        let errors = 0;

        for (const row of data) {
            try {
                // Parse date if exists (DD/MM format to YYYY-MM-DD with year 2001)
                let birthDate = null;
                if (row.CON_DTNASC) {
                    const dateStr = row.CON_DTNASC.toString();
                    if (dateStr.includes('/')) {
                        const [day, month] = dateStr.split('/');
                        if (day && month) {
                            birthDate = `2001-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                        }
                    }
                }

                const query = `
                    INSERT INTO contato_for (
                        con_codigo, con_fornec, con_nome, con_cargo,
                        con_telefone, con_celular, con_email, con_dtnasc, con_obs,
                        con_timequetorce, con_esportepreferido, con_hobby
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                    ON CONFLICT (con_fornec, con_nome, con_cargo) DO UPDATE SET
                        con_codigo = EXCLUDED.con_codigo,
                        con_telefone = EXCLUDED.con_telefone,
                        con_celular = EXCLUDED.con_celular,
                        con_email = EXCLUDED.con_email,
                        con_dtnasc = EXCLUDED.con_dtnasc,
                        con_obs = EXCLUDED.con_obs,
                        con_timequetorce = EXCLUDED.con_timequetorce,
                        con_esportepreferido = EXCLUDED.con_esportepreferido,
                        con_hobby = EXCLUDED.con_hobby
                `;

                const values = [
                    row.CON_CODIGO || 0,
                    row.CON_FORNEC || 0,
                    row.CON_NOME || '',
                    row.CON_CARGO || row.CON_GARGO || '', // Handle typo in column name
                    row.CON_FONE || row.CON_TELEFONE || '',
                    row.CON_CELULAR || '',
                    row.CON_EMAIL || '',
                    birthDate,
                    row.CON_OBS || '',
                    row.CON_TIMEQUETORCE || '',
                    row.CON_ESPORTEPREFERIDO || '',
                    row.CON_HOBBY || ''
                ];

                await pool.query(query, values);
                imported++;

                if (imported % 10 === 0) {
                    process.stdout.write(`\rImportados: ${imported}/${data.length}`);
                }
            } catch (err) {
                errors++;
                console.error(`\n❌ Erro ao importar contato ${row.CON_NOME}: ${err.message}`);
            }
        }

        console.log(`\n\n✅ Importação concluída!`);
        console.log(`   📊 Total: ${data.length} contatos`);
        console.log(`   ✅ Importados: ${imported}`);
        console.log(`   ❌ Erros: ${errors}`);

        // Show sample data
        const sample = await pool.query('SELECT * FROM contato_for ORDER BY con_fornec LIMIT 5');
        console.log('\n📋 Amostra dos dados importados:');
        console.table(sample.rows);

        // Count by supplier
        const counts = await pool.query(`
            SELECT con_fornec, COUNT(*) as total 
            FROM contato_for 
            GROUP BY con_fornec 
            ORDER BY total DESC 
            LIMIT 5
        `);
        console.log('\n📊 Top 5 fornecedores com mais contatos:');
        console.table(counts.rows);

    } catch (err) {
        console.error('❌ Erro fatal:', err.message);
        console.error(err.stack);
    } finally {
        await pool.end();
    }
}

importContacts();
