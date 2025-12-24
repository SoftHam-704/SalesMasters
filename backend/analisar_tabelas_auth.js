const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'basesales',
    password: '@12Pilabo',
    port: 5432,
});

async function analisarTabelasAutenticacao() {
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║  Análise de Tabelas - Sistema de Autenticação         ║');
    console.log('║  Data: 21/12/2024                                      ║');
    console.log('╚════════════════════════════════════════════════════════╝');
    console.log();

    const tabelas = ['user_nomes', 'user_grupos', 'user_menu_superior'];

    try {
        for (const tabela of tabelas) {
            console.log(`\n${'='.repeat(60)}`);
            console.log(`TABELA: ${tabela.toUpperCase()}`);
            console.log('='.repeat(60));

            // 1. Estrutura da tabela
            console.log('\n📋 ESTRUTURA:');
            const estrutura = await pool.query(`
                SELECT 
                    column_name,
                    data_type,
                    character_maximum_length,
                    is_nullable,
                    column_default
                FROM information_schema.columns
                WHERE table_name = $1
                ORDER BY ordinal_position;
            `, [tabela]);

            if (estrutura.rows.length === 0) {
                console.log(`   ⚠️  Tabela "${tabela}" não encontrada!`);
                continue;
            }

            console.log('   ┌─────────────────┬──────────────────┬─────────┬──────────┐');
            console.log('   │ Coluna          │ Tipo             │ Tamanho │ Nullable │');
            console.log('   ├─────────────────┼──────────────────┼─────────┼──────────┤');
            estrutura.rows.forEach(row => {
                const col = row.column_name.padEnd(15);
                const type = row.data_type.padEnd(16);
                const len = (row.character_maximum_length || '-').toString().padEnd(7);
                const nullable = row.is_nullable.padEnd(8);
                console.log(`   │ ${col} │ ${type} │ ${len} │ ${nullable} │`);
            });
            console.log('   └─────────────────┴──────────────────┴─────────┴──────────┘');

            // 2. Chaves primárias
            console.log('\n🔑 CHAVES PRIMÁRIAS:');
            const pks = await pool.query(`
                SELECT a.attname
                FROM pg_index i
                JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
                WHERE i.indrelid = $1::regclass AND i.indisprimary;
            `, [tabela]);

            if (pks.rows.length > 0) {
                pks.rows.forEach(row => {
                    console.log(`   • ${row.attname}`);
                });
            } else {
                console.log('   (nenhuma chave primária definida)');
            }

            // 3. Índices
            console.log('\n📊 ÍNDICES:');
            const indices = await pool.query(`
                SELECT indexname, indexdef
                FROM pg_indexes
                WHERE tablename = $1;
            `, [tabela]);

            if (indices.rows.length > 0) {
                indices.rows.forEach(row => {
                    console.log(`   • ${row.indexname}`);
                });
            } else {
                console.log('   (nenhum índice adicional)');
            }

            // 4. Foreign Keys
            console.log('\n🔗 FOREIGN KEYS:');
            const fks = await pool.query(`
                SELECT
                    tc.constraint_name,
                    kcu.column_name,
                    ccu.table_name AS foreign_table_name,
                    ccu.column_name AS foreign_column_name
                FROM information_schema.table_constraints AS tc
                JOIN information_schema.key_column_usage AS kcu
                    ON tc.constraint_name = kcu.constraint_name
                JOIN information_schema.constraint_column_usage AS ccu
                    ON ccu.constraint_name = tc.constraint_name
                WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = $1;
            `, [tabela]);

            if (fks.rows.length > 0) {
                fks.rows.forEach(row => {
                    console.log(`   • ${row.column_name} → ${row.foreign_table_name}.${row.foreign_column_name}`);
                });
            } else {
                console.log('   (nenhuma foreign key definida)');
            }

            // 5. Contagem de registros
            console.log('\n📈 DADOS:');
            const count = await pool.query(`SELECT COUNT(*) as total FROM ${tabela}`);
            console.log(`   Total de registros: ${count.rows[0].total}`);

            // 6. Amostra de dados (primeiros 3 registros)
            if (parseInt(count.rows[0].total) > 0) {
                console.log('\n   Amostra (primeiros 3 registros):');
                const sample = await pool.query(`SELECT * FROM ${tabela} LIMIT 3`);
                sample.rows.forEach((row, idx) => {
                    console.log(`\n   Registro ${idx + 1}:`);
                    Object.keys(row).forEach(key => {
                        let value = row[key];
                        if (key === 'imagem' && value) {
                            value = `<BLOB ${value.length} bytes>`;
                        }
                        if (key === 'senha' && value) {
                            value = '***';
                        }
                        console.log(`     ${key}: ${value}`);
                    });
                });
            }
        }

        console.log('\n\n' + '='.repeat(60));
        console.log('ANÁLISE DE RELACIONAMENTOS');
        console.log('='.repeat(60));

        // Verificar relacionamentos entre as tabelas
        console.log('\n🔍 Relacionamentos Identificados:');

        const relUserGrupos = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'user_nomes' 
            AND column_name LIKE '%grupo%'
        `);

        if (relUserGrupos.rows.length > 0) {
            console.log(`   • user_nomes.${relUserGrupos.rows[0].column_name} → user_grupos (relacionamento implícito)`);
        }

        console.log('\n✅ Análise concluída!');

    } catch (error) {
        console.error('\n❌ Erro na análise:', error.message);
        throw error;
    } finally {
        await pool.end();
    }
}

analisarTabelasAutenticacao();
