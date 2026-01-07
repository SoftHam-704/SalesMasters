const express = require('express');
const router = express.Router();
const { masterPool, getTenantPool } = require('./utils/db');

/**
 * LOGIN MASTER + TENANT
 * 1. Valida a empresa no Master pelo CNPJ
 * 2. Valida o funcionário no banco do Cliente (nome, sobrenome, senha)
 */
/**
 * LOGIN MASTER + TENANT (Centralizado no Master DB)
 * 1. Valida a empresa no Master pelo CNPJ
 * 2. Valida o usuário na tabela 'usuarios' do Master DB
 */
router.post('/master-login', async (req, res) => {
    const { cnpj, nome, sobrenome, email, password } = req.body;

    // Limpa CNPJ
    const rawCnpj = cnpj ? cnpj.replace(/\D/g, '') : '';

    // Identificador do usuário (pode ser email ou nome+sobrenome)
    const userIdentifier = email || `${nome} ${sobrenome}`.trim();

    if (!rawCnpj || !userIdentifier || !password) {
        return res.status(400).json({
            success: false,
            message: 'CNPJ, Identificação do Usuário e Senha são obrigatórios'
        });
    }

    try {
        const CNPJ_TESTE = '00000000000191';
        let empresa;
        let dbConfig;

        // 1. BUSCAR EMPRESA NO MASTER
        if (rawCnpj === CNPJ_TESTE) {
            console.log('🔧 [AUTH] MODO TESTE (Bypass): Empresa SoftHam Local');
            empresa = {
                id: 1, // Assumimos que SoftHam é ID 1
                cnpj: CNPJ_TESTE,
                razao_social: 'SOFTHAM SISTEMAS LTDA',
                status: 'ATIVO',
                db_host: 'localhost',
                db_nome: 'basesales',
                db_usuario: 'postgres',
                db_senha: '@12Pilabo',
                db_porta: 5432
            };
        } else {
            const masterQuery = `
                SELECT id, cnpj, razao_social, status, db_host, db_nome, db_usuario, db_senha, db_porta
                FROM empresas 
                WHERE cnpj = $1 OR REPLACE(REPLACE(REPLACE(cnpj, '.', ''), '/', ''), '-', '') = $1
            `;
            const masterResult = await masterPool.query(masterQuery, [rawCnpj]);

            if (masterResult.rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Empresa não encontrada com este CNPJ no cadastro Master.' });
            }
            empresa = masterResult.rows[0];
        }

        if (empresa.status !== 'ATIVO') {
            return res.status(403).json({
                success: false,
                message: `Empresa bloqueada. Status: ${empresa.status}.`
            });
        }

        // 2. VALIDAR USUÁRIO NO MASTER DB (Nova Tabela 'usuarios')
        // Tentamos por email OU por nome+sobrenome
        let userQuery;
        let userParams;

        if (email) {
            userQuery = `SELECT * FROM usuarios WHERE email = $1 AND empresa_id = $2 AND senha = $3 AND ativo = true`;
            userParams = [email, empresa.id, password];
        } else {
            userQuery = `SELECT * FROM usuarios WHERE nome = $1 AND sobrenome = $2 AND empresa_id = $3 AND senha = $4 AND ativo = true`;
            userParams = [nome, sobrenome, empresa.id, password];
        }

        const userResult = await masterPool.query(userQuery, userParams);

        // SE NÃO ENCONTRADO NO MASTER, tentamos o fallback no Tenant (para não quebrar usuários antigos ainda não migrados)
        if (userResult.rows.length === 0) {
            console.log(`⚠️ [AUTH] Usuário não encontrado no Master DB. Tentando fallback no Tenant para: ${userIdentifier}`);

            dbConfig = {
                host: empresa.db_host,
                database: empresa.db_nome,
                user: empresa.db_usuario,
                password: empresa.db_senha || '',
                port: empresa.db_porta || 5432
            };

            const tenantPool = getTenantPool(empresa.cnpj, dbConfig);
            const tenantQuery = `
                SELECT codigo as id, nome, sobrenome, usuario, master as e_admin, gerencia
                FROM user_nomes
                WHERE nome ILIKE $1 AND sobrenome ILIKE $2 AND senha = $3
            `;
            const tenantResult = await tenantPool.query(tenantQuery, [nome, sobrenome, password]);

            if (tenantResult.rows.length === 0) {
                return res.status(401).json({ success: false, message: 'Credenciais inválidas.' });
            }

            const dbUser = tenantResult.rows[0];

            // Verificação de segurança adicional para o Hamilton no fallback
            const isHamilton = dbUser.nome && dbUser.nome.toLowerCase() === 'hamilton' && empresa.cnpj === CNPJ_TESTE;

            return res.json({
                success: true,
                message: 'Login realizado (Fallback Tenant)',
                user: {
                    id: dbUser.id,
                    nome: dbUser.nome,
                    sobrenome: dbUser.sobrenome,
                    email: email || '',
                    role: isHamilton ? 'superadmin' : (dbUser.e_admin ? 'admin' : (dbUser.gerencia ? 'manager' : 'user')),
                    empresa: empresa.razao_social,
                    cnpj: empresa.cnpj
                },
                tenantConfig: { cnpj: empresa.cnpj, dbConfig }
            });
        }

        const masterUser = userResult.rows[0];

        // Lógica de Identificação do Hamilton
        // Ele é o único que pode ser 'superadmin'
        const isHamilton = (masterUser.email && masterUser.email.toLowerCase() === 'hamilton@softham.com.br') ||
            (masterUser.nome && masterUser.nome.toLowerCase() === 'hamilton' && empresa.cnpj === CNPJ_TESTE);

        console.log('✅ [AUTH] Login Master realizado:', {
            nome: masterUser.nome,
            email: masterUser.email,
            isHamilton,
            role: isHamilton ? 'superadmin' : (masterUser.e_admin ? 'admin' : 'user')
        });

        res.json({
            success: true,
            message: 'Login realizado com sucesso!',
            user: {
                id: masterUser.id,
                nome: masterUser.nome,
                sobrenome: masterUser.sobrenome,
                email: masterUser.email,
                role: isHamilton ? 'superadmin' : (masterUser.e_admin ? 'admin' : 'user'),
                empresa: empresa.razao_social,
                cnpj: empresa.cnpj
            },
            tenantConfig: {
                cnpj: empresa.cnpj,
                dbConfig: {
                    host: empresa.db_host,
                    database: empresa.db_nome,
                    user: empresa.db_usuario,
                    password: empresa.db_senha || '',
                    port: empresa.db_porta || 5432
                }
            }
        });

    } catch (error) {
        console.error('❌ [AUTH MASTER] Erro crítico no login:', error);
        res.status(500).json({ success: false, message: 'Erro interno ao processar login.' });
    }
});

module.exports = router;
