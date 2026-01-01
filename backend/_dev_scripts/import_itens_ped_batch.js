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

// Arquivos em ordem cronológica
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

async function importBatch() {
    const client = await pool.connect();

    try {
        console.log('🗑️  Limpando tabela itens_ped...');
        await client.query('TRUNCATE TABLE itens_ped CASCADE');
        console.log('✅ Tabela limpa!');

        let totalImported = 0;
        const startTime = Date.now();

        for (const filename of files) {
            const filePath = path.join(__dirname, '../data', filename);

            if (!fs.existsSync(filePath)) {
                console.warn(`⚠️  Arquivo não encontrado: ${filename}`);
                continue;
            }

            console.log(`\n📂 Processando: ${filename}...`);
            const workbook = XLSX.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

            console.log(`   📊 ${data.length} registros encontrados.`);

            if (data.length === 0) continue;

            const values = [];
            let placeholders = [];
            let rowCount = 0;
            const batchSize = 1000;

            if (data.length > 0) {
                console.log('🔍 Exemplo da primeira linha (Keys):', Object.keys(data[0]));
                console.log('🔍 Exemplo da primeira linha (Values):', data[0]);
                console.log('Teste Pedido:', data[0].ITE_PEDIDO, data[0].ite_pedido);
            }

            for (const row of data) {
                // Mapping (ajuste conforme colunas do Excel)
                // Assumindo nomes: ite_pedido, ite_produto, ite_industria, ite_quant, ite_valor, ite_total, ite_ipi, ite_totliquido, ite_comissao, ite_rentab

                // Sanitização básica
                const pedido = parseInt(row.ITE_PEDIDO || row.ite_pedido);
                if (!pedido) continue; // Pula se não tiver ID do pedido

                values.push(
                    pedido,
                    (row.ITE_PRODUTO || row.ite_produto || '').toString().trim(),
                    parseInt(row.ITE_INDUSTRIA || row.ite_industria || row.PED_INDUSTRIA || row.ped_industria) || 0,
                    parseFloat(row.ITE_QUANT || row.ite_quant) || 0,
                    parseFloat(row.ITE_PUNI || row.ite_puni || row.ITE_VALOR || row.ite_valor) || 0,
                    parseFloat(row.ITE_TOTBRUTO || row.ite_totbruto || row.ITE_TOTAL || row.ite_total) || 0,
                    parseFloat(row.ITE_IPI || row.ite_ipi) || 0,
                    parseFloat(row.ITE_TOTLIQUIDO || row.ite_totliquido) || 0,
                    parseFloat(row.ITE_COMISSAO || row.ite_comissao) || 0,
                    parseFloat(row.ITE_RENTAB || row.ite_rentab) || 0,
                    parseFloat(row.ITE_PRODCLIENTE || row.ite_prodcliente || 0)
                );

                // Gerar placeholder ($1, $2, ...)
                const offset = rowCount * 11; // 11 colunas
                placeholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10}, $${offset + 11})`);

                rowCount++;

                // Executar Batch
                if (rowCount === batchSize) {
                    const query = `
                        INSERT INTO itens_ped (
                            ite_pedido, ite_produto, ite_industria, ite_quant, 
                            ite_valor, ite_total, ite_ipi, ite_totliquido, 
                            ite_comissao, ite_rentab, ite_prodcliente
                        ) VALUES ${placeholders.join(',')}
                    `;
                    try {
                        await client.query(query, values);
                        totalImported += rowCount;
                        process.stdout.write('.');
                    } catch (e) {
                        console.error(`\n❌ Falha no lote batch: ${e.message}`);
                    }

                    // Reset
                    values.length = 0;
                    placeholders.length = 0;
                    rowCount = 0;
                }
            }

            // Inserir remanescentes
            if (rowCount > 0) {
                process.stdout.write(` [Inserindo ${rowCount}...] `);
                const query = `
                    INSERT INTO itens_ped (
                        ite_pedido, ite_produto, ite_industria, ite_quant, 
                        ite_valor, ite_total, ite_ipi, ite_totliquido, 
                        ite_comissao, ite_rentab, ite_prodcliente
                    ) VALUES ${placeholders.join(',')}
                `;
                try {
                    await client.query(query, values);
                    totalImported += rowCount;
                    process.stdout.write('OK.');
                } catch (e) {
                    console.error(`\n❌ Falha no lote: ${e.message}`);
                }
            }
            console.log(' ✅ OK');
        }

        const duration = (Date.now() - startTime) / 1000;
        console.log(`\n🎉 Importação Concluída!`);
        console.log(`📥 Total de registros importados: ${totalImported}`);
        console.log(`⏱️  Tempo total: ${duration.toFixed(2)}s`);

    } catch (err) {
        console.error('\n❌ Erro durante a importação:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

importBatch();
