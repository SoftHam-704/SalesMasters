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

async function reimportAreaAtu() {
    try {
        console.log('📊 Reimportando area_atu preservando IDs originais...\n');

        const filePath = path.join(__dirname, '../data/area_atu.xlsx');
        const workbook = XLSX.readFile(filePath);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(worksheet);

        console.log(`✅ ${data.length} áreas encontradas\n`);

        // 1. Limpar tabela
        await pool.query('TRUNCATE TABLE area_atu RESTART IDENTITY CASCADE');
        console.log('✅ Tabela limpa\n');

        let imported = 0;
        let maxId = 0;

        for (const row of data) {
            try {
                const atuId = row.ATU_ID || row.atu_id || 0;

                await pool.query(`
                    INSERT INTO area_atu (atu_id, atu_descricao)
                    VALUES ($1, $2)
                `, [atuId, row.ATU_DESCRICAO || row.atu_descricao || '']);

                imported++;
                if (atuId > maxId) maxId = atuId;

            } catch (err) {
                console.error(`❌ Erro: ${err.message}`);
            }
        }

        console.log(`✅ Importação concluída!`);
        console.log(`   Total: ${data.length} | Importados: ${imported}`);
        console.log(`   Maior ID: ${maxId}\n`);

        // 2. Ajustar sequence para o próximo valor
        const nextVal = maxId + 1;
        await pool.query(`ALTER SEQUENCE area_atu_atu_id_seq RESTART WITH ${nextVal}`);
        console.log(`✅ Sequence ajustada para começar em ${nextVal}\n`);

        const result = await pool.query('SELECT atu_id, atu_descricao FROM area_atu ORDER BY atu_id LIMIT 10');
        console.log('📋 Primeiras 10 áreas (com IDs originais):');
        console.table(result.rows);

        const count = await pool.query('SELECT COUNT(*), MAX(atu_id) as max_id FROM area_atu');
        console.log(`\n📊 Total: ${count.rows[0].count} áreas | Maior ID: ${count.rows[0].max_id}`);

    } catch (err) {
        console.error('❌ Erro fatal:', err.message);
    } finally {
        await pool.end();
    }
}

reimportAreaAtu();
