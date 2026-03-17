
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

const schema = 'eticarep';

async function verifySequences() {
    try {
        console.log(`🔍 Auditando TODAS as sequências do schema ${schema}...`);

        // 1. Buscar todas as sequências do schema
        const seqRes = await pool.query(`
            SELECT sequence_name 
            FROM information_schema.sequences 
            WHERE sequence_schema = $1
        `, [schema]);

        const sequences = seqRes.rows;
        console.log(`📊 Encontradas ${sequences.length} sequências.`);

        // Mapeamento manual de Tabela -> Coluna -> Sequência (para maior precisão)
        const mapping = {
            'gen_cad_prod_id': { table: 'cad_prod', col: 'pro_id' },
            'pedidos_ped_numero_seq': { table: 'pedidos', col: 'ped_numero' },
            'gen_clientes_id': { table: 'clientes', col: 'cli_codigo' },
            'gen_vendedores_id': { table: 'vendedores', col: 'ven_codigo' },
            'gen_fornecedores_id': { table: 'fornecedores', col: 'for_codigo' },
            'gen_grupos_id': { table: 'grupos', col: 'gru_codigo' },
            'gen_transportadora_id': { table: 'transportadora', col: 'tra_codigo' },
            'itens_ped_ite_id_seq': { table: 'itens_ped', col: 'ite_id' },
            'cad_tabelaspre_itab_id_seq': { table: 'cad_tabelaspre', col: 'itab_id' },
            'area_atu_atu_id_seq': { table: 'area_atu', col: 'atu_id' }
        };

        for (const seq of sequences) {
            const seqName = seq.sequence_name;
            const mapInfo = mapping[seqName];

            try {
                // Obter valor atual da sequência
                const valRes = await pool.query(`SELECT last_value FROM ${schema}.${seqName}`);
                const lastVal = valRes.rows[0].last_value;

                let maxVal = 'N/A';
                let status = '⚪ Desconhecido';

                if (mapInfo) {
                    const maxRes = await pool.query(`SELECT MAX(${mapInfo.col}) as max_val FROM ${schema}.${mapInfo.table}`);
                    maxVal = maxRes.rows[0].max_val || 0;

                    if (lastVal >= maxVal) {
                        status = '✅ OK';
                    } else {
                        status = '❌ ATRASADA (Risco de erro)';
                    }
                }

                console.log(`- ${seqName.padEnd(30)} | Seq: ${lastVal.toString().padEnd(8)} | Max Tab: ${maxVal.toString().padEnd(8)} | Status: ${status}`);
            } catch (e) {
                console.warn(`⚠️ Não foi possível verificar ${seqName}:`, e.message);
            }
        }

    } catch (err) {
        console.error('❌ Erro durante a auditoria:', err);
    } finally {
        await pool.end();
    }
}

verifySequences();
