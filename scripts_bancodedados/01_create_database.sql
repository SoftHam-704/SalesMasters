-- Script de Criação do Database BaseSales
-- SalesMasters Migration Project

-- Criar database BaseSales
CREATE DATABASE basesales
    WITH 
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'Portuguese_Brazil.1252'
    LC_CTYPE = 'Portuguese_Brazil.1252'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1
    TEMPLATE = template0;

-- Comentário descritivo
COMMENT ON DATABASE basesales IS 'SalesMasters - Sistema de Representação Comercial de Peças Automotivas';
