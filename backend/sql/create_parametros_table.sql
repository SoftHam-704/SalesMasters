-- =====================================================
-- Tabela: PARAMETROS
-- Descrição: Configurações do sistema por usuário
-- =====================================================

CREATE TABLE IF NOT EXISTS parametros (
    par_id                  SERIAL PRIMARY KEY,
    par_usuario             INTEGER,
    par_ordemped            CHAR(1),
    par_qtdenter            INTEGER,
    par_itemduplicado       CHAR(1),
    par_ordemimpressao      CHAR(1),
    par_descontogrupo       CHAR(1),
    par_separalinhas        CHAR(1),
    par_usadecimais         CHAR(1),
    par_fmtpesquisa         CHAR(1),
    par_zerapromo           CHAR(1),
    par_tipopesquisa        CHAR(1),
    par_validapromocao      CHAR(1),
    par_salvapedidoauto     CHAR(1),
    par_mostracodori        CHAR(1),
    par_solicitarconfemail  CHAR(1),
    par_mostrapednovos      CHAR(1),
    par_mostraimpostos      CHAR(1),
    par_qtddecimais         INTEGER,
    par_pedidopadrao        INTEGER,
    par_telemkttipo         CHAR(1),
    par_iniciapedido        CHAR(1),
    par_tipofretepadrao     CHAR(1),
    par_emailserver         VARCHAR(80),
    par_email               VARCHAR(80),
    par_emailuser           VARCHAR(80),
    par_emailporta          INTEGER,
    par_emailpassword       VARCHAR(15),
    par_emailtls            BOOLEAN DEFAULT FALSE,
    par_emailssl            BOOLEAN DEFAULT FALSE,
    par_emailalternativo    VARCHAR(80),
    
    -- Timestamps para auditoria
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_parametros_usuario ON parametros(par_usuario);

-- Comentários
COMMENT ON TABLE parametros IS 'Configurações e preferências do sistema por usuário';
COMMENT ON COLUMN parametros.par_usuario IS 'ID do usuário (FK para tabela de usuários)';
COMMENT ON COLUMN parametros.par_ordemped IS 'Ordem de exibição dos pedidos';
COMMENT ON COLUMN parametros.par_qtdenter IS 'Quantidade ao pressionar Enter';
COMMENT ON COLUMN parametros.par_itemduplicado IS 'Permitir item duplicado (S/N)';
COMMENT ON COLUMN parametros.par_salvapedidoauto IS 'Salvar pedido automaticamente (S/N)';
COMMENT ON COLUMN parametros.par_emailtls IS 'Usar TLS para email';
COMMENT ON COLUMN parametros.par_emailssl IS 'Usar SSL para email';

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_parametros_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_parametros_updated_at
    BEFORE UPDATE ON parametros
    FOR EACH ROW
    EXECUTE FUNCTION update_parametros_timestamp();

-- Inserir registro padrão (opcional)
-- INSERT INTO parametros (par_usuario, par_ordemped, par_itemduplicado, par_salvapedidoauto)
-- VALUES (1, 'D', 'N', 'S');

COMMIT;
