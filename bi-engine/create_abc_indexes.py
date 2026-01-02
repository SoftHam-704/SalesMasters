from services.database_native import db

def create_abc_indexes():
    print("Creating indexes for ABC functions optimization...")
    
    # Pedidos indexes
    print("  - Creating idx_pedidos_data...")
    db.execute_non_query("CREATE INDEX IF NOT EXISTS idx_pedidos_data ON pedidos(ped_data)")
    
    print("  - Creating idx_pedidos_situacao...")
    db.execute_non_query("CREATE INDEX IF NOT EXISTS idx_pedidos_situacao ON pedidos(ped_situacao)")
    
    print("  - Creating idx_pedidos_industria...")
    db.execute_non_query("CREATE INDEX IF NOT EXISTS idx_pedidos_industria ON pedidos(ped_industria)")
    
    print("  - Creating idx_pedidos_composto...")
    db.execute_non_query("CREATE INDEX IF NOT EXISTS idx_pedidos_composto ON pedidos(ped_industria, ped_data, ped_situacao)")
    
    # Itens indexes
    print("  - Creating idx_itens_pedido...")
    db.execute_non_query("CREATE INDEX IF NOT EXISTS idx_itens_pedido ON itens_ped(ite_pedido)")
    
    print("  - Creating idx_itens_produto...")
    db.execute_non_query("CREATE INDEX IF NOT EXISTS idx_itens_produto ON itens_ped(ite_idproduto)")
    
    print("  - Creating idx_itens_industria...")
    db.execute_non_query("CREATE INDEX IF NOT EXISTS idx_itens_industria ON itens_ped(ite_industria)")
    
    # Produtos indexes
    print("  - Creating idx_produtos_industria...")
    db.execute_non_query("CREATE INDEX IF NOT EXISTS idx_produtos_industria ON cad_prod(pro_industria)")
    
    # Fornecedores indexes
    print("  - Creating idx_fornecedores_codigo...")
    db.execute_non_query("CREATE INDEX IF NOT EXISTS idx_fornecedores_codigo ON fornecedores(for_codigo)")
    
    print("\n✅ All indexes created successfully!")
    print("\nRecommendation: Run ANALYZE on tables to update statistics:")
    print("  CALL sp_atualizar_estatisticas_portfolio();")

if __name__ == "__main__":
    create_abc_indexes()
