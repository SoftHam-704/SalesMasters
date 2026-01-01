const XLSX = require('xlsx');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'basesales',
    user: 'postgres',
    password: '@12Pilabo'
});

async function analyzeItensPed() {
    try {
        // Analisando um dos arquivos (o mais recente ou menor para ser rápido)
        const fileName = 'itens_ped_2025_3.xlsx';
        console.log(`📂 Analisando arquivo de itens: ${fileName}...\n`);

        const filePath = path.join(__dirname, `../data/${fileName}`);
        const workbook = XLSX.readFile(filePath);
        // Ler apenas as primeiras 100 linhas para análise de colunas
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(worksheet, { limit: 100 });

        console.log('📋 Colunas da planilha:');
        if (data.length > 0) {
            Object.keys(data[0]).forEach((k, i) => console.log(`   ${(i + 1).toString().padStart(2)}. ${k}`));
            console.log('\n📊 Amostra (primeiro registro):');
            console.log(data[0]);
        } else {
            console.log('⚠️ Arquivo vazio ou ilegível.');
        }

        console.log('\n🔍 Schema da tabela pedidos_itens (banco):');
        const schema = await pool.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'pedidos_itens'
            ORDER BY ordinal_position
        `);

        if (schema.rows.length === 0) {
            console.log('   ⚠️ Tabela pedidos_itens NÃO EXISTE no banco.');
        } else {
            schema.rows.forEach(r => console.log(`   ${r.column_name.padEnd(20)} ${r.data_type} (${r.is_nullable})`));
        }

    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await pool.end();
    }
}

analyzeItensPed();
