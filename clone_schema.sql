
-- =========================================================
-- SCRIPT DE CLONAGEM DE SCHEMA: PUBLIC -> BARROSREP
-- =========================================================

DO $$ 
DECLARE 
    r RECORD;
BEGIN
    -- 1. Criar o schema
    RAISE NOTICE 'Criando schema barrosrep...';
    CREATE SCHEMA IF NOT EXISTS barrosrep;

    -- 2. Loop para clonar cada tabela do public
    FOR r IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
    LOOP 
        RAISE NOTICE 'Clonando tabela: %', r.table_name;
        
        -- Cria tabela copiando estrutura, constraints, índices e defaults
        EXECUTE 'CREATE TABLE IF NOT EXISTS barrosrep.' || quote_ident(r.table_name) || 
                ' (LIKE public.' || quote_ident(r.table_name) || ' INCLUDING ALL)';
    END LOOP;

    -- 3. Limpar e copiar dados de usuários (user_nomes)
    RAISE NOTICE 'Copiando dados de user_nomes...';
    
    -- Verifica se a tabela existe antes de tentar inserir
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'barrosrep' AND table_name = 'user_nomes') THEN
        EXECUTE 'TRUNCATE TABLE barrosrep.user_nomes RESTART IDENTITY CASCADE';
        EXECUTE 'INSERT INTO barrosrep.user_nomes SELECT * FROM public.user_nomes';
        RAISE NOTICE 'Dados de usuários copiados com sucesso!';
    END IF;

    RAISE NOTICE '✅ Processo concluído com sucesso!';
END $$;
