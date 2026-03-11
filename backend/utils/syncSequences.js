/**
 * utils/syncSequences.js
 * ============================================================
 * Módulo utilitário: sincroniza TODAS as sequences/generators
 * de um schema PostgreSQL com o MAX() real das tabelas.
 *
 * Uso típico — chamar no final de qualquer script de importação:
 *
 *   const { syncSequences } = require('./utils/syncSequences');
 *   ...
 *   await importData(pool, schema);
 *   await syncSequences(pool, schema);   // ← sempre ao final
 *
 * ============================================================
 */

// Generators legados estilo Delphi/Firebird que NÃO estão
// vinculados via DEFAULT nextval() — devem ser mapeados aqui.
const LEGACY_GENERATORS = [
    { seq: 'gen_cad_prod_id', table: 'cad_prod', col: 'pro_id' },
    { seq: 'gen_produtos_id', table: 'cad_prod', col: 'pro_id' },
    { seq: 'gen_clientes_id', table: 'clientes', col: 'cli_codigo' },
    { seq: 'gen_vendedores_id', table: 'vendedores', col: 'ven_codigo' },
    { seq: 'gen_fornecedores_id', table: 'fornecedores', col: 'for_codigo' },
    { seq: 'gen_grupos_id', table: 'grupos', col: 'gru_codigo' },
    { seq: 'gen_transportadora_id', table: 'transportadora', col: 'tra_codigo' },
    { seq: 'gen_pedidos_id', table: 'pedidos', col: 'ped_numero' },
    { seq: 'gen_regioes_id', table: 'regioes', col: 'reg_codigo' },
    { seq: 'gen_tabelas_preco_id', table: 'cad_tabelaspre', col: 'itab_id' },
    { seq: 'gen_parametros_id', table: 'parametros', col: 'par_id' },
    { seq: 'gen_area_atu_id', table: 'area_atu', col: 'atu_id' },
    { seq: 'gen_forma_pagamento_id', table: 'forma_pagamento', col: 'fpg_codigo' },
    { seq: 'gen_grupo_desc_id', table: 'grupo_desc', col: 'gde_id' },
    { seq: 'gen_user_nomes_id', table: 'user_nomes', col: 'codigo' },
    { seq: 'gen_cli_aniv_id', table: 'cli_aniv', col: 'ani_lancto' },
    { seq: 'gen_cli_ind_id', table: 'cli_ind', col: 'cli_lancamento' },
    { seq: 'gen_contaspgrec_id', table: 'cad_contaspgrec', col: 'cpr_id' },
    { seq: 'gen_ccustos_id', table: 'ccustos', col: 'cc_id' },
    { seq: 'gen_contas_id', table: 'contas', col: 'con_codigo' },
    { seq: 'gen_contato_for_id', table: 'contato_for', col: 'con_codigo' },
    { seq: 'gen_bandeira_id', table: 'bandeira', col: 'codigo' },
];

/**
 * Verifica se uma tabela ou sequence existe no schema.
 */
async function objectExists(pool, type, schema, name) {
    const isTable = type === 'table';
    const r = await pool.query(
        `SELECT 1 FROM information_schema.${isTable ? 'tables' : 'sequences'}
         WHERE ${isTable ? 'table_schema' : 'sequence_schema'} = $1
           AND ${isTable ? 'table_name' : 'sequence_name'}   = $2`,
        [schema, name]
    );
    return r.rowCount > 0;
}

/**
 * Retorna o MAX() de uma coluna ou null se a coluna não existir.
 */
async function getMax(pool, schema, table, col) {
    try {
        const r = await pool.query(
            `SELECT COALESCE(MAX("${col}"), 0) AS m FROM "${schema}"."${table}"`
        );
        return parseInt(r.rows[0].m) || 0;
    } catch {
        return null;
    }
}

/**
 * Aplica setval para uma sequence.
 * - maxVal > 0 → setval(seq, maxVal, true)  → próximo = maxVal + 1
 * - maxVal = 0 → setval(seq, 1, false)      → próximo = 1
 */
async function applySetval(pool, schema, seqName, maxVal) {
    if (maxVal > 0) {
        await pool.query(
            `SELECT setval('"${schema}"."${seqName}"', $1, true)`,
            [maxVal]
        );
    } else {
        await pool.query(`SELECT setval('"${schema}"."${seqName}"', 1, false)`);
    }
}

/**
 * syncSequences(pool, schema)
 * ─────────────────────────────────────────────────────────────
 * Sincroniza TODAS as sequences do `schema` com o valor real
 * das tabelas. Deve ser chamado APÓS qualquer importação de dados.
 *
 * @param {import('pg').Pool} pool   - Pool PostgreSQL já conectado
 * @param {string}            schema - Nome do schema tenant
 * @returns {Promise<{auto: number, manual: number, errors: string[]}>}
 */
async function syncSequences(pool, schema) {
    const result = { auto: 0, manual: 0, errors: [] };

    console.log(`\n🔁 [syncSequences] Sincronizando sequences do schema "${schema}"...`);

    // ── FASE 1: Sequences vinculadas via DEFAULT nextval() ────
    const linked = (await pool.query(`
        SELECT
            c.table_name,
            c.column_name,
            substring(c.column_default from 'nextval\\(''([^'']+)''') AS seq_raw
        FROM information_schema.columns c
        WHERE c.table_schema = $1
          AND c.column_default LIKE 'nextval%'
    `, [schema])).rows;

    for (const r of linked) {
        const seqName = (r.seq_raw || '').replace(/^.*\./, '').replace(/"/g, '');
        if (!seqName) continue;
        if (!await objectExists(pool, 'sequence', schema, seqName)) continue;

        const maxVal = await getMax(pool, schema, r.table_name, r.column_name);
        if (maxVal === null) continue;

        try {
            await applySetval(pool, schema, seqName, maxVal);
            result.auto++;
        } catch (e) {
            result.errors.push(`[AUTO] ${seqName}: ${e.message}`);
        }
    }

    // ── FASE 2: Generators legados Delphi/Firebird ────────────
    for (const m of LEGACY_GENERATORS) {
        if (!await objectExists(pool, 'sequence', schema, m.seq)) continue;
        if (!await objectExists(pool, 'table', schema, m.table)) continue;

        const maxVal = await getMax(pool, schema, m.table, m.col);
        if (maxVal === null) continue;

        try {
            await applySetval(pool, schema, m.seq, maxVal);
            result.manual++;
        } catch (e) {
            result.errors.push(`[GEN] ${m.seq}: ${e.message}`);
        }
    }

    // ── Resultado ─────────────────────────────────────────────
    const total = result.auto + result.manual;
    if (result.errors.length === 0) {
        console.log(`✅ [syncSequences] ${total} sequences sincronizadas (auto=${result.auto}, gen=${result.manual})`);
    } else {
        console.warn(`⚠️  [syncSequences] ${total} sincronizadas, ${result.errors.length} erro(s):`);
        result.errors.forEach(e => console.warn(`   • ${e}`));
    }

    return result;
}

module.exports = { syncSequences };
