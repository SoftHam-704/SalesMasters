// ============================================================================
// SalesMasters - Import ITENS_PED from CSV
// Execute this with: node import_itens_ped.js
// ============================================================================

const { Pool } = require('pg');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'basesales',
    user: 'postgres',
    password: '@12Pilabo',
});

// Column mapping from CSV (UPPERCASE) to PostgreSQL (lowercase)
const columnMapping = {
    'ITE_LANCTO': 'ite_lancto',
    'ITE_PEDIDO': 'ite_pedido',
    'ITE_INDUSTRIA': 'ite_industria',
    'ITE_IDPRODUTO': 'ite_idproduto',
    'ITE_PRODUTO': 'ite_produto',
    'ITE_NORMALIZADO': 'ite_normalizado',
    'ITE_EMBUCH': 'ite_embuch',
    'ITE_NOMEPROD': 'ite_nomeprod',
    'ITE_GRUPO': 'ite_grupo',
    'ITE_DATA': 'ite_data',
    'ITE_QUANT': 'ite_quant',
    'ITE_PUNI': 'ite_puni',
    'ITE_PUNILIQ': 'ite_puniliq',
    'ITE_TOTLIQUIDO': 'ite_totliquido',
    'ITE_DES1': 'ite_des1',
    'ITE_DES2': 'ite_des2',
    'ITE_DES3': 'ite_des3',
    'ITE_DES4': 'ite_des4',
    'ITE_DES5': 'ite_des5',
    'ITE_DES6': 'ite_des6',
    'ITE_DES7': 'ite_des7',
    'ITE_DES8': 'ite_des8',
    'ITE_DES9': 'ite_des9',
    'ITE_DES10': 'ite_des10',
    'ITE_DES11': 'ite_des11',
    'ITE_DESCADIC': 'ite_descadic',
    'ITE_DESCONTOS': 'ite_descontos',
    'ITE_TOTBRUTO': 'ite_totbruto',
    'ITE_VALCOMIPI': 'ite_valcomipi',
    'ITE_IPI': 'ite_ipi',
    'ITE_ST': 'ite_st',
    'ITE_VALCOMST': 'ite_valcomst',
    'ITE_PUNILIQCOMIMPOSTO': 'ite_puniliqcomimposto',
    'ITE_FATURADO': 'ite_faturado',
    'ITE_QTDFAT': 'ite_qtdfat',
    'ITE_EXPORTADO': 'ite_exportado',
    'ITE_STATUS': 'ite_status',
    'ITE_NUMPEDCLI': 'ite_numpedcli',
    'ITE_SEQ': 'ite_seq',
    'GID': 'gid'
};

function parseDate(dateStr) {
    if (!dateStr || dateStr.trim() === '') return null;

    // Handle DD.MM.YYYY HH:MM format
    const parts = dateStr.split(' ');
    if (parts.length >= 1) {
        const dateParts = parts[0].split('.');
        if (dateParts.length === 3) {
            const day = dateParts[0];
            const month = dateParts[1];
            const year = dateParts[2];
            const time = parts.length > 1 ? parts[1] : '00:00';

            // Create ISO format: YYYY-MM-DD HH:MM
            return `${year}-${month}-${day} ${time}`;
        }
    }

    return null;
}

