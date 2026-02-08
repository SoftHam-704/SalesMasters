-- Fix: Corrigir nome da coluna de itab_industria para itab_idindustria

DO $$ 
DECLARE 
    r RECORD;
BEGIN
    -- Drop all existing versions of fn_upsert_preco
    FOR r IN (
        SELECT n.nspname, p.proname, oidvectortypes(p.proargtypes) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname = 'fn_upsert_preco'
          AND n.nspname NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
    ) 
    LOOP
        BEGIN
            EXECUTE 'DROP FUNCTION IF EXISTS ' || r.nspname || '.' || r.proname || '(' || r.args || ') CASCADE';
        EXCEPTION WHEN OTHERS THEN
            NULL;
        END;
    END LOOP;
END $$;

-- Criar versão correta no public
CREATE OR REPLACE FUNCTION public.fn_upsert_preco(
    p_pro_id INTEGER, 
    p_industria INTEGER, 
    p_tabela VARCHAR, 
    p_precobruto DOUBLE PRECISION, 
    p_precopromo DOUBLE PRECISION DEFAULT NULL, 
    p_precoespecial DOUBLE PRECISION DEFAULT NULL, 
    p_ipi DOUBLE PRECISION DEFAULT 0, 
    p_st DOUBLE PRECISION DEFAULT 0, 
    p_grupodesconto INTEGER DEFAULT NULL, 
    p_descontoadd DOUBLE PRECISION DEFAULT 0,
    p_datatbela DATE DEFAULT CURRENT_DATE, 
    p_datavencimento DATE DEFAULT NULL,
    p_prepeso DOUBLE PRECISION DEFAULT 0
)
RETURNS VOID
LANGUAGE plpgsql
AS $function$
BEGIN
    INSERT INTO cad_tabelaspre (
        itab_idprod,
        itab_idindustria,  -- CORRIGIDO: era itab_industria
        itab_tabela,
        itab_precobruto,
        itab_precopromo,
        itab_precoespecial,
        itab_ipi,
        itab_st,
        itab_grupodesconto,
        itab_descontoadd,
        itab_datatabela,
        itab_datavencimento,
        itab_prepeso,
        itab_status
    ) VALUES (
        p_pro_id,
        p_industria,
        p_tabela,
        p_precobruto,
        p_precopromo,
        p_precoespecial,
        p_ipi,
        p_st,
        p_grupodesconto,
        p_descontoadd,
        p_datatbela,
        p_datavencimento,
        p_prepeso,
        true
    )
    ON CONFLICT (itab_idprod, itab_tabela)
    DO UPDATE SET
        itab_precobruto = COALESCE(NULLIF(EXCLUDED.itab_precobruto, 0), cad_tabelaspre.itab_precobruto),
        itab_precopromo = COALESCE(NULLIF(EXCLUDED.itab_precopromo, 0), cad_tabelaspre.itab_precopromo),
        itab_precoespecial = COALESCE(NULLIF(EXCLUDED.itab_precoespecial, 0), cad_tabelaspre.itab_precoespecial),
        itab_ipi = COALESCE(NULLIF(EXCLUDED.itab_ipi, 0), cad_tabelaspre.itab_ipi),
        itab_st = COALESCE(NULLIF(EXCLUDED.itab_st, 0), cad_tabelaspre.itab_st),
        itab_grupodesconto = COALESCE(EXCLUDED.itab_grupodesconto, cad_tabelaspre.itab_grupodesconto),
        itab_descontoadd = COALESCE(NULLIF(EXCLUDED.itab_descontoadd, 0), cad_tabelaspre.itab_descontoadd),
        itab_datatabela = COALESCE(EXCLUDED.itab_datatabela, cad_tabelaspre.itab_datatabela),
        itab_datavencimento = COALESCE(EXCLUDED.itab_datavencimento, cad_tabelaspre.itab_datavencimento),
        itab_prepeso = COALESCE(NULLIF(EXCLUDED.itab_prepeso, 0), cad_tabelaspre.itab_prepeso),
        itab_status = EXCLUDED.itab_status;
END;
$function$;

-- Replicar para todos os schemas
DO $$ 
DECLARE 
    schema_name TEXT;
BEGIN
    FOR schema_name IN SELECT nspname FROM pg_namespace 
        WHERE nspname NOT IN ('information_schema', 'pg_catalog', 'pg_toast', 'public') 
    LOOP
        EXECUTE format('
            CREATE OR REPLACE FUNCTION %1$I.fn_upsert_preco(
                p_pro_id INTEGER, 
                p_industria INTEGER, 
                p_tabela VARCHAR, 
                p_precobruto DOUBLE PRECISION, 
                p_precopromo DOUBLE PRECISION DEFAULT NULL, 
                p_precoespecial DOUBLE PRECISION DEFAULT NULL, 
                p_ipi DOUBLE PRECISION DEFAULT 0, 
                p_st DOUBLE PRECISION DEFAULT 0, 
                p_grupodesconto INTEGER DEFAULT NULL, 
                p_descontoadd DOUBLE PRECISION DEFAULT 0,
                p_datatbela DATE DEFAULT CURRENT_DATE, 
                p_datavencimento DATE DEFAULT NULL,
                p_prepeso DOUBLE PRECISION DEFAULT 0
            )
            RETURNS VOID
            LANGUAGE plpgsql
            AS $func$
            BEGIN
                PERFORM public.fn_upsert_preco(
                    p_pro_id, p_industria, p_tabela, p_precobruto, 
                    p_precopromo, p_precoespecial, p_ipi, p_st, 
                    p_grupodesconto, p_descontoadd, p_datatbela, 
                    p_datavencimento, p_prepeso
                );
            END;
            $func$;', schema_name);
    END LOOP;
END $$;
