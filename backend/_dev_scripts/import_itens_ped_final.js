const { Pool } = require('pg');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'basesales',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '@12Pilabo',
});

const files = [
    'itens_ped_2020.xlsx',
    'itens_ped_2021.xlsx',
    'itens_ped_2022.xlsx',
    'itens_ped_2023.xlsx',
    'itens_ped_2024_1.xlsx',
    'itens_ped_2024_2.xlsx',
    'itens_ped_2025_1.xlsx',
    'itens_ped_2025_2.xlsx',
    'itens_ped_2025_3.xlsx'
];

// Função para normalizar código: remove tudo exceto letras e números
function normalizarCodigo(codigo) {
    if (!codigo) return '';
    return codigo.toString().replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
}

async function importarItens() {
    const client = await pool.connect();

    try {
        console.log('🗑️  Limpando tabela itens_ped...');
        await client.query('TRUNCATE TABLE itens_ped CASCADE');
        console.log('✅ Tabela limpa!\n');

        let totalImportado = 0;
        const startTime = Date.now();

        for (const filename of files) {
            const filePath = path.join(__dirname, '../data', filename);

            if (!fs.existsSync(filePath)) {
                console.warn(`⚠️  Arquivo não encontrado: ${filename}`);
                continue;
            }

            console.log(`📂 Processando: ${filename}...`);
            const workbook = XLSX.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

            console.log(`   📊 ${data.length} registros encontrados`);

            if (data.length === 0) continue;

            let importados = 0;
            const batchSize = 500;

            for (let i = 0; i < data.length; i += batchSize) {
                const batch = data.slice(i, i + batchSize);
                const values = [];
                const placeholders = [];

                let validRows = 0;
                for (const row of batch) {
                    // ite_pedido é VARCHAR - não fazer parseInt!
                    const pedido = (row.ITE_PEDIDO || row.PED_PEDIDO || '').toString().trim();
                    if (!pedido) continue;

                    const produto = (row.ITE_PRODUTO || '').toString().trim();
                    const codigoNormalizado = normalizarCodigo(produto);

                    // Valores
                    values.push(
                        pedido,                                          // ite_pedido
                        produto,                                         // ite_produto
                        codigoNormalizado,                              // ite_codigonormalizado
                        parseInt(row.PED_INDUSTRIA || row.ITE_INDUSTRIA || 0),  // ite_industria
                        parseFloat(row.ITE_QUANT || 0),                 // ite_quant
                        parseFloat(row.ITE_PUNI || 0),                  // ite_puni
                        parseFloat(row.ITE_PUNILIQ || 0),               // ite_puniliq
                        parseFloat(row.ITE_TOTLIQUIDO || 0),            // ite_totliquido
                        parseFloat(row.ITE_TOTBRUTO || 0),              // ite_totbruto
                        parseFloat(row.ITE_IPI || 0)                    // ite_ipi
                    );

                    const offset = validRows * 10;  // 10 colunas
                    const params = [];
                    for (let j = 1; j <= 10; j++) {
                        params.push(`$${offset + j}`);
                    }
                    placeholders.push(`(${params.join(', ')})`);
                    validRows++;
                }

                if (validRows > 0) {
                    const query = `
                        INSERT INTO itens_ped (
                            ite_pedido, ite_produto, ite_codigonormalizado, ite_industria,
                            ite_quant, ite_puni, ite_puniliq, ite_totliquido,
                            ite_totbruto, ite_ipi
                        ) VALUES ${placeholders.join(', ')}
                    `;

                    await client.query(query, values);
                    importados += validRows;
                    process.stdout.write('.');
                }
            }

            totalImportado += importados;
            console.log(` ✅ ${importados} registros importados`);
        }

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`\n🎉 Importação Concluída!`);
        console.log(`📥 Total: ${totalImportado} registros`);
        console.log(`⏱️  Tempo: ${duration}s\n`);

        // Verificar
        const count = await client.query('SELECT COUNT(*) FROM itens_ped');
        console.log(`✅ Verificação: ${count.rows[0].count} registros na tabela`);

    } catch (err) {
        console.error('❌ Erro:', err.message);
    } finally {
        client.release();
        await pool.end();
    }
}

importarItens();
