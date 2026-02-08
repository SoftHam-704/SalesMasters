-- =====================================================
-- 💬 SALESMASTER CHAT - SISTEMA DE PRESENÇA ONLINE
-- Criado em: 2026-01-28
-- Descrição: Implementa rastreamento de status online/offline
-- =====================================================

-- ==================== TABELA DE PRESENÇA ====================

-- Criar tabela de presença de usuários
CREATE TABLE IF NOT EXISTS public.user_presence (
    usuario_id INTEGER PRIMARY KEY REFERENCES public.user_nomes(codigo) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'away', 'busy')),
    custom_message VARCHAR(100), -- Mensagem personalizada de status
    last_seen TIMESTAMP,
    last_activity TIMESTAMP DEFAULT NOW(),
    device_info JSONB, -- {browser, os, ip, location}
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Comentários
COMMENT ON TABLE public.user_presence IS 'Rastreamento de presença online de usuários do chat';
COMMENT ON COLUMN public.user_presence.status IS 'Status atual: online, offline, away, busy';
COMMENT ON COLUMN public.user_presence.custom_message IS 'Mensagem personalizada do usuário (ex: "Em reunião")';
COMMENT ON COLUMN public.user_presence.last_seen IS 'Última vez que o usuário foi visto online';
COMMENT ON COLUMN public.user_presence.last_activity IS 'Última atividade registrada (heartbeat)';
COMMENT ON COLUMN public.user_presence.device_info IS 'Informações do dispositivo em JSON';

-- ==================== ÍNDICES ====================

CREATE INDEX IF NOT EXISTS idx_user_presence_status ON public.user_presence(status);
CREATE INDEX IF NOT EXISTS idx_user_presence_last_activity ON public.user_presence(last_activity);
CREATE INDEX IF NOT EXISTS idx_user_presence_updated_at ON public.user_presence(updated_at);

-- ==================== TRIGGER PARA UPDATED_AT ====================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_user_presence_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
DROP TRIGGER IF EXISTS trigger_user_presence_updated_at ON public.user_presence;
CREATE TRIGGER trigger_user_presence_updated_at
    BEFORE UPDATE ON public.user_presence
    FOR EACH ROW
    EXECUTE FUNCTION update_user_presence_updated_at();

-- ==================== FUNÇÕES AUXILIARES ====================

-- Função para marcar usuário como online
CREATE OR REPLACE FUNCTION fn_set_user_online(p_usuario_id INTEGER, p_device_info JSONB DEFAULT NULL)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.user_presence (usuario_id, status, last_seen, last_activity, device_info)
    VALUES (p_usuario_id, 'online', NOW(), NOW(), p_device_info)
    ON CONFLICT (usuario_id) 
    DO UPDATE SET 
        status = 'online',
        last_seen = NOW(),
        last_activity = NOW(),
        device_info = COALESCE(EXCLUDED.device_info, user_presence.device_info);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_set_user_online IS 'Marca usuário como online e atualiza timestamp';

