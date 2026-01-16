-- =====================================================
-- 💬 SALESMASTER CHAT PRO - Estrutura do Banco
-- Criado em: 2026-01-15
-- =====================================================

-- 1. CONVERSAS (threads de mensagens)
CREATE TABLE IF NOT EXISTS chat_conversas (
    id SERIAL PRIMARY KEY,
    tipo VARCHAR(20) NOT NULL DEFAULT 'direct', -- 'direct', 'channel', 'system'
    nome VARCHAR(100), -- Nome do canal (se for canal)
    descricao TEXT,
    industria_id INTEGER, -- Se for canal de indústria
    criado_por INTEGER NOT NULL,
    empresa_id INTEGER NOT NULL,
    avatar_url VARCHAR(500),
    is_archived BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_message_at TIMESTAMP DEFAULT NOW()
);

-- 2. PARTICIPANTES DA CONVERSA
CREATE TABLE IF NOT EXISTS chat_participantes (
    id SERIAL PRIMARY KEY,
    conversa_id INTEGER NOT NULL REFERENCES chat_conversas(id) ON DELETE CASCADE,
    usuario_id INTEGER NOT NULL,
    role VARCHAR(20) DEFAULT 'member', -- 'owner', 'admin', 'member'
    is_muted BOOLEAN DEFAULT false,
    last_read_at TIMESTAMP DEFAULT NOW(),
    joined_at TIMESTAMP DEFAULT NOW(),
    left_at TIMESTAMP, -- NULL se ainda está na conversa
    UNIQUE(conversa_id, usuario_id)
);

-- 3. MENSAGENS
CREATE TABLE IF NOT EXISTS chat_mensagens (
    id SERIAL PRIMARY KEY,
    conversa_id INTEGER NOT NULL REFERENCES chat_conversas(id) ON DELETE CASCADE,
    remetente_id INTEGER NOT NULL,
    tipo VARCHAR(20) DEFAULT 'text', -- 'text', 'image', 'file', 'system', 'link'
    conteudo TEXT NOT NULL,
    metadata JSONB, -- { fileName, fileSize, fileUrl, linkPreview, etc }
    reply_to_id INTEGER REFERENCES chat_mensagens(id), -- Resposta a outra mensagem
    is_edited BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. STATUS DE LEITURA (para mensagens lidas/não lidas)
CREATE TABLE IF NOT EXISTS chat_leituras (
    id SERIAL PRIMARY KEY,
    mensagem_id INTEGER NOT NULL REFERENCES chat_mensagens(id) ON DELETE CASCADE,
    usuario_id INTEGER NOT NULL,
    lido_em TIMESTAMP DEFAULT NOW(),
    UNIQUE(mensagem_id, usuario_id)
);

-- 5. NOTIFICAÇÕES DO SISTEMA
CREATE TABLE IF NOT EXISTS chat_notificacoes (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL,
    empresa_id INTEGER NOT NULL,
    tipo VARCHAR(50) NOT NULL, -- 'novo_pedido', 'meta_atingida', 'cliente_aniversario', 'lembrete', etc
    titulo VARCHAR(200) NOT NULL,
    mensagem TEXT,
    link VARCHAR(500), -- Link para navegar ao clicar
    metadata JSONB,
    lida BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ÍNDICES para performance
CREATE INDEX IF NOT EXISTS idx_chat_conversas_empresa ON chat_conversas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversas_tipo ON chat_conversas(tipo);
CREATE INDEX IF NOT EXISTS idx_chat_participantes_usuario ON chat_participantes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_chat_participantes_conversa ON chat_participantes(conversa_id);
CREATE INDEX IF NOT EXISTS idx_chat_mensagens_conversa ON chat_mensagens(conversa_id);
CREATE INDEX IF NOT EXISTS idx_chat_mensagens_remetente ON chat_mensagens(remetente_id);
CREATE INDEX IF NOT EXISTS idx_chat_mensagens_created ON chat_mensagens(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_notificacoes_usuario ON chat_notificacoes(usuario_id, lida);

-- VIEW: Conversas com última mensagem e contagem de não lidas
CREATE OR REPLACE VIEW v_chat_conversas_resumo AS
SELECT 
    c.id,
    c.tipo,
    c.nome,
    c.descricao,
    c.industria_id,
    c.avatar_url,
    c.last_message_at,
    p.usuario_id,
    p.last_read_at,
    (
        SELECT COUNT(*) 
        FROM chat_mensagens m 
        WHERE m.conversa_id = c.id 
          AND m.created_at > COALESCE(p.last_read_at, '1970-01-01')
          AND m.remetente_id != p.usuario_id
    ) as nao_lidas,
    (
        SELECT m.conteudo 
        FROM chat_mensagens m 
        WHERE m.conversa_id = c.id 
        ORDER BY m.created_at DESC 
        LIMIT 1
    ) as ultima_mensagem,
    (
        SELECT m.remetente_id 
        FROM chat_mensagens m 
        WHERE m.conversa_id = c.id 
        ORDER BY m.created_at DESC 
        LIMIT 1
    ) as ultimo_remetente_id
FROM chat_conversas c
JOIN chat_participantes p ON p.conversa_id = c.id
WHERE c.is_archived = false AND p.left_at IS NULL;

-- Trigger para atualizar last_message_at quando nova mensagem é inserida
CREATE OR REPLACE FUNCTION update_conversa_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE chat_conversas 
    SET last_message_at = NOW(), updated_at = NOW()
    WHERE id = NEW.conversa_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_last_message ON chat_mensagens;
CREATE TRIGGER trg_update_last_message
    AFTER INSERT ON chat_mensagens
    FOR EACH ROW
    EXECUTE FUNCTION update_conversa_last_message();

-- =====================================================
-- DADOS INICIAIS DE TESTE
-- =====================================================

-- Canal geral de comunicação
INSERT INTO chat_conversas (tipo, nome, descricao, criado_por, empresa_id)
VALUES ('channel', '📢 Geral', 'Canal para comunicados gerais da equipe', 1, 1)
ON CONFLICT DO NOTHING;

-- Canal de vendas
INSERT INTO chat_conversas (tipo, nome, descricao, criado_por, empresa_id)
VALUES ('channel', '💰 Vendas', 'Discussões sobre vendas, metas e estratégias', 1, 1)
ON CONFLICT DO NOTHING;

-- Adicionar participante ao canal geral
INSERT INTO chat_participantes (conversa_id, usuario_id, role)
SELECT c.id, 1, 'owner'
FROM chat_conversas c WHERE c.nome = '📢 Geral'
ON CONFLICT DO NOTHING;

-- Mensagem de boas-vindas
INSERT INTO chat_mensagens (conversa_id, remetente_id, tipo, conteudo)
SELECT c.id, 1, 'system', '🎉 Bem-vindo ao SalesMaster Chat! Este é o canal geral de comunicação da equipe.'
FROM chat_conversas c WHERE c.nome = '📢 Geral'
LIMIT 1;

-- Notificação de exemplo
INSERT INTO chat_notificacoes (usuario_id, empresa_id, tipo, titulo, mensagem, link)
VALUES (1, 1, 'welcome', '👋 Bem-vindo ao Chat!', 'Seu sistema de comunicação está pronto para uso.', '/chat');

SELECT 'Chat Pro tables created successfully!' as status;
