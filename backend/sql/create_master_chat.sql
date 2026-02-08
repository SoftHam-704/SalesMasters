-- TABELAS DE CHAT GLOBAL NO BANCO MASTER

-- 1. Conversas
CREATE TABLE IF NOT EXISTS chat_conversas (
    id SERIAL PRIMARY KEY,
    tipo VARCHAR(20) DEFAULT 'direct', -- 'direct', 'channel'
    nome VARCHAR(100),
    descricao TEXT,
    avatar_url TEXT,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    industria_id INTEGER,
    criado_por INTEGER,
    empresa_id INTEGER, -- Empresa de quem criou
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Participantes
CREATE TABLE IF NOT EXISTS chat_participantes (
    conversa_id INTEGER REFERENCES chat_conversas(id) ON DELETE CASCADE,
    usuario_id INTEGER, -- Relacionado ao campo 'id' da tabela 'usuarios' do Master
    last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    left_at TIMESTAMP WITH TIME ZONE,
    role VARCHAR(20) DEFAULT 'member', -- 'owner', 'member', 'admin'
    PRIMARY KEY (conversa_id, usuario_id)
);

-- 3. Mensagens
CREATE TABLE IF NOT EXISTS chat_mensagens (
    id SERIAL PRIMARY KEY,
    conversa_id INTEGER REFERENCES chat_conversas(id) ON DELETE CASCADE,
    remetente_id INTEGER,
    tipo VARCHAR(20) DEFAULT 'text', -- 'text', 'image', 'file', 'system'
    conteudo TEXT NOT NULL,
    metadata JSONB,
    reply_to_id INTEGER,
    is_edited BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Notificações
CREATE TABLE IF NOT EXISTS chat_notificacoes (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER,
    tipo VARCHAR(50),
    titulo VARCHAR(200),
    conteudo TEXT,
    link VARCHAR(255),
    lida BOOLEAN DEFAULT FALSE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Presença Online
CREATE TABLE IF NOT EXISTS user_presence (
    usuario_id INTEGER PRIMARY KEY,
    status VARCHAR(20) DEFAULT 'offline', -- 'online', 'offline', 'away', 'busy'
    custom_message VARCHAR(255),
    last_seen TIMESTAMP WITH TIME ZONE,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    device_info JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. View para compatibilidade com código antigo (que esperava user_nomes)
CREATE OR REPLACE VIEW user_nomes AS
SELECT 
    id as codigo,
    nome,
    sobrenome,
    email as usuario, -- Mapeando email para usuario para compatibilidade
    ativo
FROM usuarios;

-- 🛠️ FUNÇÕES DE SUPORTE

-- Função: Marcar Online
CREATE OR REPLACE FUNCTION fn_set_user_online(p_user_id INTEGER, p_device_info JSONB) 
RETURNS VOID AS $$
BEGIN
    INSERT INTO user_presence (usuario_id, status, last_activity, last_seen, device_info)
    VALUES (p_user_id, 'online', NOW(), NOW(), p_device_info)
    ON CONFLICT (usuario_id) DO UPDATE 
    SET status = 'online', 
        last_activity = NOW(), 
        last_seen = NOW(),
        device_info = COALESCE(p_device_info, user_presence.device_info),
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Função: Marcar Offline
CREATE OR REPLACE FUNCTION fn_set_user_offline(p_user_id INTEGER) 
RETURNS VOID AS $$
BEGIN
    UPDATE user_presence 
    SET status = 'offline', 
        last_seen = NOW(),
        updated_at = NOW()
    WHERE usuario_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Função: Update Heartbeat
CREATE OR REPLACE FUNCTION fn_update_heartbeat(p_user_id INTEGER) 
RETURNS VOID AS $$
BEGIN
    UPDATE user_presence 
    SET last_activity = NOW(),
        status = CASE WHEN status = 'offline' THEN 'online' ELSE status END,
        updated_at = NOW()
    WHERE usuario_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Função: Cleanup Usuários Inativos
CREATE OR REPLACE FUNCTION fn_cleanup_inactive_users() 
RETURNS INTEGER AS $$
DECLARE
    affected INTEGER;
BEGIN
    UPDATE user_presence 
    SET status = 'offline',
        updated_at = NOW()
    WHERE status != 'offline' 
      AND last_activity < NOW() - INTERVAL '5 minutes';
    
    GET DIAGNOSTICS affected = ROW_COUNT;
    RETURN affected;
END;
$$ LANGUAGE plpgsql;

-- 🧹 Função: LIMPEZA DE MENSAGENS ANTIGAS (Performance)
-- Remove mensagens com mais de 30 dias para manter o banco leve
CREATE OR REPLACE FUNCTION fn_cleanup_old_messages(days_to_keep INTEGER DEFAULT 30) 
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM chat_mensagens 
    WHERE created_at < NOW() - (days_to_keep || ' days')::INTERVAL;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar last_message_at na conversa
CREATE OR REPLACE FUNCTION fn_update_conversa_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE chat_conversas 
    SET last_message_at = NEW.created_at
    WHERE id = NEW.conversa_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_conversa_timestamp ON chat_mensagens;
CREATE TRIGGER trg_update_conversa_timestamp
AFTER INSERT ON chat_mensagens
FOR EACH ROW
EXECUTE FUNCTION fn_update_conversa_timestamp();
