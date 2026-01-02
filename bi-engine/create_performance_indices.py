from services.database_native import db

def create_performance_indices():
    print("Creating performance indices...")
    
    # 1. itens_ped indices
    print("Creating index on itens_ped(ite_pedido)...")
    db.execute_non_query("CREATE INDEX IF NOT EXISTS idx_itens_ped_pedido ON itens_ped(ite_pedido);")
    
    print("Creating index on itens_ped(ite_produto)...")
    db.execute_non_query("CREATE INDEX IF NOT EXISTS idx_itens_ped_produto ON itens_ped(ite_produto);")
    
    # 2. Add composite index for pedidos if helpful
    print("Creating composite index on pedidos(ped_cliente, ped_data)...")
    db.execute_non_query("CREATE INDEX IF NOT EXISTS idx_pedidos_cliente_data ON pedidos(ped_cliente, ped_data DESC);")

    print("Performance indices created successfully.")

if __name__ == "__main__":
    create_performance_indices()
