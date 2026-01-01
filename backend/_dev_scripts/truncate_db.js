// Script para truncar TODAS as tabelas do banco basesales
const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'basesales',
    user: 'postgres',
    password: '@12Pilabo'
});

async function truncateAllTables() {
    const client = await pool.connect();

    try {
        console.log('🗑️  Iniciando limpeza COMPLETA do banco de dados basesales...\n');

        await client.query('BEGIN');

        // Desabilitar triggers e foreign keys temporariamente
        await client.query('SET session_replication_role = replica');

        console.log('📋 Limpando tabelas principais...');

        // Tabelas em ordem (sem dependências problemáticas)
        const tables = [
            'itens_ped',
            'pedidos',
            'cad_tabelaspre',
            'cad_prod',
            'cli_descpro',
            'cli_ind',
            'cli_aniv',
            'indclientes',
            'clientes',
            'crm_interacao_industria',
            'crm_interacao',
            'crm_sellout',
            'crm_agenda',
            'crm_alerta',
            'crm_canal',
            'crm_resultado',
            'crm_tipo_interacao',
            'atua_cli',
            'vendedor_ind',
            'vendedor_reg',
            'vendedores',
            'fornecedores',
            'transportadora',
            'grupo_desc',
            'grupos',
            'descontos_ind',
            'ind_metas',
            'contato_for',
            'area_atuacao',
            'area_atu',
            'bandeira',
            'ccustos',
            'cidades_regioes',
            'cidades',
            'contas',
            'empresa_status',
            'forma_pagamento',
            'parametros',
            'regioes',
            'user_grupos',
            'user_menu_superior',
            'user_nomes'
        ];

        let cleanedCount = 0;
        for (const table of tables) {
            try {
                await client.query(`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE`);
                console.log(`   ✓ ${table}`);
                cleanedCount++;
            } catch (err) {
                console.log(`   ⚠ ${table} - ${err.message}`);
            }
        }

        // Reabilitar triggers
        await client.query('SET session_replication_role = origin');

        await client.query('COMMIT');

        console.log(`\n✅ ${cleanedCount} tabelas limpas com sucesso!`);
        console.log('🔄 Todos os sequences foram resetados para 1');
        console.log('⚠️  O banco está completamente vazio e pronto para importação\n');

        // Verificar resultado
        const result = await client.query(`
            SELECT COUNT(*) as table_count
            FROM information_schema.tables 
            WHERE table_schema = 'public'
              AND table_type = 'BASE TABLE';
        `);

        console.log(`📊 Total de tabelas no banco: ${result.rows[0].table_count}`);

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Erro ao limpar banco de dados:', error.message);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Executar
truncateAllTables()
    .then(() => {
        console.log('\n✅ Processo concluído com sucesso!');
        console.log('💾 O banco está pronto para receber dados reais.\n');
        process.exit(0);
    })
    .catch(err => {
        console.error('\n❌ Erro fatal:', err.message);
        process.exit(1);
    });
