-- =====================================================
-- 📅 SALESMASTER AGENDA PRO - Estrutura do Banco
-- Criado em: 2026-01-15
-- Ambiente: LOCAL (depois migra para produção)
-- =====================================================

-- Tabela principal de tarefas/eventos
CREATE TABLE IF NOT EXISTS agenda (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL,
    empresa_id INTEGER,
    
    -- Dados básicos
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    tipo VARCHAR(20) DEFAULT 'tarefa',  -- tarefa, lembrete, visita, ligacao, reuniao, cobranca, followup, aniversario
    
    -- Data/Hora
    data_inicio DATE NOT NULL,
    hora_inicio TIME,
    data_fim DATE,
    hora_fim TIME,
    dia_inteiro BOOLEAN DEFAULT false,
    
    -- Status e prioridade
    status VARCHAR(20) DEFAULT 'pendente',  -- pendente, em_andamento, concluida, adiada, cancelada
    prioridade CHAR(1) DEFAULT 'M',  -- A=Alta, M=Média, B=Baixa
    
    -- Vínculos com entidades do sistema
    cliente_id INTEGER,
    contato_id INTEGER,
    pedido_codigo VARCHAR(20),
    fornecedor_id INTEGER,
    crm_interacao_id INTEGER,
    financeiro_id INTEGER,
    
    -- Recorrência
    recorrente BOOLEAN DEFAULT false,
    tipo_recorrencia VARCHAR(20),  -- diaria, semanal, quinzenal, mensal, anual, personalizada
    intervalo_recorrencia INTEGER DEFAULT 1,
    dias_semana VARCHAR(20),  -- '1,3,5' para seg, qua, sex
    dia_do_mes INTEGER,
    recorrencia_fim DATE,
    tarefa_pai_id INTEGER REFERENCES agenda(id) ON DELETE SET NULL,
    
    -- Lembretes
    lembrete_ativo BOOLEAN DEFAULT true,
    lembrete_antes INTEGER DEFAULT 15,  -- minutos antes
    lembrete_enviado BOOLEAN DEFAULT false,
    
    -- Adiamento
    vezes_adiada INTEGER DEFAULT 0,
    data_original DATE,  -- guarda data original se foi adiada
    
    -- Conclusão
    concluido_em TIMESTAMP,
    notas_conclusao TEXT,
    
    -- Personalização
    cor VARCHAR(7),  -- hex color personalizada
    
    -- Controle
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices otimizados para performance
CREATE INDEX IF NOT EXISTS idx_agenda_usuario_data ON agenda(usuario_id, data_inicio, status);
CREATE INDEX IF NOT EXISTS idx_agenda_lembretes ON agenda(lembrete_ativo, lembrete_enviado, data_inicio, hora_inicio);
CREATE INDEX IF NOT EXISTS idx_agenda_status ON agenda(status, data_inicio);
CREATE INDEX IF NOT EXISTS idx_agenda_tipo ON agenda(tipo, usuario_id);

-- Tabela de histórico para auditoria
CREATE TABLE IF NOT EXISTS agenda_historico (
    id SERIAL PRIMARY KEY,
    agenda_id INTEGER REFERENCES agenda(id) ON DELETE CASCADE,
    usuario_id INTEGER,
    acao VARCHAR(50),  -- criado, editado, concluido, adiado, cancelado
    dados_anteriores JSONB,
    dados_novos JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Configurações do usuário para agenda
CREATE TABLE IF NOT EXISTS agenda_config (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER UNIQUE NOT NULL,
    hora_inicio_padrao TIME DEFAULT '08:00',
    hora_fim_padrao TIME DEFAULT '18:00',
    lembrete_padrao INTEGER DEFAULT 15,
    visualizacao_padrao VARCHAR(20) DEFAULT 'semana',  -- dia, semana, mes, lista
    notificar_email BOOLEAN DEFAULT false,
    notificar_sistema BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- View para resumo do dashboard (alertas)
CREATE OR REPLACE VIEW v_agenda_resumo AS
SELECT 
    usuario_id,
    COUNT(*) FILTER (WHERE status = 'pendente' AND data_inicio = CURRENT_DATE) as tarefas_hoje,
    COUNT(*) FILTER (WHERE status IN ('pendente', 'em_andamento') AND data_inicio < CURRENT_DATE) as atrasadas,
    COUNT(*) FILTER (WHERE tipo = 'aniversario' AND data_inicio = CURRENT_DATE) as aniversarios_hoje,
    (
        SELECT titulo || ' - ' || COALESCE(TO_CHAR(hora_inicio, 'HH24:MI'), 'Dia todo')
        FROM agenda a2 
        WHERE a2.usuario_id = agenda.usuario_id 
          AND a2.status IN ('pendente', 'em_andamento')
          AND a2.data_inicio = CURRENT_DATE
          AND a2.hora_inicio IS NOT NULL
        ORDER BY a2.hora_inicio
        LIMIT 1
    ) as proximo_compromisso
FROM agenda
WHERE status IN ('pendente', 'em_andamento')
GROUP BY usuario_id;

-- View para próximos lembretes (usada pelo job de notificações)
CREATE OR REPLACE VIEW v_proximos_lembretes AS
SELECT 
    a.id,
    a.usuario_id,
    a.titulo,
    a.descricao,
    a.tipo,
    a.data_inicio,
    a.hora_inicio,
    a.lembrete_antes,
    a.cliente_id,
    a.pedido_codigo
FROM agenda a
WHERE a.status IN ('pendente', 'em_andamento')
  AND a.lembrete_ativo = true
  AND a.lembrete_enviado = false
  AND a.data_inicio = CURRENT_DATE
  AND (
      a.hora_inicio IS NULL 
      OR (a.hora_inicio - (a.lembrete_antes || ' minutes')::interval) <= CURRENT_TIME
  );

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_agenda_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para updated_at
DROP TRIGGER IF EXISTS trigger_agenda_updated ON agenda;
CREATE TRIGGER trigger_agenda_updated
    BEFORE UPDATE ON agenda
    FOR EACH ROW
    EXECUTE FUNCTION update_agenda_timestamp();

-- Inserir algumas tarefas de exemplo para teste
INSERT INTO agenda (usuario_id, empresa_id, titulo, descricao, tipo, data_inicio, hora_inicio, status, prioridade) VALUES
(1, 1, 'Ligar para cliente ABC', 'Confirmar recebimento do pedido', 'ligacao', CURRENT_DATE, '10:00', 'pendente', 'A'),
(1, 1, 'Visita técnica - Empresa XYZ', 'Levar amostras dos novos produtos', 'visita', CURRENT_DATE, '14:00', 'pendente', 'M'),
(1, 1, 'Enviar proposta comercial', 'Cliente solicitou orçamento para 500 unidades', 'tarefa', CURRENT_DATE, '16:00', 'pendente', 'A'),
(1, 1, 'Cobrar pagamento pedido #HS001234', 'Venceu há 5 dias', 'cobranca', CURRENT_DATE - INTERVAL '5 days', '09:00', 'pendente', 'A'),
(1, 1, 'Follow-up reunião comercial', 'Retornar sobre condições discutidas', 'followup', CURRENT_DATE + INTERVAL '1 day', '11:00', 'pendente', 'M'),
(1, 1, 'Relatório mensal de vendas', 'Consolidar números de janeiro', 'tarefa', CURRENT_DATE + INTERVAL '2 days', NULL, 'pendente', 'B')
ON CONFLICT DO NOTHING;

-- Mensagem de conclusão
DO $$
BEGIN
    RAISE NOTICE '✅ Tabelas da Agenda criadas com sucesso!';
    RAISE NOTICE '📊 Inseridas 6 tarefas de exemplo para teste.';
END $$;