-- Função para marcar usuário como offline
CREATE OR REPLACE FUNCTION fn_set_user_offline(p_usuario_id INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE public.user_presence 
    SET status = 'offline', last_seen = NOW()
    WHERE usuario_id = p_usuario_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_set_user_offline IS 'Marca usuário como offline ao fazer logout';

-- Função para atualizar heartbeat (manter vivo)
CREATE OR REPLACE FUNCTION fn_update_heartbeat(p_usuario_id INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE public.user_presence 
    SET last_activity = NOW()
    WHERE usuario_id = p_usuario_id;
    
    -- Se não existir registro, criar como online
    IF NOT FOUND THEN
        INSERT INTO public.user_presence (usuario_id, status, last_activity)
        VALUES (p_usuario_id, 'online', NOW());
    END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_update_heartbeat IS 'Atualiza timestamp de atividade (heartbeat do cliente)';

-- Função para marcar usuários inativos como offline
-- (Rodar via cron job ou a cada X minutos)
CREATE OR REPLACE FUNCTION fn_cleanup_inactive_users()
RETURNS INTEGER AS $$
DECLARE
    affected_rows INTEGER;
BEGIN
    -- Marcar como offline usuários sem atividade há mais de 5 minutos
    UPDATE public.user_presence
    SET status = 'offline', last_seen = last_activity
    WHERE status IN ('online', 'away', 'busy')
      AND last_activity < NOW() - INTERVAL '5 minutes';
    
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    RETURN affected_rows;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_cleanup_inactive_users IS 'Marca usuários inativos (>5min) como offline';

-- ==================== VIEW ÚTIL ====================

-- View para listar usuários com informações de presença
CREATE OR REPLACE VIEW v_users_with_presence AS
SELECT 
    u.codigo,
    u.nome,
    u.sobrenome,
    u.usuario,
    u.grupo,
    u.master,
    u.gerencia,
    COALESCE(p.status, 'offline') as status,
    p.custom_message,
    p.last_seen,
    p.last_activity,
    p.device_info,
    CASE 
        WHEN p.status = 'online' AND p.last_activity > NOW() - INTERVAL '2 minutes' THEN 'online'
        WHEN p.status = 'online' AND p.last_activity > NOW() - INTERVAL '5 minutes' THEN 'away'
        ELSE 'offline'
    END as effective_status,
    CASE
        WHEN p.last_seen IS NULL THEN 'Nunca conectou'
        WHEN p.last_seen > NOW() - INTERVAL '1 hour' THEN 'Há ' || EXTRACT(MINUTE FROM NOW() - p.last_seen)::TEXT || ' minutos'
        WHEN p.last_seen > NOW() - INTERVAL '1 day' THEN 'Há ' || EXTRACT(HOUR FROM NOW() - p.last_seen)::TEXT || ' horas'
        WHEN p.last_seen > NOW() - INTERVAL '7 days' THEN 'Há ' || EXTRACT(DAY FROM NOW() - p.last_seen)::TEXT || ' dias'
        ELSE 'Há mais de uma semana'
    END as last_seen_text
FROM public.user_nomes u
LEFT JOIN public.user_presence p ON p.usuario_id = u.codigo
WHERE u.ativo = true
ORDER BY 
    CASE p.status 
        WHEN 'online' THEN 1
        WHEN 'away' THEN 2
        WHEN 'busy' THEN 3
        ELSE 4
    END,
    u.nome;

COMMENT ON VIEW v_users_with_presence IS 'View com usuários e status de presença online';

-- ==================== DADOS INICIAIS ====================

-- Popular presença para usuários existentes (todos offline inicialmente)
INSERT INTO public.user_presence (usuario_id, status, last_seen)
SELECT codigo, 'offline', NOW()
FROM public.user_nomes
WHERE ativo = true
ON CONFLICT (usuario_id) DO NOTHING;

-- ==================== VERIFICAÇÃO ====================

-- Verificar criação
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM public.user_presence;
    RAISE NOTICE '✅ Tabela user_presence criada com % registros', v_count;
    
    SELECT COUNT(*) INTO v_count FROM pg_indexes WHERE tablename = 'user_presence';
    RAISE NOTICE '✅ % índices criados', v_count;
    
    RAISE NOTICE '✅ Sistema de presença instalado com sucesso!';
END $$;

-- ==================== EXEMPLO DE USO ====================

/*
-- Marcar usuário 1 como online
SELECT fn_set_user_online(1, '{"browser": "Chrome", "os": "Windows"}'::jsonb);

-- Atualizar heartbeat do usuário 1
SELECT fn_update_heartbeat(1);

-- Marcar usuário 1 como offline
SELECT fn_set_user_offline(1);

-- Limpar usuários inativos
SELECT fn_cleanup_inactive_users();

-- Ver todos usuários com status
SELECT * FROM v_users_with_presence;

-- Contar online agora
SELECT COUNT(*) FROM v_users_with_presence WHERE effective_status = 'online';
*/
