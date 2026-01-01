-- Criação da tabela EMPRESA_STATUS para armazenar dados da empresa/representação
-- e o status do sistema (Ativo/Bloqueado)

CREATE TABLE IF NOT EXISTS empresa_status (
    emp_id SERIAL PRIMARY KEY,
    emp_situacao CHAR(1) DEFAULT 'A' CHECK (emp_situacao IN ('A', 'B')), -- A=Ativo, B=Bloqueado
    emp_nome VARCHAR(100),
    emp_endereco VARCHAR(200),
    emp_bairro VARCHAR(100),
    emp_cidade VARCHAR(100),
    emp_uf CHAR(2),
    emp_cep VARCHAR(15),
    emp_cnpj VARCHAR(20),
    emp_inscricao VARCHAR(30),
    emp_fones VARCHAR(50),
    emp_logotipo VARCHAR(500),
    emp_basedadoslocal VARCHAR(500),
    emp_host VARCHAR(100),
    emp_porta INTEGER,
    emp_username VARCHAR(50),
    emp_password VARCHAR(100),
    emp_pastabasica VARCHAR(500),
    emp_datacriacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    emp_dataatualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Garantir que apenas 1 registro pode existir na tabela
ALTER TABLE empresa_status ADD CONSTRAINT empresa_status_single_row CHECK (emp_id = 1);

-- Comentários descritivos
COMMENT ON TABLE empresa_status IS 'Tabela para armazenar dados da empresa/representação e status do sistema';
COMMENT ON COLUMN empresa_status.emp_situacao IS 'Situação do sistema: A=Ativo, B=Bloqueado';
COMMENT ON COLUMN empresa_status.emp_nome IS 'Nome da empresa/representação';
COMMENT ON COLUMN empresa_status.emp_logotipo IS 'Caminho do arquivo de logotipo';
COMMENT ON COLUMN empresa_status.emp_basedadoslocal IS 'Caminho do banco de dados Firebird local';
COMMENT ON COLUMN empresa_status.emp_pastabasica IS 'Pasta raiz da aplicação';