function sanitizeValue(value, columnName) {
    // Handle NULL values for NOT NULL columns with defaults
    if (value === null || value === undefined || value === '') {
        // Provide defaults for NOT NULL columns
        if (columnName === 'ite_lancto') return 0;
        if (columnName === 'ite_pedido') return '';
        if (columnName === 'ite_industria') return 0;
        if (columnName === 'ite_idproduto') return 0;
        if (columnName === 'ite_produto') return '';

        return null;
    }

    // Handle dates
    if (columnName === 'ite_data') {
        return parseDate(value);
    }

    // Handle numbers with German/Brazilian format (dot = thousands, comma = decimal)
    if (typeof value === 'string') {
        // Check if it's a number-like string
        const trimmed = value.trim();

        // For integer columns (ite_lancto, ite_qtdfat, etc.)
        if (columnName === 'ite_lancto' || columnName === 'ite_qtdfat' ||
            columnName === 'ite_industria' || columnName === 'ite_idproduto' ||
            columnName === 'ite_grupo' || columnName === 'ite_seq') {
            // Remove dots (thousands separator) and parse as integer
            const cleanedInt = trimmed.replace(/\./g, '');
            const intValue = parseInt(cleanedInt);
            if (!isNaN(intValue)) return intValue;
        }

        // For decimal columns
        if (trimmed.match(/^-?\d{1,3}(\.\d{3})*(,\d+)?$/)) {
            // Remove dots (thousands) and replace comma with dot (decimal)
            const cleanedNum = trimmed.replace(/\./g, '').replace(',', '.');
            const numValue = parseFloat(cleanedNum);
            if (!isNaN(numValue)) return numValue;
        }

        // Return trimmed string if not a number
        return trimmed;
    }

    // Handle numbers
    if (typeof value === 'number') return value;

    return value;
}

async function importItensPed() {
    const client = await pool.connect();

    try {
        console.log('\n========================================');
        console.log('  SalesMasters - Import ITENS_PED');
        console.log('========================================\n');

        const csvPath = path.join(__dirname, '..', 'data', 'itens_ped.csv');
        console.log(`📂 Reading file: ${csvPath}`);
        console.log(`⚙️  Using semicolon (;) as delimiter\n`);

        const records = [];
        let totalRows = 0;
        let inserted = 0;
        let errors = 0;
        const BATCH_SIZE = 500; // Process in batches for better performance

        // Start transaction
        await client.query('BEGIN');

        console.log('🔄 Starting import...\n');

        // Read CSV file
        const stream = fs.createReadStream(csvPath)
            .pipe(csv({ separator: ';' }));

        for await (const row of stream) {
            totalRows++;

            try {
                // Build column names and values
                const columns = [];
                const values = [];
                const placeholders = [];
                let paramIndex = 1;

                Object.keys(columnMapping).forEach((csvCol) => {
                    const dbCol = columnMapping[csvCol];
                    const value = sanitizeValue(row[csvCol], dbCol);

                    columns.push(dbCol);
                    values.push(value);
                    placeholders.push(`$${paramIndex++}`);
                });

                records.push({ columns, values, placeholders });

                // Insert in batches
                if (records.length >= BATCH_SIZE) {
                    for (const record of records) {
                        try {
                            const insertQuery = `
                                INSERT INTO itens_ped (${record.columns.join(', ')})
                                VALUES (${record.placeholders.join(', ')})
                            `;

                            await client.query(insertQuery, record.values);
                            inserted++;
                        } catch (err) {
                            errors++;
                            if (errors <= 10) {
                                console.error(`   ❌ Error on row ${totalRows}:`, err.message);
                            }
                        }
                    }

                    console.log(`   Processed ${totalRows} records... (Inserted: ${inserted}, Errors: ${errors})`);
                    records.length = 0; // Clear batch
                }

            } catch (error) {
                errors++;
                if (errors <= 10) {
                    console.error(`   ❌ Error parsing row ${totalRows}:`, error.message);
                }
            }
        }

        // Process remaining records
        if (records.length > 0) {
            for (const record of records) {
                try {
                    const insertQuery = `
                        INSERT INTO itens_ped (${record.columns.join(', ')})
                        VALUES (${record.placeholders.join(', ')})
                    `;

                    await client.query(insertQuery, record.values);
                    inserted++;
                } catch (err) {
                    errors++;
                    if (errors <= 10) {
                        console.error(`   ❌ Error on final batch:`, err.message);
                    }
                }
            }
        }

        // Commit transaction
        await client.query('COMMIT');

        console.log('\n========================================');
        console.log('  Import Summary');
        console.log('========================================');
        console.log(`✅ Total records processed: ${totalRows}`);
        console.log(`✅ Inserted: ${inserted}`);
        console.log(`❌ Errors: ${errors}`);
        console.log('========================================\n');

        // Verify count
        const countResult = await client.query('SELECT COUNT(*) FROM itens_ped');
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

importItensPed();
