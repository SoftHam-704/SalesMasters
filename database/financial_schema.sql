-- ============================================
-- MÓDULO FINANCEIRO - SCHEMA COMPLETO
-- ============================================
-- ATENÇÃO: Este módulo é TOTALMENTE SEPARADO do módulo de representação
-- Clientes e Fornecedores aqui são INDEPENDENTES

-- ============================================
-- 1. PLANO DE CONTAS (Hierárquico)
-- ============================================
CREATE TABLE fin_plano_contas (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(20) UNIQUE NOT NULL,  -- Ex: 1.1.01
    descricao VARCHAR(200) NOT NULL,
    tipo CHAR(1) NOT NULL CHECK (tipo IN ('R', 'D')),  -- R = Receita, D = Despesa
    nivel INTEGER NOT NULL CHECK (nivel BETWEEN 1 AND 3),
    id_pai INTEGER REFERENCES fin_plano_contas(id),
    ativo BOOLEAN DEFAULT true,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_fin_plano_tipo ON fin_plano_contas(tipo);
CREATE INDEX idx_fin_plano_ativo ON fin_plano_contas(ativo);
CREATE INDEX idx_fin_plano_pai ON fin_plano_contas(id_pai);

-- ============================================
-- 2. CENTRO DE CUSTO
-- ============================================
CREATE TABLE fin_centro_custo (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(20) UNIQUE NOT NULL,
    descricao VARCHAR(100) NOT NULL,
    ativo BOOLEAN DEFAULT true,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_fin_centro_ativo ON fin_centro_custo(ativo);

-- ============================================
-- 3. CLIENTES (FINANCEIRO - SEPARADO)
-- ============================================
CREATE TABLE fin_clientes (
    id SERIAL PRIMARY KEY,
    tipo_pessoa CHAR(1) NOT NULL CHECK (tipo_pessoa IN ('F', 'J')),  -- F = Física, J = Jurídica
    cpf_cnpj VARCHAR(18),
    nome_razao VARCHAR(200) NOT NULL,
    nome_fantasia VARCHAR(200),
    endereco VARCHAR(200),
    numero VARCHAR(20),
    complemento VARCHAR(100),
    bairro VARCHAR(100),
    cidade VARCHAR(100),
    uf CHAR(2),
    cep VARCHAR(10),
    telefone VARCHAR(20),
    celular VARCHAR(20),
    email VARCHAR(100),
    observacoes TEXT,
    ativo BOOLEAN DEFAULT true,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_fin_cli_cpf_cnpj ON fin_clientes(cpf_cnpj);
CREATE INDEX idx_fin_cli_nome ON fin_clientes(nome_razao);
CREATE INDEX idx_fin_cli_ativo ON fin_clientes(ativo);

-- ============================================
-- 4. FORNECEDORES (FINANCEIRO - SEPARADO)
-- ============================================
CREATE TABLE fin_fornecedores (
    id SERIAL PRIMARY KEY,
    tipo_pessoa CHAR(1) NOT NULL CHECK (tipo_pessoa IN ('F', 'J')),
    cpf_cnpj VARCHAR(18),
    nome_razao VARCHAR(200) NOT NULL,
    nome_fantasia VARCHAR(200),
    endereco VARCHAR(200),
    numero VARCHAR(20),
    complemento VARCHAR(100),
    bairro VARCHAR(100),
    cidade VARCHAR(100),
    uf CHAR(2),
    cep VARCHAR(10),
    telefone VARCHAR(20),
    celular VARCHAR(20),
    email VARCHAR(100),
    observacoes TEXT,
    ativo BOOLEAN DEFAULT true,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_fin_for_cpf_cnpj ON fin_fornecedores(cpf_cnpj);
CREATE INDEX idx_fin_for_nome ON fin_fornecedores(nome_razao);
CREATE INDEX idx_fin_for_ativo ON fin_fornecedores(ativo);

-- ============================================
-- 5. CONTAS A PAGAR
-- ============================================
CREATE TABLE fin_contas_pagar (
    id SERIAL PRIMARY KEY,
    descricao VARCHAR(200) NOT NULL,
    id_fornecedor INTEGER REFERENCES fin_fornecedores(id),
    numero_documento VARCHAR(50),
    valor_total DECIMAL(15,2) NOT NULL CHECK (valor_total >= 0),
    valor_pago DECIMAL(15,2) DEFAULT 0 CHECK (valor_pago >= 0),
    data_emissao DATE NOT NULL,
    data_vencimento DATE NOT NULL,
    data_pagamento DATE,
    status VARCHAR(20) DEFAULT 'ABERTO' CHECK (status IN ('ABERTO', 'PAGO', 'VENCIDO', 'CANCELADO')),
    observacoes TEXT,
    id_plano_contas INTEGER REFERENCES fin_plano_contas(id),
    id_centro_custo INTEGER REFERENCES fin_centro_custo(id),
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    criado_por VARCHAR(100),
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_fin_cp_vencimento ON fin_contas_pagar(data_vencimento);
CREATE INDEX idx_fin_cp_status ON fin_contas_pagar(status);
CREATE INDEX idx_fin_cp_fornecedor ON fin_contas_pagar(id_fornecedor);
CREATE INDEX idx_fin_cp_plano ON fin_contas_pagar(id_plano_contas);
CREATE INDEX idx_fin_cp_centro ON fin_contas_pagar(id_centro_custo);

-- ============================================
-- 6. PARCELAS DE CONTAS A PAGAR
-- ============================================
CREATE TABLE fin_parcelas_pagar (
    id SERIAL PRIMARY KEY,
    id_conta_pagar INTEGER NOT NULL REFERENCES fin_contas_pagar(id) ON DELETE CASCADE,
    numero_parcela INTEGER NOT NULL CHECK (numero_parcela > 0),
    valor DECIMAL(15,2) NOT NULL CHECK (valor >= 0),
    data_vencimento DATE NOT NULL,
    data_pagamento DATE,
    valor_pago DECIMAL(15,2) CHECK (valor_pago >= 0),
    juros DECIMAL(15,2) DEFAULT 0 CHECK (juros >= 0),
    desconto DECIMAL(15,2) DEFAULT 0 CHECK (desconto >= 0),
    status VARCHAR(20) DEFAULT 'ABERTO' CHECK (status IN ('ABERTO', 'PAGO', 'VENCIDO', 'CANCELADO')),
    observacoes TEXT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_fin_pp_conta ON fin_parcelas_pagar(id_conta_pagar);
CREATE INDEX idx_fin_pp_vencimento ON fin_parcelas_pagar(data_vencimento);
CREATE INDEX idx_fin_pp_status ON fin_parcelas_pagar(status);

-- ============================================
-- 7. CONTAS A RECEBER
-- ============================================
CREATE TABLE fin_contas_receber (
    id SERIAL PRIMARY KEY,
    descricao VARCHAR(200) NOT NULL,
    id_cliente INTEGER REFERENCES fin_clientes(id),
    numero_documento VARCHAR(50),
    valor_total DECIMAL(15,2) NOT NULL CHECK (valor_total >= 0),
    valor_recebido DECIMAL(15,2) DEFAULT 0 CHECK (valor_recebido >= 0),
    data_emissao DATE NOT NULL,
    data_vencimento DATE NOT NULL,
    data_recebimento DATE,
    status VARCHAR(20) DEFAULT 'ABERTO' CHECK (status IN ('ABERTO', 'RECEBIDO', 'VENCIDO', 'CANCELADO')),
    observacoes TEXT,
    id_plano_contas INTEGER REFERENCES fin_plano_contas(id),
    id_centro_custo INTEGER REFERENCES fin_centro_custo(id),
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    criado_por VARCHAR(100),
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_fin_cr_vencimento ON fin_contas_receber(data_vencimento);
CREATE INDEX idx_fin_cr_status ON fin_contas_receber(status);
CREATE INDEX idx_fin_cr_cliente ON fin_contas_receber(id_cliente);
CREATE INDEX idx_fin_cr_plano ON fin_contas_receber(id_plano_contas);
CREATE INDEX idx_fin_cr_centro ON fin_contas_receber(id_centro_custo);

-- ============================================
-- 8. PARCELAS DE CONTAS A RECEBER
-- ============================================
CREATE TABLE fin_parcelas_receber (
    id SERIAL PRIMARY KEY,
    id_conta_receber INTEGER NOT NULL REFERENCES fin_contas_receber(id) ON DELETE CASCADE,
    numero_parcela INTEGER NOT NULL CHECK (numero_parcela > 0),
    valor DECIMAL(15,2) NOT NULL CHECK (valor >= 0),
    data_vencimento DATE NOT NULL,
    data_recebimento DATE,
    valor_recebido DECIMAL(15,2) CHECK (valor_recebido >= 0),
    juros DECIMAL(15,2) DEFAULT 0 CHECK (juros >= 0),
    desconto DECIMAL(15,2) DEFAULT 0 CHECK (desconto >= 0),
    status VARCHAR(20) DEFAULT 'ABERTO' CHECK (status IN ('ABERTO', 'RECEBIDO', 'VENCIDO', 'CANCELADO')),
    observacoes TEXT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_fin_pr_conta ON fin_parcelas_receber(id_conta_receber);
CREATE INDEX idx_fin_pr_vencimento ON fin_parcelas_receber(data_vencimento);
CREATE INDEX idx_fin_pr_status ON fin_parcelas_receber(status);

-- ============================================
-- 9. MOVIMENTAÇÕES FINANCEIRAS (Fluxo de Caixa)
-- ============================================
CREATE TABLE fin_movimentacoes (
    id SERIAL PRIMARY KEY,
    tipo CHAR(1) NOT NULL CHECK (tipo IN ('E', 'S')),  -- E = Entrada, S = Saída
    descricao VARCHAR(200) NOT NULL,
    valor DECIMAL(15,2) NOT NULL CHECK (valor >= 0),
    data DATE NOT NULL,
    id_plano_contas INTEGER REFERENCES fin_plano_contas(id),
    id_centro_custo INTEGER REFERENCES fin_centro_custo(id),
    id_conta_pagar INTEGER REFERENCES fin_contas_pagar(id),
    id_conta_receber INTEGER REFERENCES fin_contas_receber(id),
    observacoes TEXT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    criado_por VARCHAR(100)
);

CREATE INDEX idx_fin_mov_data ON fin_movimentacoes(data);
CREATE INDEX idx_fin_mov_tipo ON fin_movimentacoes(tipo);
CREATE INDEX idx_fin_mov_plano ON fin_movimentacoes(id_plano_contas);
CREATE INDEX idx_fin_mov_centro ON fin_movimentacoes(id_centro_custo);

-- ============================================
-- TRIGGERS PARA ATUALIZAÇÃO AUTOMÁTICA
-- ============================================

-- Atualizar campo atualizado_em
CREATE OR REPLACE FUNCTION atualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_fin_plano_atualizado
    BEFORE UPDATE ON fin_plano_contas
    FOR EACH ROW EXECUTE FUNCTION atualizar_timestamp();

CREATE TRIGGER trg_fin_centro_atualizado
    BEFORE UPDATE ON fin_centro_custo
    FOR EACH ROW EXECUTE FUNCTION atualizar_timestamp();

CREATE TRIGGER trg_fin_clientes_atualizado
    BEFORE UPDATE ON fin_clientes
    FOR EACH ROW EXECUTE FUNCTION atualizar_timestamp();

CREATE TRIGGER trg_fin_fornecedores_atualizado
    BEFORE UPDATE ON fin_fornecedores
    FOR EACH ROW EXECUTE FUNCTION atualizar_timestamp();

CREATE TRIGGER trg_fin_cp_atualizado
    BEFORE UPDATE ON fin_contas_pagar
    FOR EACH ROW EXECUTE FUNCTION atualizar_timestamp();

CREATE TRIGGER trg_fin_cr_atualizado
    BEFORE UPDATE ON fin_contas_receber
    FOR EACH ROW EXECUTE FUNCTION atualizar_timestamp();

-- ============================================
-- COMENTÁRIOS NAS TABELAS
-- ============================================
COMMENT ON TABLE fin_plano_contas IS 'Plano de contas hierárquico (Receitas e Despesas)';
COMMENT ON TABLE fin_centro_custo IS 'Centros de custo para rateio de despesas/receitas';
COMMENT ON TABLE fin_clientes IS 'Clientes do módulo financeiro (SEPARADO da representação)';
COMMENT ON TABLE fin_fornecedores IS 'Fornecedores do módulo financeiro (SEPARADO das indústrias)';
COMMENT ON TABLE fin_contas_pagar IS 'Contas a pagar e obrigações';
COMMENT ON TABLE fin_parcelas_pagar IS 'Parcelas das contas a pagar';
COMMENT ON TABLE fin_contas_receber IS 'Contas a receber e direitos';
COMMENT ON TABLE fin_parcelas_receber IS 'Parcelas das contas a receber';
COMMENT ON TABLE fin_movimentacoes IS 'Movimentações de caixa (entradas e saídas)';
