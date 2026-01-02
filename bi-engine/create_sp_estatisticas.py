from services.database_native import db

def create_sp_atualizar_estatisticas():
    print("Creating procedure sp_atualizar_estatisticas_portfolio...")
    
    db.execute_non_query("""
        CREATE OR REPLACE PROCEDURE sp_atualizar_estatisticas_portfolio()
        LANGUAGE plpgsql
        AS $$
        BEGIN
            -- Atualizar estatísticas das tabelas principais
            ANALYZE cad_prod;
            ANALYZE pedidos;
            ANALYZE itens_ped;
            ANALYZE fornecedores;
            
            RAISE NOTICE 'Estatísticas atualizadas com sucesso';
        END;
        $$;
    """)
    
    print("Procedure sp_atualizar_estatisticas_portfolio created successfully!")

if __name__ == "__main__":
    create_sp_atualizar_estatisticas()
