
-- Import data from target to public for cad_prod and cad_tabelaspre
BEGIN;

-- TRUNCATE public tables
TRUNCATE public.cad_prod CASCADE;
TRUNCATE public.cad_tabelaspre CASCADE;

-- Import cad_prod
INSERT INTO public.cad_prod SELECT * FROM target.cad_prod;
-- Import cad_tabelaspre
INSERT INTO public.cad_tabelaspre SELECT * FROM target.cad_tabelaspre;

-- Reset sequence for cad_prod
SELECT setval('public.gen_cad_prod_id', (SELECT COALESCE(MAX(pro_id), 1) FROM public.cad_prod));

COMMIT;

-- Verify counts
SELECT 'public.cad_prod' as table_name, count(*) FROM public.cad_prod
UNION ALL
SELECT 'public.cad_tabelaspre' as table_name, count(*) FROM public.cad_tabelaspre;
