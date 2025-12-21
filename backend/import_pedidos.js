// ============================================================================
// SalesMasters - Import PEDIDOS from XLSX
// Execute this with: node import_pedidos.js
// ============================================================================

const { Pool } = require('pg');
const XLSX = require('xlsx');
const path = require('path');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'basesales',
    user: 'postgres',
    password: '@12Pilabo',
});

// Column mapping from XLSX (UPPERCASE) to PostgreSQL (lowercase)
const columnMapping = {
    'PED_NUMERO': 'ped_numero',
    'PED_PEDIDO': 'ped_pedido',
    'PED_TABELA': 'ped_tabela',
    'PED_DATA': 'ped_data',
    'PED_INDUSTRIA': 'ped_industria',
    'PED_CLIENTE': 'ped_cliente',
    'PED_TRANSP': 'ped_transp',
    'PED_VENDEDOR': 'ped_vendedor',
    'PED_SITUACAO': 'ped_situacao',
    'PED_PRI': 'ped_pri',
    'PED_SEG': 'ped_seg',
    'PED_TER': 'ped_ter',
    'PED_QUA': 'ped_qua',
    'PED_QUI': 'ped_qui',
    'PED_SEX': 'ped_sex',
    'PED_SET': 'ped_set',
    'PED_OIT': 'ped_oit',
    'PED_NOV': 'ped_nov',
    'PED_CONDPAG': 'ped_condpag',
    'PED_TIPOFRETE': 'ped_tipofrete',
    'PED_TOTLIQ': 'ped_totliq',
    'PED_TOTBRUTO': 'ped_totbruto',
    'PED_TOTALIPI': 'ped_totalipi',
    'PED_COMPRADOR': 'ped_comprador',
    'PED_OBSFORA': 'ped_obsfora',
    'PED_EXPORTADO': 'ped_exportado',
    'PED_ENVIADO': 'ped_enviado',
    'PED_DATAENVIO': 'ped_dataenvio',
    'GID1': 'gid'  // Using GID1 from Excel
};



function parseExcelDate(excelDate) {
    if (!excelDate) return null;
    if (excelDate instanceof Date) return excelDate;

    // Excel stores dates as numbers (days since 1900-01-01)
    if (typeof excelDate === 'number') {
        const date = new Date((excelDate - 25569) * 86400 * 1000);
        return date;
    }

    // If it's already a string, try to parse it
    if (typeof excelDate === 'string') {
        const parsed = new Date(excelDate);
        if (!isNaN(parsed.getTime())) return parsed;
    }

    return null;
}

function sanitizeValue(value, columnName) {
    // Handle NULL values for NOT NULL columns with defaults
    if (value === null || value === undefined || value === '') {
        // Provide defaults for NOT NULL columns
        if (columnName === 'ped_numero') return 0;
        if (columnName === 'ped_pedido') return '';
        if (columnName === 'ped_tabela') return 'N/A';
        if (columnName === 'ped_industria') return 0;
        if (columnName === 'ped_cliente') return 0;
        if (columnName === 'ped_transp') return 0;
        if (columnName === 'ped_vendedor') return 0;

        return null;
    }

    // Handle dates
    if (columnName.includes('data') || columnName.includes('dat') || columnName.includes('envio')) {
        return parseExcelDate(value);
    }

    // Handle booleans
    if (columnName === 'ped_porgrupo') {
        if (typeof value === 'boolean') return value;
        if (typeof value === 'string') return value.toLowerCase() === 'true' || value === '1';
        if (typeof value === 'number') return value === 1;
        return false;
    }

    // Handle numbers
    if (typeof value === 'number') return value;

    // Handle strings
    if (typeof value === 'string') {
        return value.trim();
    }

    return value;
}

async function importPedidos() {
    const client = await pool.connect();

    try {
        console.log('\n========================================');
        console.log('  SalesMasters - Import PEDIDOS');
        console.log('========================================\n');

        // Read XLSX file
        const xlsxPath = path.join(__dirname, '..', 'data', 'pedidos.xlsx');
        console.log(`📂 Reading file: ${xlsxPath}`);


        const workbook = XLSX.readFile(xlsxPath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        console.log(`📊 Found ${data.length} records in Excel file\n`);

        if (data.length === 0) {
            console.log('⚠️  No data to import!');
            return;
        }

        // Start transaction
        await client.query('BEGIN');

        let inserted = 0;
        let updated = 0;
        let errors = 0;

        console.log('🔄 Starting import...\n');

        for (let i = 0; i < data.length; i++) {
            const row = data[i];

            try {
                // Build column names and values
                const columns = [];
                const values = [];
                const placeholders = [];

                Object.keys(columnMapping).forEach((excelCol, idx) => {
                    const dbCol = columnMapping[excelCol];
                    const value = sanitizeValue(row[excelCol], dbCol);

                    columns.push(dbCol);
                    values.push(value);
                    placeholders.push(`$${idx + 1}`);
                });

                // Simple INSERT query (no UPSERT since table has no PRIMARY KEY)
                const insertQuery = `
                    INSERT INTO pedidos (${columns.join(', ')})
                    VALUES (${placeholders.join(', ')})
                `;

                await client.query(insertQuery, values);
                inserted++;

                // Progress indicator
                if ((i + 1) % 100 === 0) {
                    console.log(`   Processed ${i + 1}/${data.length} records...`);
                }

            } catch (error) {
                errors++;
                console.error(`   ❌ Error on row ${i + 1} (ped_pedido: ${row.ped_pedido}):`, error.message);

                // Continue with next record instead of stopping
                if (errors > 50) {
                    console.error('\n⚠️  Too many errors (>50), stopping import...');
                    throw new Error('Too many errors during import');
                }
            }
        }

        // Commit transaction
        await client.query('COMMIT');

        console.log('\n========================================');
        console.log('  Import Summary');
        console.log('========================================');
        console.log(`✅ Total records processed: ${data.length}`);
        console.log(`✅ Inserted: ${inserted}`);
        console.log(`✅ Updated: ${updated}`);
        console.log(`❌ Errors: ${errors}`);
        console.log('========================================\n');

        // Verify count
        const countResult = await client.query('SELECT COUNT(*) FROM pedidos');
        console.log(`📊 Total records in database: ${countResult.rows[0].count}\n`);

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('\n❌ ERROR:', error.message);
        console.error('\nFull error:', error);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

importPedidos();
