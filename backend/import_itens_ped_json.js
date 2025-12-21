// ============================================================================
// SalesMasters - Import ITENS_PED from JSON (Simple approach)
// Execute this with: node import_itens_ped_json.js
// ============================================================================

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'basesales',
    user: 'postgres',
    password: '@12Pilabo',
});

// Column mapping from JSON to PostgreSQL
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
    'ITE_PROMOCAO': 'ite_promocao',
    'ITE_STATUS': 'ite_status',
    'ITE_NUMPEDCLI': 'ite_numpedcli',
    'ITE_SEQ': 'ite_seq',
    'GID': 'gid'
};

function parseDate(dateStr) {
    if (!dateStr || dateStr.trim() === '') return null;

    const dateStr2 = String(dateStr).trim();

    // Try DD.MM.YYYY HH:MM format
    let match = dateStr2.match(/^(\d{2})\.(\d{2})\.(\d{4})(\s+(\d{2}):(\d{2}))?/);
    if (match) {
        const day = match[1];
        const month = match[2];
        const year = match[3];
        const time = match[5] && match[6] ? `${match[5]}:${match[6]}` : '00:00';
        return `${year}-${month}-${day} ${time}`;
    }

    // Try DD/MM/YYYY format
    match = dateStr2.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
    if (match) {
        const day = match[1];
        const month = match[2];
        const year = match[3];
        return `${year}-${month}-${day} 00:00`;
    }

    return null;
}

function sanitizeValue(value, columnName) {
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

    return value;
}

async function importItensPedJSON() {
    const client = await pool.connect();

    try {
        console.log('\n========================================');
        console.log('  SalesMasters - Import ITENS_PED (JSON)');
        console.log('========================================\n');

        const jsonPath = path.join(__dirname, '..', 'data', 'itens_ped.json');
        console.log(`📂 Reading file: ${jsonPath}`);
        console.log(`📖 Loading JSON data (this may take a moment for large files)...\n`);

        // Read JSON file - increase memory if needed
        const jsonData = fs.readFileSync(jsonPath, 'utf8');
        console.log('✅ File loaded, parsing JSON...\n');

        const jsonObj = JSON.parse(jsonData);

        // Handle ibExpress format: {"RecordSet": [...]}
        const data = jsonObj.RecordSet || jsonObj;

        console.log(`📊 Found ${data.length} records in JSON file\n`);

        if (!Array.isArray(data) || data.length === 0) {
            console.log('⚠️  No data to import or invalid JSON format!');
            console.log('JSON structure:', Object.keys(jsonObj));
            return;
        }

        // Start transaction
        await client.query('BEGIN');

        let inserted = 0;
        let errors = 0;
        const BATCH_SIZE = 500;

        console.log('🔄 Starting import...\n');

        for (let i = 0; i < data.length; i++) {
            const row = data[i];

            try {
                // Build column names and values
                const columns = [];
                const values = [];
                const placeholders = [];
                let paramIndex = 1;

                Object.keys(columnMapping).forEach((jsonCol) => {
                    const dbCol = columnMapping[jsonCol];
                    const value = sanitizeValue(row[jsonCol], dbCol);

                    columns.push(dbCol);
                    values.push(value);
                    placeholders.push(`$${paramIndex++}`);
                });

                // Insert query
                const insertQuery = `
                    INSERT INTO itens_ped (${columns.join(', ')})
                    VALUES (${placeholders.join(', ')})
                `;

                await client.query(insertQuery, values);
                inserted++;

                // Progress indicator
                if ((i + 1) % BATCH_SIZE === 0) {
                    console.log(`   Processed ${i + 1}/${data.length} records... (Inserted: ${inserted}, Errors: ${errors})`);
                }

            } catch (error) {
                errors++;
                if (errors <= 10) {
                    console.error(`   ❌ Error on row ${i + 1}:`, error.message);
                }

                // Stop if too many errors
                if (errors > 100) {
                    console.error('\n⚠️  Too many errors (>100), stopping import...');
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

importItensPedJSON();
