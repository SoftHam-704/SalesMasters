const XLSX = require('xlsx');
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: false
});

const SCHEMA = 'ro_consult';

function parseExcelDate(excelDate) {
    if (!excelDate) return null;
    if (excelDate instanceof Date) return excelDate;
    if (typeof excelDate === 'number') {
        const date = new Date((excelDate - 25569) * 86400 * 1000);
        return date;
    }
    const parsed = new Date(excelDate);
    if (!isNaN(parsed.getTime())) return parsed;
    return null;
}

async function importPedidos() {
    try {
        console.log(`🚀 IMPORTANDO PEDIDOS -> SCHEMA: [${SCHEMA}] (SaveInCloud)\n`);

        const filePath = path.join(__dirname, '../../data/pedidos.xlsx');
        if (!require('fs').existsSync(filePath)) {
            console.error(`❌ ERRO: Arquivo não encontrado em ${filePath}`);
            return;
        }

        const workbook = XLSX.readFile(filePath);
        const data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

        console.log(`📊 ${data.length} registros encontrados no Excel\n`);

        await pool.query(`SET search_path TO "${SCHEMA}"`);

        let imported = 0;
        let errors = 0;

        for (const row of data) {
            try {
                const query = `
                    INSERT INTO pedidos (
                        ped_pedido, ped_industria, ped_data, ped_cliente, 
                        ped_vendedor, ped_tabela, ped_transp, ped_situacao, 
                        ped_totliq, ped_totbruto, ped_totalipi, ped_comprador, gid
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                    ON CONFLICT (ped_pedido, ped_industria) DO UPDATE SET
                        ped_situacao = EXCLUDED.ped_situacao,
                        ped_totliq = EXCLUDED.ped_totliq,
                        ped_transp = EXCLUDED.ped_transp
                `;

                const values = [
                    String(row.PED_PEDIDO || ''),
                    parseInt(row.PED_INDUSTRIA || 0),
                    parseExcelDate(row.PED_DATA),
                    parseInt(row.PED_CLIENTE || 0),
                    parseInt(row.PED_VENDEDOR || 0),
                    String(row.PED_TABELA || ''),
                    parseInt(row.PED_TRANSP || 0),
                    String(row.PED_SITUACAO || 'P'),
                    parseFloat(row.PED_TOTLIQ || 0),
                    parseFloat(row.PED_TOTBRUTO || 0),
                    parseFloat(row.PED_TOTALIPI || 0),
                    String(row.PED_COMPRADOR || ''),
                    String(row.GID1 || row.gid || '')
                ];

                await pool.query(query, values);
                imported++;

                if (imported % 100 === 0) {
                    process.stdout.write(`\r🚀 Processando: ${imported}/${data.length}`);
                }
            } catch (err) {
                errors++;
                if (errors <= 5) {
                    console.error(`\n❌ Erro no pedido [${row.PED_PEDIDO}]: ${err.message}`);
                }
            }
        }

        console.log(`\n\n✅ Importação concluída!`);
        console.log(`   Total: ${data.length} | Sucesso: ${imported} | Erros: ${errors}\n`);

    } catch (err) {
        console.error('❌ Erro fatal:', err.message);
    } finally {
        await pool.end();
    }
}

importPedidos();
