// Script para analisar headers da planilha clientes.xlsx
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

async function analyzeClientesFile() {
    try {
        console.log('📂 Analisando planilha clientes.xlsx...\n');

        // Ler planilha
        const filePath = path.join(__dirname, '../data/clientes.xlsx');
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        console.log(`✅ Total de registros: ${data.length}\n`);

        // Mostrar headers
        if (data.length > 0) {
            console.log('📋 Colunas encontradas na planilha:');
            const headers = Object.keys(data[0]);
            headers.forEach((header, index) => {
                console.log(`   ${(index + 1).toString().padStart(2)}. ${header}`);
            });

            console.log('\n📊 Primeiros 3 registros:');
            console.table(data.slice(0, 3));
        }

        // Verificar schema da tabela
        console.log('\n🔍 Verificando schema da tabela clientes no banco...');
        const schemaQuery = `
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'clientes'
            ORDER BY ordinal_position;
        `;

        const result = await pool.query(schemaQuery);
        console.log('\n📋 Colunas na tabela clientes:');
        result.rows.forEach((col, index) => {
            console.log(`   ${(index + 1).toString().padStart(2)}. ${col.column_name.padEnd(30)} ${col.data_type.padEnd(20)} ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
        });

        console.log(`\n✅ Total de colunas na tabela: ${result.rows.length}`);

    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await pool.end();
    }
}

analyzeClientesFile();
