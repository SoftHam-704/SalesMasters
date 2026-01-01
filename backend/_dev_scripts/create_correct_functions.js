const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'basesales',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '@12Pilabo',
});

async function createCorrectFunctions() {
    const client = await pool.connect();
    try {
        console.log('📝 Criando funções corrigidas...\n');

        // Função 1: Listar tabelas de uma indústria
        await client.query(`
            CREATE OR REPLACE FUNCTION fn_listar_tabelas_industria(
                p_industria INTEGER
            )
            RETURNS TABLE (
                itab_idindustria INTEGER,
                itab_tabela VARCHAR(20),
                itab_datatabela DATE,
                itab_datavencimento DATE,
                itab_status BOOLEAN
            ) AS $$
            BEGIN
                RETURN QUERY
                SELECT
                    ct.itab_idindustria,
                    ct.itab_tabela,
                    MAX(ct.itab_datatabela) AS itab_datatabela,
                    MAX(ct.itab_datavencimento) AS itab_datavencimento,
                    BOOL_AND(ct.itab_status) AS itab_status
                FROM cad_tabelaspre ct
                WHERE ct.itab_idindustria = p_industria
                GROUP BY ct.itab_idindustria, ct.itab_tabela
                ORDER BY ct.itab_tabela;
            END;
            $$ LANGUAGE plpgsql;
        `);

        console.log('✅ fn_listar_tabelas_industria criada');

        // Função 2: Listar produtos de uma tabela
        await client.query(`
            CREATE OR REPLACE FUNCTION fn_listar_produtos_tabela(
                p_industria INTEGER,
                p_tabela VARCHAR(20)
            )
            RETURNS TABLE (
                itab_idprod INTEGER,
                itab_idindustria INTEGER,
                itab_tabela VARCHAR(20),
                pro_codprod VARCHAR(25),
                pro_nome VARCHAR(100),
                itab_grupodesconto INTEGER,
                itab_descontoadd DOUBLE PRECISION,
                itab_ipi DOUBLE PRECISION,
                itab_st DOUBLE PRECISION,
                itab_prepeso DOUBLE PRECISION,
                itab_precobruto DOUBLE PRECISION,
                itab_precopromo DOUBLE PRECISION,
                itab_precoespecial DOUBLE PRECISION,
                itab_datatabela DATE,
                itab_datavencimento DATE,
                itab_status BOOLEAN
            ) AS $$
            BEGIN
                RETURN QUERY
                SELECT
                    ct.itab_idprod,
                    ct.itab_idindustria,
                    ct.itab_tabela,
                    cp.pro_codprod,
                    cp.pro_nome,
                    ct.itab_grupodesconto,
                    ct.itab_descontoadd,
                    ct.itab_ipi,
                    ct.itab_st,
                    ct.itab_prepeso,
                    ct.itab_precobruto,
                    ct.itab_precopromo,
                    ct.itab_precoespecial,
                    ct.itab_datatabela,
                    ct.itab_datavencimento,
                    ct.itab_status
                FROM cad_tabelaspre ct
                LEFT JOIN cad_prod cp ON ct.itab_idprod = cp.pro_id
                WHERE ct.itab_idindustria = p_industria 
                  AND ct.itab_tabela = p_tabela
                ORDER BY cp.pro_codprod;
            END;
            $$ LANGUAGE plpgsql;
        `);

        console.log('✅ fn_listar_produtos_tabela criada\n');

        // Testar as funções
        console.log('🧪 Testando fn_listar_tabelas_industria(20)...');
        const testTables = await client.query('SELECT * FROM fn_listar_tabelas_industria(20)');
        console.log(`   ✅ Encontradas ${testTables.rows.length} tabelas`);
        if (testTables.rows.length > 0) {
            console.log('   Tabelas:', testTables.rows.map(r => r.itab_tabela).join(', '));
        }

        if (testTables.rows.length > 0) {
            const firstTable = testTables.rows[0].itab_tabela;
            console.log(`\n🧪 Testando fn_listar_produtos_tabela(20, '${firstTable}')...`);
            const testProducts = await client.query('SELECT * FROM fn_listar_produtos_tabela($1, $2)', [20, firstTable]);
            console.log(`   ✅ Encontrados ${testProducts.rows.length} produtos`);
            if (testProducts.rows.length > 0) {
                console.log('   Primeiro produto:', testProducts.rows[0].pro_codprod, '-', testProducts.rows[0].pro_nome);
            }
        }

        console.log('\n✅ SUCESSO! As funções estão funcionando corretamente.');
        console.log('   Agora você pode recarregar a página no navegador.');

    } catch (error) {
        console.error('❌ Erro:', error.message);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

createCorrectFunctions().catch(console.error);
