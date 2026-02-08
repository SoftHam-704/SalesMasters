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

const SCHEMA = process.env.SCHEMA || 'soma';

async function importCidades() {
    try {
        console.log(`🚀 IMPORTANDO CIDADES -> SCHEMA: [${SCHEMA}] (SaveInCloud)\n`);

        const filePath = process.env.EXCEL_FILE || path.join(__dirname, '../../data/cidades.xlsx');
        if (!require('fs').existsSync(filePath)) {
            console.error(`❌ ERRO: Arquivo não encontrado em ${filePath}`);
            return;
        }

        const workbook = XLSX.readFile(filePath);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(worksheet);

        console.log(`📊 ${data.length} registros encontrados no Excel\n`);

        await pool.query(`SET search_path TO "${SCHEMA}"`);

        const BATCH_SIZE = 1000;
        let batch = [];
        let imported = 0;
        let errors = 0;

        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const cid_codigo = row.CODIGO || row.cid_codigo || row.cid_cod_origem || row.CID_CODIGO;
            const cid_nome = row.NOME || row.cid_nome || row.NOMMUN || row.CID_NOME;
            const cid_uf = row.UF || row.cid_uf || row.ESTADO || row.CID_UF;
            const cid_ibge = row.CODMUN || row.cid_ibge || row.IBGE || row.CID_IBGE;

            if (!cid_codigo || !cid_nome) continue;

            batch.push({
                cid_codigo,
                cid_nome,
                cid_uf,
                cid_ibge,
                cid_ativo: true,
                cid_cod_origem: cid_codigo
            });

            if (batch.length >= BATCH_SIZE || i === data.length - 1) {
                try {
                    // Monta a query de Bulk Insert
                    const values = [];
                    const placeholders = [];
                    let counter = 1;

                    batch.forEach(item => {
                        placeholders.push(`($${counter++}, $${counter++}, $${counter++}, $${counter++}, $${counter++}, $${counter++})`);
                        values.push(item.cid_codigo, item.cid_nome, item.cid_uf, item.cid_ibge, item.cid_ativo, item.cid_cod_origem);
                    });

                    const query = `
                        INSERT INTO cidades (cid_codigo, cid_nome, cid_uf, cid_ibge, cid_ativo, cid_cod_origem) 
                        VALUES ${placeholders.join(',')}
                        ON CONFLICT (cid_codigo) DO UPDATE SET 
                            cid_nome = EXCLUDED.cid_nome,
                            cid_uf = EXCLUDED.cid_uf,
                            cid_ibge = EXCLUDED.cid_ibge
                    `;

                    await pool.query(query, values);
                    imported += batch.length;
                    batch = [];
                    process.stdout.write(`\r🚀 Importado: ${imported}/${data.length}`);
                } catch (err) {
                    console.error(`\n❌ Erro no lote: ${err.message}`);
                    errors += batch.length;
                    batch = [];
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

importCidades();
