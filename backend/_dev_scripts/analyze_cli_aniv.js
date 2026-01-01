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

async function analyzeCliAniv() {
    try {
        console.log('📂 Analisando cli_aniv.xlsx...\n');

        const filePath = path.join(__dirname, '../data/cli_aniv.xlsx');
        const workbook = XLSX.readFile(filePath);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(worksheet);

        console.log(`✅ Total: ${data.length} contatos\n`);
        console.log('📋 Colunas da planilha:');
        if (data.length > 0) {
            Object.keys(data[0]).forEach((k, i) => console.log(`   ${(i + 1).toString().padStart(2)}. ${k}`));
        }

        console.log('\n🔍 Schema da tabela cli_aniv:');
        const schema = await pool.query(`
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_name = 'cli_aniv'
            ORDER BY ordinal_position
        `);
        schema.rows.forEach((c, i) => console.log(`   ${(i + 1).toString().padStart(2)}. ${c.column_name.padEnd(25)} ${c.data_type}`));

        console.log('\n📊 Amostra:');
        console.table(data.slice(0, 3));

    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await pool.end();
    }
}

analyzeCliAniv();
