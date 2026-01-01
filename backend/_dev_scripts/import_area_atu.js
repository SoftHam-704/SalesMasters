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

async function importAreaAtu() {
    try {
        console.log('📊 Importando áreas de atuação (area_atu)...\n');

        const filePath = path.join(__dirname, '../data/area_atu.xlsx');
        const workbook = XLSX.readFile(filePath);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(worksheet);

        console.log(`✅ ${data.length} áreas encontradas\n`);

        // 1. Criar sequence se não existir
        await pool.query(`
            CREATE SEQUENCE IF NOT EXISTS area_atu_atu_id_seq
            START WITH 1 INCREMENT BY 1
        `);

        // 2. Configurar como default
        await pool.query(`
            ALTER TABLE area_atu 
            ALTER COLUMN atu_id 
            SET DEFAULT nextval('area_atu_atu_id_seq'::regclass)
        `);

        // 3. Associar sequence à coluna
        await pool.query(`
            ALTER SEQUENCE area_atu_atu_id_seq OWNED BY area_atu.atu_id
        `);

        console.log('✅ Sequence configurada\n');

        let imported = 0;
        for (const row of data) {
            try {
                await pool.query(`
                    INSERT INTO area_atu (atu_descricao)
                    VALUES ($1)
                `, [row.ATU_DESCRICAO || row.atu_descricao || '']);
                imported++;
            } catch (err) {
                console.error(`❌ Erro: ${err.message}`);
            }
        }

        console.log(`\n✅ Importação concluída!`);
        console.log(`   Total: ${data.length} | Importados: ${imported}\n`);

        const result = await pool.query('SELECT * FROM area_atu ORDER BY atu_id');
        console.log('📋 Áreas de atuação importadas:');
        console.table(result.rows);

    } catch (err) {
        console.error('❌ Erro fatal:', err.message);
    } finally {
        await pool.end();
    }
}

importAreaAtu();
