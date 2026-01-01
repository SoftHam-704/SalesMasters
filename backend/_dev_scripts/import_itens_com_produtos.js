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

// Normalizar código: remove tudo exceto letras e números
function normalizar(codigo) {
    if (!codigo) return '';
    return codigo.toString().replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
}

async function importarItensComProdutos() {
    const client = await pool.connect();

    try {
        console.log('📦 Carregando produtos existentes de cad_prod...');
        const prodRes = await client.query(`
            SELECT pro_id, pro_codprod, pro_codigonormalizado, pro_industria
            FROM cad_prod 
            WHERE pro_codigonormalizado IS NOT NULL AND pro_codigonormalizado != ''
        `);

        // Mapa: "industria|codigonormalizado" -> pro_id
        const produtoMap = new Map();
        prodRes.rows.forEach(p => {
            const key = `${p.pro_industria}|${p.pro_codigonormalizado}`;
            produtoMap.set(key, p.pro_id);
        });

        console.log(`   ✅ ${produtoMap.size} produtos carregados\n`);

        console.log('🗑️  Limpando tabela itens_ped...');
        await client.query('TRUNCATE TABLE itens_ped CASCADE');
        console.log('✅ Tabela limpa!\n');

        let totalImportado = 0;
        let produtosCriados = 0;
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

            console.log(`   📊 ${data.length} registros`);

            if (data.length === 0) continue;

            let importados = 0;
            const batchSize = 500;

            for (let i = 0; i < data.length; i += batchSize) {
                const batch = data.slice(i, i + batchSize);

                // PASSO 1: Identificar produtos únicos neste batch
                const produtosUnicos = new Set();
                for (const row of batch) {
                    const produto = (row.ITE_PRODUTO || '').toString().trim();
                    const codigoNorm = normalizar(produto);
                    const industria = parseInt(row.PED_INDUSTRIA || row.ITE_INDUSTRIA || 0);

                    if (codigoNorm && industria) {
                        const mapKey = `${industria}|${codigoNorm}`;
                        if (!produtoMap.has(mapKey)) {
                            produtosUnicos.add(JSON.stringify({ industria, produto, codigoNorm, mapKey }));
                        }
                    }
                }

                // PASSO 2: Criar produtos únicos que não existem
                for (const prodJson of produtosUnicos) {
                    const { industria, produto, codigoNorm, mapKey } = JSON.parse(prodJson);

                    try {
                        const insertProd = await client.query(`
                            INSERT INTO cad_prod (pro_industria, pro_codprod, pro_codigonormalizado, pro_nome)
                            VALUES ($1, $2, $3, $4)
                            RETURNING pro_id
                        `, [industria, produto, codigoNorm, produto]);

                        produtoMap.set(mapKey, insertProd.rows[0].pro_id);
                        produtosCriados++;
                    } catch (dupError) {
                        if (dupError.code === '23505') {
                            // Buscar existente
                            const existing = await client.query(`
                                SELECT pro_id 
                                FROM cad_prod 
                                WHERE pro_industria = $1 AND pro_codigonormalizado = $2
                            `, [industria, codigoNorm]);

                            if (existing.rows.length > 0) {
                                produtoMap.set(mapKey, existing.rows[0].pro_id);
                            }
                        } else {
                            console.error(`\n❌ Erro ao criar produto ${mapKey}:`, dupError.message);
                        }
                    }
                }

                // PASSO 3: Inserir itens_ped
                const values = [];
                const placeholders = [];
                let validRows = 0;

                for (const row of batch) {
                    const pedido = (row.ITE_PEDIDO || row.PED_PEDIDO || '').toString().trim();
                    if (!pedido) continue;

                    const produto = (row.ITE_PRODUTO || '').toString().trim();
                    const codigoNorm = normalizar(produto);
                    const industria = parseInt(row.PED_INDUSTRIA || row.ITE_INDUSTRIA || 0);

                    if (!codigoNorm || !industria) continue;

                    const mapKey = `${industria}|${codigoNorm}`;
                    const proId = produtoMap.get(mapKey);

                    if (!proId) {
                        console.warn(`\n⚠️  Produto ${mapKey} não encontrado no mapa - pulando item`);
                        continue;
                    }

                    // Valores para itens_ped
                    values.push(
                        pedido, produto, codigoNorm, proId, industria,
                        parseFloat(row.ITE_QUANT || 0),
                        parseFloat(row.ITE_PUNI || 0),
                        parseFloat(row.ITE_PUNILIQ || 0),
                        parseFloat(row.ITE_TOTLIQUIDO || 0),
                        parseFloat(row.ITE_TOTBRUTO || 0),
                        parseFloat(row.ITE_IPI || 0)
                    );

                    const offset = validRows * 11;
                    const params = [];
                    for (let j = 1; j <= 11; j++) {
                        params.push(`$${offset + j}`);
                    }
                    placeholders.push(`(${params.join(', ')})`);
                    validRows++;
                }

                if (validRows > 0) {
                    const query = `
                        INSERT INTO itens_ped (
                            ite_pedido, ite_produto, ite_codigonormalizado, ite_idproduto,
                            ite_industria, ite_quant, ite_puni, ite_puniliq,
                            ite_totliquido, ite_totbruto, ite_ipi
                        ) VALUES ${placeholders.join(', ')}
                    `;

                    await client.query(query, values);
                    importados += validRows;
                    process.stdout.write('.');
                }
            }

            totalImportado += importados;
            console.log(` ✅ ${importados} itens`);
        }

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`\n🎉 Importação Concluída!`);
        console.log(`📥 Itens importados: ${totalImportado}`);
        console.log(`🆕 Produtos criados: ${produtosCriados}`);
        console.log(`⏱️  Tempo: ${duration}s\n`);

        // Verificar
        const count = await client.query('SELECT COUNT(*) FROM itens_ped');
        const prodCount = await client.query('SELECT COUNT(*) FROM cad_prod');
        console.log(`✅ Itens na tabela: ${count.rows[0].count}`);
        console.log(`✅ Produtos na tabela: ${prodCount.rows[0].count}`);

    } catch (err) {
        console.error('❌ Erro:', err.message);
        console.error(err.stack);
    } finally {
        client.release();
        await pool.end();
    }
}

importarItensComProdutos();
