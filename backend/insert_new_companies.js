const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function insertCompanies() {
    const pool = new Pool({
        host: process.env.MASTER_DB_HOST,
        port: process.env.MASTER_DB_PORT,
        database: process.env.MASTER_DB_DATABASE,
        user: process.env.MASTER_DB_USER,
        password: process.env.MASTER_DB_PASSWORD,
        ssl: process.env.MASTER_DB_SSL === 'true'
    });

    try {
        console.log('🚀 Iniciando registro de empresas no banco MASTER (Resolvendo conflitos)...');

        const empresas = [
            {
                id: 42,
                razao_social: 'HM BORCATO REPRESENTACAO COMERCIAL LTDA',
                nome_fantasia: 'HM BORCATO REPRESENTAÇÕES',
                cnpj: '28427986000108',
                telefone: '3131461975',
                db_schema: 'borcatorep',
                status: 'ATIVO',
                db_host: 'node254557-salesmaster.sp1.br.saveincloud.net.br',
                db_nome: 'basesales',
                db_usuario: 'webadmin',
                db_senha: 'ytAyO0u043',
                db_porta: 13062,
                versao_liberada: '1.0.0',
                limite_usuarios: 10,
                limite_sessoes: 10,
                alerta_percentual: 80,
                bloqueio_ativo: 'N',
                ios_enabled: 'S',
                ramoatv: 'Representação',
                modulo_bi_ativo: false,
                modulo_whatsapp_ativo: false,
                plano_ia_nivel: 'BASIC',
                modulo_crmrep_ativo: false
            },
            {
                id: 43,
                razao_social: 'MARCELO CLAUDINO ROELA',
                nome_fantasia: 'TRUST REPRESENTAÇÃO COMERCIAL',
                cnpj: '21145796000140',
                telefone: '(11) 9 8492-7315',
                db_schema: 'trustrep',
                status: 'ATIVO',
                db_host: 'node254557-salesmaster.sp1.br.saveincloud.net.br',
                db_nome: 'basesales',
                db_usuario: 'webadmin',
                db_senha: 'ytAyO0u043',
                db_porta: 13062,
                versao_liberada: '1.0.0',
                limite_usuarios: 10,
                limite_sessoes: 10,
                alerta_percentual: 80,
                bloqueio_ativo: 'N',
                ios_enabled: 'S',
                ramoatv: 'Representação',
                modulo_bi_ativo: false,
                modulo_whatsapp_ativo: false,
                plano_ia_nivel: 'BASIC',
                modulo_crmrep_ativo: false
            }
        ];

        for (const emp of empresas) {
            console.log(`📝 Processando empresa ID ${emp.id}: ${emp.razao_social}`);
            
            // 1. Limpar qualquer registro que tenha o mesmo CNPJ mas ID diferente
            const conflict = await pool.query('SELECT id FROM empresas WHERE cnpj = $1 AND id <> $2', [emp.cnpj, emp.id]);
            if (conflict.rows.length > 0) {
                console.log(`🧹 Removendo registro conflitante (ID ${conflict.rows[0].id}) com o mesmo CNPJ...`);
                await pool.query('DELETE FROM users WHERE empresa_id = $1', [conflict.rows[0].id]);
                await pool.query('DELETE FROM empresas WHERE id = $1', [conflict.rows[0].id]);
            }

            // 2. Verificar se o ID já existe
            const check = await pool.query('SELECT id FROM empresas WHERE id = $1', [emp.id]);
            
            if (check.rows.length > 0) {
                console.log(`⚠️ Empresa ID ${emp.id} já existe. Atualizando...`);
                // Query de UPDATE... (mantida do script anterior)
                const query = `
                    UPDATE empresas SET
                        razao_social = $2, nome_fantasia = $3, cnpj = $4, 
                        telefone = $5, db_schema = $6, status = $7, 
                        db_host = $8, db_nome = $9, db_usuario = $10, 
                        db_senha = $11, db_porta = $12, versao_liberada = $13,
                        limite_usuarios = $14, limite_sessoes = $15,
                        alerta_percentual = $16, bloqueio_ativo = $17,
                        ios_enabled = $18, ramoatv = $19,
                        modulo_bi_ativo = $20, modulo_whatsapp_ativo = $21,
                        plano_ia_nivel = $22, modulo_crmrep_ativo = $23
                    WHERE id = $1
                `;
                await pool.query(query, [
                    emp.id, emp.razao_social, emp.nome_fantasia, emp.cnpj,
                    emp.telefone, emp.db_schema, emp.status,
                    emp.db_host, emp.db_nome, emp.db_usuario,
                    emp.db_senha, emp.db_porta, emp.versao_liberada,
                    emp.limite_usuarios, emp.limite_sessoes,
                    emp.alerta_percentual, emp.bloqueio_ativo,
                    emp.ios_enabled, emp.ramoatv,
                    emp.modulo_bi_ativo, emp.modulo_whatsapp_ativo,
                    emp.plano_ia_nivel, emp.modulo_crmrep_ativo
                ]);
            } else {
                console.log(`✨ Inserindo nova empresa ID ${emp.id}...`);
                const query = `
                    INSERT INTO empresas (
                        id, razao_social, nome_fantasia, cnpj, 
                        telefone, db_schema, status, 
                        db_host, db_nome, db_usuario, 
                        db_senha, db_porta, versao_liberada,
                        limite_usuarios, limite_sessoes,
                        alerta_percentual, bloqueio_ativo,
                        ios_enabled, ramoatv,
                        modulo_bi_ativo, modulo_whatsapp_ativo,
                        plano_ia_nivel, modulo_crmrep_ativo,
                        data_adesao
                    ) VALUES (
                        $1, $2, $3, $4, 
                        $5, $6, $7, 
                        $8, $9, $10, 
                        $11, $12, $13,
                        $14, $15,
                        $16, $17,
                        $18, $19,
                        $20, $21,
                        $22, $23,
                        NOW()
                    )
                `;
                await pool.query(query, [
                    emp.id, emp.razao_social, emp.nome_fantasia, emp.cnpj,
                    emp.telefone, emp.db_schema, emp.status,
                    emp.db_host, emp.db_nome, emp.db_usuario,
                    emp.db_senha, emp.db_porta, emp.versao_liberada,
                    emp.limite_usuarios, emp.limite_sessoes,
                    emp.alerta_percentual, emp.bloqueio_ativo,
                    emp.ios_enabled, emp.ramoatv,
                    emp.modulo_bi_ativo, emp.modulo_whatsapp_ativo,
                    emp.plano_ia_nivel, emp.modulo_crmrep_ativo
                ]);
            }
            console.log(`✅ Empresa ID ${emp.id} concluída.`);
        }

        console.log('🎉 Todas as empresas foram registradas/atualizadas com sucesso!');

    } catch (err) {
        console.error('❌ Erro crítico no registro:', err.message);
    } finally {
        await pool.end();
    }
}

insertCompanies();
