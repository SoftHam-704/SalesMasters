-- ============================================
-- MÓDULO FINANCEIRO - RELATÓRIOS
-- ============================================
-- Funções PostgreSQL para os relatórios essenciais

-- ============================================
-- 1. FLUXO DE CAIXA
-- ============================================
CREATE OR REPLACE FUNCTION get_fluxo_caixa(
    p_data_inicio DATE,
    p_data_fim DATE,
    p_agrupamento VARCHAR DEFAULT 'DIARIO' -- DIARIO, SEMANAL, MENSAL
)
RETURNS TABLE (
    periodo VARCHAR,
    data_ref DATE,
    entradas DECIMAL(15,2),
    saidas DECIMAL(15,2),
    saldo DECIMAL(15,2),
    saldo_acumulado DECIMAL(15,2)
) AS $$
BEGIN
    RETURN QUERY
    WITH movimentacoes AS (
        -- Entradas (Contas a Receber)
        SELECT 
            pr.data_recebimento as data,
            pr.valor_recebido as valor,
            'E' as tipo
        FROM fin_parcelas_receber pr
        WHERE pr.status = 'RECEBIDO'
        AND pr.data_recebimento BETWEEN p_data_inicio AND p_data_fim
        
        UNION ALL
        
        -- Saídas (Contas a Pagar)
        SELECT 
            pp.data_pagamento as data,
            pp.valor_pago as valor,
            'S' as tipo
        FROM fin_parcelas_pagar pp
        WHERE pp.status = 'PAGO'
        AND pp.data_pagamento BETWEEN p_data_inicio AND p_data_fim
    ),
    agrupado AS (
        SELECT 
            CASE 
                WHEN p_agrupamento = 'DIARIO' THEN TO_CHAR(m.data, 'DD/MM/YYYY')
                WHEN p_agrupamento = 'SEMANAL' THEN 
                    'Semana ' || TO_CHAR(DATE_TRUNC('week', m.data), 'WW/YYYY')
                WHEN p_agrupamento = 'MENSAL' THEN TO_CHAR(m.data, 'MM/YYYY')
            END as periodo,
            CASE 
                WHEN p_agrupamento = 'DIARIO' THEN m.data
                WHEN p_agrupamento = 'SEMANAL' THEN DATE_TRUNC('week', m.data)::DATE
                WHEN p_agrupamento = 'MENSAL' THEN DATE_TRUNC('month', m.data)::DATE
            END as data_ref,
            COALESCE(SUM(CASE WHEN m.tipo = 'E' THEN m.valor ELSE 0 END), 0) as entradas,
            COALESCE(SUM(CASE WHEN m.tipo = 'S' THEN m.valor ELSE 0 END), 0) as saidas
        FROM movimentacoes m
        GROUP BY periodo, data_ref
        ORDER BY data_ref
    )
    SELECT 
        a.periodo,
        a.data_ref,
        a.entradas,
        a.saidas,
        (a.entradas - a.saidas) as saldo,
        SUM(a.entradas - a.saidas) OVER (ORDER BY a.data_ref)::DECIMAL(15,2) as saldo_acumulado
    FROM agrupado a;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 2. RELATÓRIO CONTAS A PAGAR
