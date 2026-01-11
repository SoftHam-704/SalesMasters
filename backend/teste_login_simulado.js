// ===================================================
// 🧪 TESTE DE LOGIN SIMULADO - SaveInCloud
// ===================================================
// Simula exatamente o que o backend faz durante o login

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.MASTER_DB_HOST || 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    port: process.env.MASTER_DB_PORT || 13062,
    database: process.env.MASTER_DB_DATABASE || 'basesales',
    user: process.env.MASTER_DB_USER || 'webadmin',
    password: process.env.MASTER_DB_PASSWORD || 'process.env.DB_PASSWORD',
    ssl: false
});

async function testeLogin() {
    // Dados de teste (simula o que viria do formulário)
    const TESTE = {
        cnpj: '70325059000193',  // CNPJ da SoftHam
        nome: 'Hamilton',
        sobrenome: 'Sistemas',
        password: '@12Pilabo'  // Senha padrão
    };

    console.log('\n🧪 SIMULAÇÃO DE LOGIN\n');
    console.log('='.repeat(60));
    console.log('\n📋 Dados de entrada:');
    console.log(`   CNPJ: ${TESTE.cnpj}`);
    console.log(`   Nome: ${TESTE.nome} ${TESTE.sobrenome}`);
    console.log(`   Senha: ${'*'.repeat(TESTE.password.length)}\n`);

    try {
        // PASSO 1: Buscar empresa pelo CNPJ
        console.log('1️⃣  Buscando empresa pelo CNPJ...');
        const rawCnpj = TESTE.cnpj.replace(/\D/g, '');

        const empresaQuery = `
            SELECT id, cnpj, razao_social, status, db_host, db_nome, db_usuario, db_senha, db_porta
            FROM empresas 
            WHERE cnpj = $1 OR REPLACE(REPLACE(REPLACE(cnpj, '.', ''), '/', ''), '-', '') = $1
        `;
        const empresaResult = await pool.query(empresaQuery, [rawCnpj]);

        if (empresaResult.rows.length === 0) {
            console.log('   ❌ Empresa não encontrada!');
            await pool.end();
            return;
        }

        const empresa = empresaResult.rows[0];
        console.log(`   ✅ Empresa encontrada: ${empresa.razao_social}`);
        console.log(`      ID: ${empresa.id}`);
        console.log(`      Status: ${empresa.status}`);
        console.log(`      DB Host: ${empresa.db_host}\n`);

        if (empresa.status !== 'ATIVO') {
            console.log(`   ⛔ Empresa bloqueada! Status: ${empresa.status}`);
            await pool.end();
            return;
        }

        // PASSO 2: Tentar autenticar na tabela 'usuarios' (nova)
        console.log('2️⃣  Tentando autenticar na tabela "usuarios"...');

        const usuariosExiste = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' AND table_name = 'usuarios'
            ) as existe
        `);

        if (!usuariosExiste.rows[0].existe) {
            console.log('   ⚠️  Tabela "usuarios" não existe. Pulando para fallback.\n');
        } else {
            const userQuery = `
                SELECT * FROM usuarios 
                WHERE nome = $1 AND sobrenome = $2 AND empresa_id = $3 AND senha = $4 AND ativo = true
            `;
            const userResult = await pool.query(userQuery, [TESTE.nome, TESTE.sobrenome, empresa.id, TESTE.password]);

            if (userResult.rows.length > 0) {
                console.log('   ✅ Usuário autenticado via tabela "usuarios"!');
                console.log('\n🎉 LOGIN SERIA BEM-SUCEDIDO!\n');
                await pool.end();
                return;
            }
            console.log('   ⚠️  Usuário não encontrado em "usuarios". Tentando fallback.\n');
        }

        // PASSO 3: Fallback para user_nomes (tenant)
        console.log('3️⃣  Tentando fallback na tabela "user_nomes"...');

        const userNomesQuery = `
            SELECT codigo as id, nome, sobrenome, usuario, master as e_admin, gerencia, senha
            FROM user_nomes
            WHERE nome ILIKE $1 AND sobrenome ILIKE $2
        `;
        const userNomesResult = await pool.query(userNomesQuery, [TESTE.nome, TESTE.sobrenome]);

        if (userNomesResult.rows.length === 0) {
            console.log('   ❌ Usuário não encontrado em "user_nomes"!');
            console.log('\n⛔ LOGIN FALHARIA!\n');

            // Mostrar usuários disponíveis
            console.log('   📋 Usuários disponíveis:');
            const allUsers = await pool.query('SELECT nome, sobrenome, senha FROM user_nomes');
            allUsers.rows.forEach(u => {
                console.log(`      - ${u.nome} ${u.sobrenome} (senha: ${u.senha || 'NENHUMA'})`);
            });
            await pool.end();
            return;
        }

        const user = userNomesResult.rows[0];
        console.log(`   ✅ Usuário encontrado: ${user.nome} ${user.sobrenome}`);
        console.log(`      Senha no banco: "${user.senha}"`);
        console.log(`      Senha informada: "${TESTE.password}"`);

        // Verificar senha
        if (user.senha === TESTE.password) {
            console.log('   ✅ Senha correta!\n');
            console.log('🎉 LOGIN SERIA BEM-SUCEDIDO!\n');

            console.log('📤 Dados que seriam retornados:');
            console.log(JSON.stringify({
                success: true,
                user: {
                    id: user.id,
                    nome: user.nome,
                    sobrenome: user.sobrenome,
                    role: user.e_admin ? 'admin' : 'user',
                    empresa: empresa.razao_social,
                    cnpj: empresa.cnpj
                },
                tenantConfig: {
                    cnpj: empresa.cnpj,
                    dbConfig: {
                        host: empresa.db_host,
                        database: empresa.db_nome,
                        user: empresa.db_usuario,
                        password: '***',
                        port: empresa.db_porta
                    }
                }
            }, null, 2));
        } else {
            console.log('   ❌ Senha incorreta!\n');
            console.log('⛔ LOGIN FALHARIA!\n');
        }

        await pool.end();

    } catch (error) {
        console.error('\n❌ ERRO:', error.message);
        console.error(error);
        await pool.end();
    }
}

testeLogin();

