const XLSX = require('xlsx');
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config();

// Configuração do PostgreSQL
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function importVendedorInd() {
    const client = await pool.connect();

    try {
        console.log('🚀 Iniciando importação de vendedor_ind...\n');

        // Caminho da planilha
        const filePath = path.join(__dirname, '..', 'data', 'vendedor_ind.xlsx');
        console.log(`📂 Lendo arquivo: ${filePath}`);

        // Ler a planilha
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        console.log(`📊 Total de registros encontrados: ${data.length}\n`);

        // Contador de registros
        let inserted = 0;
        let updated = 0;
        let errors = 0;

        // Processar cada linha
        for (const row of data) {
            try {
                const query = `
                    INSERT INTO vendedor_ind (
                        vin_codigo,
                        vin_industria,
                        vin_percom,
                        gid
                    ) VALUES ($1, $2, $3, $4)
                    ON CONFLICT (vin_codigo, vin_industria) 
                    DO UPDATE SET
                        vin_percom = EXCLUDED.vin_percom,
                        gid = EXCLUDED.gid
                `;

                const values = [
                    row.VIN_CODIGO || null,           // INTEGER - código do vendedor
                    row.VIN_INDUSTRIA || null,        // SMALLINT - código da indústria
                    row.VIN_PERCOM || null,           // DOUBLE PRECISION - percentual de comissão
                    row.GID || null                   // VARCHAR(38) - GUID
                ];

                const result = await client.query(query, values);

                if (result.rowCount > 0) {
                    // Verifica se foi INSERT ou UPDATE baseado no comando
                    if (result.command === 'INSERT') {
                        inserted++;
                    } else {
                        updated++;
                    }
                }

            } catch (error) {
                errors++;
                console.error(`❌ Erro ao processar registro:`, error.message);
                console.error(`   Dados: VIN_CODIGO=${row.VIN_CODIGO}, VIN_INDUSTRIA=${row.VIN_INDUSTRIA}`);
            }
        }

        console.log('\n✅ Importação concluída!');
        console.log(`📈 Estatísticas:`);
        console.log(`   - Inseridos: ${inserted}`);
        console.log(`   - Atualizados: ${updated}`);
        console.log(`   - Erros: ${errors}`);
        console.log(`   - Total processado: ${data.length}`);

        // Mostrar alguns registros de exemplo
        console.log('\n📋 Exemplos de registros importados:');
        const sampleQuery = `
            SELECT 
                vi.vin_codigo,
                v.ven_nome as vendedor,
                vi.vin_industria,
                f.for_nomered as industria,
                vi.vin_percom
            FROM vendedor_ind vi
            LEFT JOIN vendedores v ON v.ven_codigo = vi.vin_codigo
            LEFT JOIN fornecedores f ON f.for_codigo = vi.vin_industria
            ORDER BY vi.vin_codigo, vi.vin_industria
            LIMIT 5
        `;

        const sampleResult = await client.query(sampleQuery);
        console.table(sampleResult.rows);

        // Estatísticas finais
        const statsQuery = `
            SELECT 
                COUNT(*) as total_registros,
                COUNT(DISTINCT vin_codigo) as total_vendedores,
                COUNT(DISTINCT vin_industria) as total_industrias,
                AVG(vin_percom) as comissao_media,
                MIN(vin_percom) as comissao_minima,
                MAX(vin_percom) as comissao_maxima
            FROM vendedor_ind
        `;

        const statsResult = await client.query(statsQuery);
        console.log('\n📊 Estatísticas da tabela vendedor_ind:');
        console.table(statsResult.rows);

    } catch (error) {
        console.error('❌ Erro fatal durante importação:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Executar importação
importVendedorInd()
    .then(() => {
        console.log('\n✨ Processo finalizado com sucesso!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Erro fatal:', error);
        process.exit(1);
    });
