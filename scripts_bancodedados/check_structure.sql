-- Consultar estrutura das tabelas CAD_PROD e CAD_TABELASPRE
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('cad_prod', 'cad_tabelaspre')
ORDER BY table_name;

-- Consultar colunas da tabela CAD_PROD
SELECT column_name, data_type, character_maximum_length, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'cad_prod'
ORDER BY ordinal_position;

-- Consultar colunas da tabela CAD_TABELASPRE
SELECT column_name, data_type, character_maximum_length, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'cad_tabelaspre'
ORDER BY ordinal_position;

-- Consultar constraints e índices
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name IN ('cad_prod', 'cad_tabelaspre')
ORDER BY tc.table_name, tc.constraint_type;
