from services.database_native import db

def create_fn_formatar_periodo():
    print("Creating function fn_formatar_periodo...")
    
    db.execute_non_query("""
        CREATE OR REPLACE FUNCTION fn_formatar_periodo(
            p_ano INTEGER,
            p_mes INTEGER DEFAULT NULL
        )
        RETURNS VARCHAR AS $$
        DECLARE
            v_mes_nome VARCHAR;
        BEGIN
            IF p_mes IS NOT NULL THEN
                v_mes_nome := CASE p_mes
                    WHEN 1 THEN 'Janeiro'
                    WHEN 2 THEN 'Fevereiro'
                    WHEN 3 THEN 'Março'
                    WHEN 4 THEN 'Abril'
                    WHEN 5 THEN 'Maio'
                    WHEN 6 THEN 'Junho'
                    WHEN 7 THEN 'Julho'
                    WHEN 8 THEN 'Agosto'
                    WHEN 9 THEN 'Setembro'
                    WHEN 10 THEN 'Outubro'
                    WHEN 11 THEN 'Novembro'
                    WHEN 12 THEN 'Dezembro'
                END;
                RETURN v_mes_nome || '/' || p_ano::VARCHAR;
            ELSE
                RETURN 'Ano completo ' || p_ano::VARCHAR;
            END IF;
        END;
        $$ LANGUAGE plpgsql IMMUTABLE;
    """)
    
    print("Function fn_formatar_periodo created successfully!")

if __name__ == "__main__":
    create_fn_formatar_periodo()
