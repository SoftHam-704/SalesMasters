const XLSX = require('xlsx');
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'basesales',
    user: 'postgres',
    password: '@12Pilabo'
});

// Função para converter data serial do Excel
function excelDateToJSDate(serial) {
    if (!serial) return null;
    const utc_days = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400;
    const date_info = new Date(utc_value * 1000);
    return date_info;
}

async function importItensFile(fileName) {
    try {
        console.log(`\n📂 Iniciando importação: ${fileName}`);
        const filePath = path.join(__dirname, '../data', fileName);

        if (!fs.existsSync(filePath)) {
            throw new Error(`Arquivo não encontrado: ${filePath}`);
        }

        const workbook = XLSX.readFile(filePath);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(worksheet);

        console.log(`✅ Registros encontrados: ${data.length}`);

        let imported = 0;
        let errors = 0;

        // Processar em lotes para performance
        const BATCH_SIZE = 500;
        for (let i = 0; i < data.length; i += BATCH_SIZE) {
            const batch = data.slice(i, i + BATCH_SIZE);
            const client = await pool.connect();

            try {
                await client.query('BEGIN');

                for (const row of batch) {
                    // Converter data
                    const itemData = excelDateToJSDate(row.PED_DATA);

                    // Tratamento de valores numéricos
                    const parseNum = (val) => {
                        if (typeof val === 'number') return val;
                        if (!val) return 0;
                        return parseFloat(String(val).replace(',', '.'));
                    };

                    await client.query(`
                        INSERT INTO itens_ped (
                            ite_pedido, ite_industria, ite_produto, ite_idproduto,
                            ite_data, ite_quant, ite_puni, 
                            ite_totbruto, ite_totliquido, ite_ipi, ite_valcomipi,
                            ite_status, ite_seq, gid, ite_des1, ite_descadic
                        ) VALUES ($1, $2, $3, 0, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
                    `, [
                        row.PED_PEDIDO || row.ite_pedido || null,
                        parseNum(row.PED_INDUSTRIA),
                        String(row.ITE_CODIGO || row.ite_codigo || ''),
                        itemData,
                        parseNum(row.ITE_QTD),
                        parseNum(row.ITE_PRECO),
                        parseNum(row.ITE_TOTAL),
                        parseNum(row.ITE_TOTLIQ),
                        parseNum(row.ITE_IPI), // Valor IPI
                        parseNum(row.ITE_IPI), // Assumindo mesmo valor para valcomipi se não tiver coluna separada
                        row.ITE_STATUS || 'N',
                        parseNum(row.ITE_SEQ),
                        row.GID || null,
                        parseNum(row.ITE_DESCONTO),
                        parseNum(row.ITE_DESCONTO_ADD)
                    ]);
                }

                await client.query('COMMIT');
                imported += batch.length;
                process.stdout.write(`\r   Progresso: ${imported}/${data.length} (${Math.round((imported / data.length) * 100)}%)`);

            } catch (err) {
                await client.query('ROLLBACK');
                errors += batch.length;
                console.error(`\n❌ Erro no lote: ${err.message}`);
                // Break ou continue dependendo da gravidade? Continue para tentar próximos lotes
            } finally {
                client.release();
            }
        }

        console.log(`\n✅ Arquivo ${fileName} finalizado! Importados: ${imported} | Erros: ${errors}\n`);

    } catch (err) {
        console.error(`❌ Erro fatal ao processar ${fileName}:`, err.message);
    }
}

// Ler argumentos da linha de comando
const userFile = process.argv[2];
if (userFile) {
    importItensFile(userFile).then(() => pool.end());
} else {
    console.log('Por favor forneça o nome do arquivo.');
    pool.end();
}
