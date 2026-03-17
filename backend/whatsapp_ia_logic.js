const { masterPool, getTenantPool } = require('./utils/db');
const { OpenAI } = require('openai');
const axios = require('axios');
const logger = console; // Usando console por enquanto, pode ser substituído por um logger custom

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

/**
 * Resolve o Tenant (Empresa) baseado no nome da instância da Evolution API.
 * Assume-se que o nome da instância é o CNPJ da empresa (apenas números).
 */
async function getTenantFromInstance(instanceName) {
    try {
        const cleanInstance = instanceName.replace(/\D/g, '');

        // Busca no banco master as configurações dessa empresa
        const query = `
            SELECT id, cnpj, razao_social, nome_fantasia, db_host, db_nome, db_schema, db_usuario, db_senha, db_porta 
            FROM empresas 
            WHERE regexp_replace(cnpj, '[^0-9]', '', 'g') = $1 AND status = 'ATIVO'
            LIMIT 1
        `;
        const result = await masterPool.query(query, [cleanInstance]);

        if (result.rows.length === 0) {
            throw new Error(`Empresa não encontrada ou inativa para a instância: ${instanceName}`);
        }

        const emp = result.rows[0];
        const tenantKey = emp.cnpj;

        const config = {
            host: emp.db_host,
            database: emp.db_nome,
            schema: emp.db_schema || 'public',
            user: emp.db_usuario,
            password: emp.db_senha,
            port: emp.db_porta || 5432
        };

        const pool = getTenantPool(tenantKey, config);
        return {
            pool,
            tenantId: emp.id,
            schema: config.schema,
            cnpj: emp.cnpj,
            nomeEmpresa: emp.nome_fantasia || emp.razao_social || 'Nossa Empresa'
        };
    } catch (error) {
        logger.error(`❌ [WPP-LOGIC] Erro ao resolver tenant:`, error.message);
        throw error;
    }
}

/**
 * Processa a mensagem recebida usando IA para qualificação.
 */

/**
 * Processa a mensagem recebida usando IA para qualificação MULTI-MARCAS.
 */
