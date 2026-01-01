const XLSX = require('xlsx');
const { Pool } = require('pg');
const path = require('path');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'basesales',
    user: 'postgres',
    password: '@12Pilabo'
});

async function importCliAniv() {
    try {
        console.log('📊 Importando contatos de clientes (cli_aniv)...\n');

        const filePath = path.join(__dirname, '../data/cli_aniv.xlsx');
        const workbook = XLSX.readFile(filePath);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(worksheet);

        console.log(`✅ ${data.length} contatos encontrados\n`);

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
                    process.stdout.write(`\rImportados: ${imported}/${data.length}`);
                }
            } catch (err) {
                errors++;
                if (errors <= 3) {
                    console.error(`\n❌ Erro: ${err.message}`);
                }
            }
        }

        console.log(`\n\n✅ Importação concluída!`);
        console.log(`   Total: ${data.length}`);
        console.log(`   Importados: ${imported}`);
        console.log(`   Erros: ${errors}\n`);

        const count = await pool.query('SELECT COUNT(*) FROM cli_aniv');
        console.log(`📊 Total de contatos no banco: ${count.rows[0].count}`);

        const sample = await pool.query(`
            SELECT ca.ani_nome, ca.ani_funcao, c.cli_nomred as cliente,
                   ca.ani_diaaniv, ca.ani_mes, ca.ani_niver
            FROM cli_aniv ca
            LEFT JOIN clientes c ON c.cli_codigo = ca.ani_cliente
            WHERE ca.ani_niver IS NOT NULL
            ORDER BY ca.ani_mes, ca.ani_diaaniv
            LIMIT 5
        `);
        console.log('\n📋 Amostra com aniversários:');
        console.table(sample.rows);

    } catch (err) {
        console.error('❌ Erro fatal:', err.message);
    } finally {
        await pool.end();
    }
}

importCliAniv();
