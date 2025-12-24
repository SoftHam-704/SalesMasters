const { Pool } = require('pg');

// Configuração do banco de dados
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'basesales',
    password: '@12Pilabo',
    port: 5432,
});

async function criarTabelaUserNomes() {
    console.log('╔════════════════════════════════════════════╗');
    console.log('║  Criando Tabela: user_nomes                ║');
    console.log('║  Data: 21/12/2024                          ║');
    console.log('╚════════════════════════════════════════════╝');
    console.log();

    const sqlCreateTable = `
        CREATE TABLE IF NOT EXISTS user_nomes (
            codigo     SERIAL PRIMARY KEY,
            nome       VARCHAR(20) NOT NULL,
            sobrenome  VARCHAR(20) NOT NULL,
            senha      VARCHAR(20),
            grupo      VARCHAR(4),
            imagem     BYTEA,
            master     BOOLEAN DEFAULT FALSE,
            gerencia   BOOLEAN DEFAULT FALSE,
            usuario    VARCHAR(20)
        );
    `;

    const sqlCreateIndexes = [
        'CREATE INDEX IF NOT EXISTS idx_user_nomes_usuario ON user_nomes(usuario);',
        'CREATE INDEX IF NOT EXISTS idx_user_nomes_grupo ON user_nomes(grupo);'
    ];

    const sqlComments = [
        "COMMENT ON TABLE user_nomes IS 'Tabela de usuários do sistema SalesMasters';",
        "COMMENT ON COLUMN user_nomes.codigo IS 'Código único do usuário (auto-incremento)';",
        "COMMENT ON COLUMN user_nomes.nome IS 'Nome do usuário';",
        "COMMENT ON COLUMN user_nomes.sobrenome IS 'Sobrenome do usuário';",
        "COMMENT ON COLUMN user_nomes.senha IS 'Senha do usuário (deve ser criptografada)';",
        "COMMENT ON COLUMN user_nomes.grupo IS 'Grupo/perfil do usuário';",
        "COMMENT ON COLUMN user_nomes.imagem IS 'Foto/avatar do usuário em formato binário';",
        "COMMENT ON COLUMN user_nomes.master IS 'Indica se o usuário é administrador master';",
        "COMMENT ON COLUMN user_nomes.gerencia IS 'Indica se o usuário tem permissões de gerência';",
        "COMMENT ON COLUMN user_nomes.usuario IS 'Nome de usuário para login';"
    ];

    try {
        // 1. Criar tabela
        console.log('1. Criando tabela user_nomes...');
        await pool.query(sqlCreateTable);
        console.log('   ✓ Tabela criada com sucesso!');
        console.log();

        // 2. Criar índices
        console.log('2. Criando índices...');
        for (const sql of sqlCreateIndexes) {
            await pool.query(sql);
        }
        console.log('   ✓ Índices criados com sucesso!');
        console.log();

        // 3. Adicionar comentários
        console.log('3. Adicionando comentários...');
        for (const sql of sqlComments) {
            await pool.query(sql);
        }
        console.log('   ✓ Comentários adicionados com sucesso!');
        console.log();

        // 4. Verificar estrutura
        console.log('4. Verificando estrutura da tabela...');
        const result = await pool.query(`
            SELECT 
                column_name,
                data_type,
                character_maximum_length,
                is_nullable,
                column_default
            FROM information_schema.columns
            WHERE table_name = 'user_nomes'
            ORDER BY ordinal_position;
        `);

        console.log('\n   Estrutura da tabela user_nomes:');
        console.log('   ┌─────────────┬──────────────┬─────────┬──────────┐');
        console.log('   │ Coluna      │ Tipo         │ Tamanho │ Nullable │');
        console.log('   ├─────────────┼──────────────┼─────────┼──────────┤');
        result.rows.forEach(row => {
            const col = row.column_name.padEnd(11);
            const type = row.data_type.padEnd(12);
            const len = (row.character_maximum_length || '-').toString().padEnd(7);
            const nullable = row.is_nullable.padEnd(8);
            console.log(`   │ ${col} │ ${type} │ ${len} │ ${nullable} │`);
        });
        console.log('   └─────────────┴──────────────┴─────────┴──────────┘');
        console.log();

        console.log('╔════════════════════════════════════════════╗');
        console.log('║  ✓ Tabela user_nomes criada com sucesso!  ║');
        console.log('╚════════════════════════════════════════════╝');

    } catch (error) {
        console.error('\n✗ Erro ao criar tabela:', error.message);
        throw error;
    } finally {
        await pool.end();
    }
}

criarTabelaUserNomes();