async function processarMensagemIA(context, messageData) {
    const { pool, schema } = context;
    const { phone, content, pushName } = messageData;

    try {
        // 1. Buscar contato existente
        let contatoRes = await pool.query(`SELECT id, cliente_id, is_cliente FROM wpp_contato WHERE telefone = $1`, [phone]);
        let contato = contatoRes.rows[0];

        // 1.5 Se não existe ou não é cliente vinculado, tentar buscar na tabela de clientes (cli_fone3)
        if (!contato || !contato.cliente_id) {
            const cleanPhone = phone.replace(/\D/g, '').slice(-8); // Pega últimos 8 dígitos para evitar problemas de DDI/DDD
            const clientLookup = await pool.query(`
                SELECT cli_codigo, cli_nome, cli_vendedor, ven.ven_nome
                FROM clientes
                LEFT JOIN vendedores ven ON ven.ven_codigo = cli_vendedor
                WHERE regexp_replace(cli_fone3, '[^0-9]', '', 'g') LIKE $1
                LIMIT 1
            `, [`%${cleanPhone}`]);

            if (clientLookup.rows.length > 0) {
                const client = clientLookup.rows[0];
                logger.log(`🔍 [WPP-IA] Cliente identificado: ${client.cli_nome} (ID: ${client.cli_codigo})`);

                if (contato) {
                    // Atualiza contato existente
                    await pool.query(`UPDATE wpp_contato SET cliente_id = $1, is_cliente = true WHERE id = $2`, [client.cli_codigo, contato.id]);
                    contato.cliente_id = client.cli_codigo;
                    contato.is_cliente = true;
                } else {
                    // Cria novo contato já vinculado
                    const insertRes = await pool.query(`
                        INSERT INTO wpp_contato (telefone, nome_push, origem, cliente_id, is_cliente)
                        VALUES ($1, $2, 'whatsapp_inbound', $3, true)
                        RETURNING id
                    `, [phone, pushName, client.cli_codigo]);
                    contato = { id: insertRes.rows[0].id, cliente_id: client.cli_codigo, is_cliente: true };
                }
                
                // Adiciona metadados do cliente para o contexto da IA
                contato.nome_cliente = client.cli_nome;
                contato.vendedor_responsavel = client.ven_nome;
            } else if (!contato) {
                // Visitante novo realmente desconhecido
                const insertRes = await pool.query(`
                    INSERT INTO wpp_contato (telefone, nome_push, origem)
                    VALUES ($1, $2, 'whatsapp_inbound')
                    RETURNING id
                `, [phone, pushName]);
                contato = { id: insertRes.rows[0].id, is_cliente: false };
            }
        }

        // 2. Buscar conversa ativa
        let conversaRes = await pool.query(`
            SELECT id, estado, dados_qualificacao, contexto_industria_id
            FROM wpp_conversa
            WHERE contato_id = $1 AND estado NOT IN ('convertida', 'perdida', 'encerrada')
            ORDER BY ultima_msg_at DESC LIMIT 1
        `, [contato.id]);

        let conversa = conversaRes.rows[0];
        if (!conversa) {
            const insertConvRes = await pool.query(`
                INSERT INTO wpp_conversa (contato_id, estado, origem, primeira_msg_at)
                VALUES ($1, 'nova', 'inbound', NOW())
                RETURNING id
            `, [contato.id]);
            conversa = { id: insertConvRes.rows[0].id, estado: 'nova', dados_qualificacao: {}, contexto_industria_id: null };
        }

        // 3. Salvar Mensagem Inbound
        await pool.query(`
            INSERT INTO wpp_mensagem (conversa_id, contato_id, direcao, remetente, conteudo, status)
            VALUES ($1, $2, 'inbound', 'lead', $3, 'recebida')
        `, [conversa.id, contato.id, content]);


        // =================================================================
        // LÓGICA MULTI-MARCAS (CONTEXTO DINÂMICO) + CONTROLE DE PLANO
        // =================================================================

        // 3.5 Verificar Plano e Limites do Tenant
        let configRemota = { plano_ativo: 'BASIC', modulo_ativo: false };
        try {
            // Tabela ia_config criada no schema
            const confRes = await pool.query(`SELECT plano_ativo, modulo_ativo FROM ia_config LIMIT 1`);
            if (confRes.rows.length > 0) configRemota = confRes.rows[0];
        } catch (e) {
            // Se tabela não existir, assume BASIC e OFF por segurança
            logger.warn(`⚠️ [WPP-IA] Tabela ia_config não encontrada. Usando defaults.`);
        }

        // BLOQUEIO DE PLANO: Se não tiver modulo_ativo ou plano for BASIC (limitado)
        if (!configRemota.modulo_ativo) {
            // Se estiver desligado, não faz nada (silêncio ou auto-resposta simples)
            return null; // Apenas ignora
        }

        // Se for plano BASIC, apenas responde frase padrão (Hardcoded)
        if (configRemota.plano_ativo === 'BASIC') {
            const respostaAuto = "Olá! Recebemos sua mensagem. Nosso atendimento humano funciona de Seg a Sex das 8h às 18h.";
            await pool.query(`
                INSERT INTO wpp_mensagem (conversa_id, contato_id, direcao, remetente, conteudo, status)
                VALUES ($1, $2, 'outbound', 'ia', $3, 'enviada')
            `, [conversa.id, contato.id, respostaAuto]);
            return respostaAuto;
        }

        // AQUI COMEÇA A IA AVANÇADA (SÓ PARA PLANO PRO/ENTERPRISE)

        // 4. Carregar Base de Conhecimento (Marcas Disponíveis)
        // Se a tabela ia_conhecimento não existir ainda no schema tenant, usamos fallback ou ignoramos
        let knowledgeBase = [];
        try {
            const kbRes = await pool.query(`SELECT id, nome_marca, resumo_negocio, persona_ia, palavras_chave FROM ia_conhecimento`);
            knowledgeBase = kbRes.rows;
        } catch (e) {
            logger.warn(`⚠️ [WPP-IA] Tabela ia_conhecimento não encontrada no schema ${schema}. Usando modo genérico.`);
        }

        // 5. Determinar Contexto (Se já não tiver um fixo na conversa)
        let contextoAtual = null;

        if (conversa.contexto_industria_id) {
            // Conversa já está "presa" a uma indústria
            // Mas permitimos "pivotar" se o cliente pedir outra coisa explicitamente? Por enquanto, manter foco.
            const marcaFocada = knowledgeBase.find(k => k.id === conversa.contexto_industria_id);
            if (marcaFocada) {
                contextoAtual = {
                    nome: marcaFocada.nome_marca,
                    persona: marcaFocada.persona_ia,
                    info: marcaFocada.resumo_negocio
                };
            }
        }

        // Se ainda não temos contexto e temos conhecimento cadastrado, vamos tentar inferir
        if (!contextoAtual && knowledgeBase.length > 0) {
            // Check simples de palavras-chave (Case insensitive)
            const lowerContent = content.toLowerCase();

            for (const item of knowledgeBase) {
                const keywords = (item.palavras_chave || '').split(',').map(k => k.trim().toLowerCase());
                if (keywords.some(k => lowerContent.includes(k))) {
                    // Match!
                    logger.log(`🎯 [WPP-IA] Contexto inferido: ${item.nome_marca} (palavra-chave detectada)`);
                    contextoAtual = {
                        nome: item.nome_marca,
                        persona: item.persona_ia,
                        info: item.resumo_negocio
                    };

                    // Atualizar conversa com o contexto descoberto
                    // (Precisamos garantir que a coluna contexto_industria_id exista, assumindo que sim ou tratar erro)
                    try {
                        // await pool.query('UPDATE wpp_conversa SET contexto_industria_id = $1 WHERE id = $2', [item.id, conversa.id]);
                        // (Comentado para evitar erro se coluna não existir ainda na migração. Faremos em memória por enquanto)
                    } catch (e) { }
                    break;
                }
            }
        }


        // Se ainda nulo, é o "Recepcionista Geral"
        if (!contextoAtual) {
            contextoAtual = {
                nome: context.nomeEmpresa || 'Sua Empresa',
                persona: "Assistente Virtual",
                info: `Você é a recepcionista virtual da empresa ${context.nomeEmpresa || 'Sua Empresa'}. Seu objetivo é entender o que o cliente precisa.` +
                    (knowledgeBase.length > 0 ? " Marcas que representamos: " + knowledgeBase.map(k => k.nome_marca).join(', ') : "")
            };
        }


        // 6. Montar Prompt Dinâmico
        const prompt = `
            CONTEXTO DE ATUAÇÃO:
            Você é ${contextoAtual.persona} da ${contextoAtual.nome}.
            Sobre a empresa: ${contextoAtual.info}
 
            DADOS DO CLIENTE IDENTIFICADO: ${contato.nome_cliente ? `NOME: ${contato.nome_cliente}, VENDEDOR: ${contato.vendedor_responsavel || 'Não definido'}` : 'Visitante não identificado'}
            DADOS JÁ COLETADOS NA CONVERSA: ${JSON.stringify(conversa.dados_qualificacao || {})}

            OBJETIVO:
            1. Se o cliente for identificado, use o nome dele de forma natural.
            2. Se for "Recepcionista Geral", descubra qual marca interessa ao cliente.
            3. Se for "Especialista", qualifique o lead (tipo de produto, volume, urgência).
            4. Seja breve, profissional e use emojis moderados.

            Responda APENAS em JSON:
            {
                "resposta": "Texto para enviar ao WhatsApp",
                "dados_extraidos": { ...novos dados... },
                "qualificado": true/false (true se tiver dados suficientes para passar ao humano),
                "contexto_sugerido_id": (Se identificar uma marca específica, retorne o ID dela, senão null)
            }
        `;

        const aiResponse = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: "Você é um assistente de vendas comercial. Responda estritamente em JSON." },
                { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" }
        });

        const result = JSON.parse(aiResponse.choices[0].message.content);

        // 7. Salvar resposta IA
        await pool.query(`
            INSERT INTO wpp_mensagem (conversa_id, contato_id, direcao, remetente, conteudo, status)
            VALUES ($1, $2, 'outbound', 'ia', $3, 'enviada')
        `, [conversa.id, contato.id, result.resposta]);

        // 8. Atualizar conversa e Estado
        const novosDados = { ...(conversa.dados_qualificacao || {}), ...(result.dados_extraidos || {}) };

        let novoEstado = conversa.estado;
        if (result.qualificado === true) {
            novoEstado = 'ia_qualificou';
        } else if (conversa.estado === 'nova') {
            novoEstado = 'ia_ativa';
        }

        let updateQuery = `
            UPDATE wpp_conversa
            SET dados_qualificacao = $1,
                estado = $2,
                ultima_msg_at = NOW()
        `;
        let updateParams = [novosDados, novoEstado]; // $1, $2

        // Persistir contexto se a IA sugeriu e ainda não tínhamos
        if (result.contexto_sugerido_id && !conversa.contexto_industria_id) {
            // Validar se ID existe na base local
            const validaMarca = knowledgeBase.find(k => k.id === result.contexto_sugerido_id);
            if (validaMarca) {
                updateQuery += `, contexto_industria_id = $3 WHERE id = $4`;
                updateParams.push(result.contexto_sugerido_id); // $3
                updateParams.push(conversa.id); // $4
            } else {
                updateQuery += ` WHERE id = $3`;
                updateParams.push(conversa.id); // $3
            }
        } else {
            updateQuery += ` WHERE id = $3`;
            updateParams.push(conversa.id); // $3
        }

        await pool.query(updateQuery, updateParams);

        return result.resposta;
    } catch (error) {
        logger.error(`❌ [WPP-LOGIC] Erro no processamento IA:`, error.message);
        // Fallback seguro em caso de erro da IA
        return "Olá! No momento estou com muitas mensagens. Um de nossos consultores falará com você em breve.";
    }
}


module.exports = { getTenantFromInstance, processarMensagemIA };