-- ============================================
CREATE OR REPLACE FUNCTION get_relatorio_contas_pagar(
    p_data_inicio DATE DEFAULT NULL,
    p_data_fim DATE DEFAULT NULL,
    p_status VARCHAR DEFAULT NULL,
    p_id_fornecedor INTEGER DEFAULT NULL,
    p_id_centro_custo INTEGER DEFAULT NULL
)
RETURNS TABLE (
    id_conta INTEGER,
    descricao VARCHAR,
    numero_documento VARCHAR,
    fornecedor_nome VARCHAR,
    fornecedor_cpf_cnpj VARCHAR,
    plano_contas VARCHAR,
    centro_custo VARCHAR,
    valor_total DECIMAL(15,2),
    valor_pago DECIMAL(15,2),
    saldo DECIMAL(15,2),
    data_emissao DATE,
    data_vencimento DATE,
    data_pagamento DATE,
    status VARCHAR,
    dias_atraso INTEGER,
    id_parcela INTEGER,
    numero_parcela INTEGER,
    valor_parcela DECIMAL(15,2),
    vencimento_parcela DATE,
    pagamento_parcela DATE,
    status_parcela VARCHAR,
    juros DECIMAL(15,2),
    desconto DECIMAL(15,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cp.id,
        cp.descricao,
        cp.numero_documento,
        f.nome_razao,
        f.cpf_cnpj,
        pc.descricao,
        cc.descricao,
        cp.valor_total,
        cp.valor_pago,
        (cp.valor_total - cp.valor_pago)::DECIMAL(15,2),
        cp.data_emissao,
        cp.data_vencimento,
        cp.data_pagamento,
        cp.status,
        CASE 
            WHEN cp.status IN ('ABERTO', 'VENCIDO') AND cp.data_vencimento < CURRENT_DATE 
            THEN (CURRENT_DATE - cp.data_vencimento)
            ELSE 0
        END as dias_atraso,
        pp.id,
        pp.numero_parcela,
        pp.valor,
        pp.data_vencimento,
        pp.data_pagamento,
        pp.status,
        pp.juros,
        pp.desconto
    FROM fin_contas_pagar cp
    LEFT JOIN fin_fornecedores f ON cp.id_fornecedor = f.id
    LEFT JOIN fin_plano_contas pc ON cp.id_plano_contas = pc.id
    LEFT JOIN fin_centro_custo cc ON cp.id_centro_custo = cc.id
    LEFT JOIN fin_parcelas_pagar pp ON pp.id_conta_pagar = cp.id
    WHERE 
        (p_data_inicio IS NULL OR cp.data_vencimento >= p_data_inicio)
        AND (p_data_fim IS NULL OR cp.data_vencimento <= p_data_fim)
        AND (p_status IS NULL OR cp.status = p_status)
        AND (p_id_fornecedor IS NULL OR cp.id_fornecedor = p_id_fornecedor)
        AND (p_id_centro_custo IS NULL OR cp.id_centro_custo = p_id_centro_custo)
    ORDER BY cp.data_vencimento DESC, cp.id, pp.numero_parcela;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 3. RELATÓRIO CONTAS A RECEBER
-- ============================================
CREATE OR REPLACE FUNCTION get_relatorio_contas_receber(
    p_data_inicio DATE DEFAULT NULL,
    p_data_fim DATE DEFAULT NULL,
    p_status VARCHAR DEFAULT NULL,
    p_id_cliente INTEGER DEFAULT NULL,
    p_id_centro_custo INTEGER DEFAULT NULL
)
RETURNS TABLE (
    id_conta INTEGER,
    descricao VARCHAR,
    numero_documento VARCHAR,
    cliente_nome VARCHAR,
    cliente_cpf_cnpj VARCHAR,
    plano_contas VARCHAR,
    centro_custo VARCHAR,
    valor_total DECIMAL(15,2),
    valor_recebido DECIMAL(15,2),
    saldo DECIMAL(15,2),
    data_emissao DATE,
    data_vencimento DATE,
    data_recebimento DATE,
    status VARCHAR,
    dias_atraso INTEGER,
    id_parcela INTEGER,
    numero_parcela INTEGER,
    valor_parcela DECIMAL(15,2),
    vencimento_parcela DATE,
    recebimento_parcela DATE,
    status_parcela VARCHAR,
    juros DECIMAL(15,2),
    desconto DECIMAL(15,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cr.id,
        cr.descricao,
        cr.numero_documento,
        c.nome_razao,
        c.cpf_cnpj,
        pc.descricao,
        cc.descricao,
        cr.valor_total,
        cr.valor_recebido,
        (cr.valor_total - cr.valor_recebido)::DECIMAL(15,2),
        cr.data_emissao,
        cr.data_vencimento,
        cr.data_recebimento,
        cr.status,
        CASE 
            WHEN cr.status IN ('ABERTO', 'VENCIDO') AND cr.data_vencimento < CURRENT_DATE 
            THEN (CURRENT_DATE - cr.data_vencimento)
            ELSE 0
        END as dias_atraso,
        pr.id,
        pr.numero_parcela,
        pr.valor,
        pr.data_vencimento,
        pr.data_recebimento,
        pr.status,
        pr.juros,
        pr.desconto
    FROM fin_contas_receber cr
    LEFT JOIN fin_clientes c ON cr.id_cliente = c.id
    LEFT JOIN fin_plano_contas pc ON cr.id_plano_contas = pc.id
    LEFT JOIN fin_centro_custo cc ON cr.id_centro_custo = cc.id
    LEFT JOIN fin_parcelas_receber pr ON pr.id_conta_receber = cr.id
    WHERE 
        (p_data_inicio IS NULL OR cr.data_vencimento >= p_data_inicio)
        AND (p_data_fim IS NULL OR cr.data_vencimento <= p_data_fim)
        AND (p_status IS NULL OR cr.status = p_status)
        AND (p_id_cliente IS NULL OR cr.id_cliente = p_id_cliente)
        AND (p_id_centro_custo IS NULL OR cr.id_centro_custo = p_id_centro_custo)
    ORDER BY cr.data_vencimento DESC, cr.id, pr.numero_parcela;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 4. DRE SIMPLES (Demonstração de Resultado)
-- ============================================
CREATE OR REPLACE FUNCTION get_dre_simples(
    p_mes INTEGER,
    p_ano INTEGER
)
RETURNS TABLE (
    tipo CHAR(1),
    nivel INTEGER,
    codigo VARCHAR,
    descricao VARCHAR,
    valor DECIMAL(15,2),
    percentual DECIMAL(5,2)
) AS $$
DECLARE
    v_data_inicio DATE;
    v_data_fim DATE;
    v_total_receitas DECIMAL(15,2);
BEGIN
    -- Definir período
    v_data_inicio := DATE(p_ano || '-' || LPAD(p_mes::TEXT, 2, '0') || '-01');
    v_data_fim := (v_data_inicio + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
    
    -- Calcular total de receitas para percentuais
    SELECT COALESCE(SUM(pr.valor_recebido), 0)
    INTO v_total_receitas
    FROM fin_parcelas_receber pr
    WHERE pr.status = 'RECEBIDO'
    AND pr.data_recebimento BETWEEN v_data_inicio AND v_data_fim;
    
    -- Se não houver receitas, evitar divisão por zero
    IF v_total_receitas = 0 THEN
        v_total_receitas := 1;
    END IF;
    
    RETURN QUERY
    WITH movimentacoes_periodo AS (
        -- Receitas
        SELECT 
            pc.id,
            pc.tipo,
            pc.nivel,
            pc.codigo,
            pc.descricao,
            COALESCE(SUM(pr.valor_recebido), 0) as valor
        FROM fin_plano_contas pc
        LEFT JOIN fin_contas_receber cr ON cr.id_plano_contas = pc.id
        LEFT JOIN fin_parcelas_receber pr ON pr.id_conta_receber = cr.id 
            AND pr.status = 'RECEBIDO'
            AND pr.data_recebimento BETWEEN v_data_inicio AND v_data_fim
        WHERE pc.tipo = 'R' AND pc.ativo = true
        GROUP BY pc.id, pc.tipo, pc.nivel, pc.codigo, pc.descricao
        
        UNION ALL
        
        -- Despesas
        SELECT 
            pc.id,
            pc.tipo,
            pc.nivel,
            pc.codigo,
            pc.descricao,
            COALESCE(SUM(pp.valor_pago), 0) as valor
        FROM fin_plano_contas pc
        LEFT JOIN fin_contas_pagar cp ON cp.id_plano_contas = pc.id
        LEFT JOIN fin_parcelas_pagar pp ON pp.id_conta_pagar = cp.id 
            AND pp.status = 'PAGO'
            AND pp.data_pagamento BETWEEN v_data_inicio AND v_data_fim
        WHERE pc.tipo = 'D' AND pc.ativo = true
        GROUP BY pc.id, pc.tipo, pc.nivel, pc.codigo, pc.descricao
    )
    SELECT 
        m.tipo,
        m.nivel,
        m.codigo,
        m.descricao,
        m.valor,
        ROUND((m.valor / v_total_receitas * 100)::NUMERIC, 2)::DECIMAL(5,2) as percentual
    FROM movimentacoes_periodo m
    WHERE m.valor > 0 OR m.nivel <= 2  -- Mostrar contas com valor ou contas pai
    ORDER BY m.tipo DESC, m.codigo;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMENTÁRIOS
-- ============================================
COMMENT ON FUNCTION get_fluxo_caixa IS 'Relatório de fluxo de caixa com agrupamento personalizável';
COMMENT ON FUNCTION get_relatorio_contas_pagar IS 'Relatório detalhado de contas a pagar com parcelas';
COMMENT ON FUNCTION get_relatorio_contas_receber IS 'Relatório detalhado de contas a receber com parcelas';
COMMENT ON FUNCTION get_dre_simples IS 'Demonstração de Resultado do Exercício simplificada';
