from services.database_native import db

def create_fn_lista_industrias():
    print("Creating function fn_lista_industrias...")
    
    db.execute_non_query("""
        CREATE OR REPLACE FUNCTION fn_lista_industrias()
        RETURNS TABLE (
            codigo INTEGER,
            nome VARCHAR
        ) AS $$
        BEGIN
            RETURN QUERY
            SELECT 
                f.for_codigo as codigo,
                f.for_nomered as nome
            FROM fornecedores f
            WHERE f.for_tipo2 = 'A'
            ORDER BY f.for_nomered;
        END;
        $$ LANGUAGE plpgsql;
    """)
    
    print("Function fn_lista_industrias created successfully!")

if __name__ == "__main__":
    create_fn_lista_industrias()
