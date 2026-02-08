from services.database_native import db

def optimize_performance():
    print("🚀 Starting BI Performance Optimization...")
    
    # 1. Get all relevant schemas
    schemas_df = db.execute_query("SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')")
    schemas = [s['schema_name'] for s in schemas_df]
    
    for schema in schemas:
        print(f"📦 Optimizing schema: {schema}")
        
        # Check if pedidos exists in this schema
        try:
            db.execute_query(f"SELECT 1 FROM {schema}.pedidos LIMIT 1")
        except:
            print(f"   ⚠️ Table pedidos not found in {schema}. Skipping.")
            continue

        queries = [
            # Functional indexes for Date filtros (Year/Month)
            f"CREATE INDEX IF NOT EXISTS idx_pedidos_data_year_{schema} ON {schema}.pedidos (EXTRACT(YEAR FROM ped_data));",
            f"CREATE INDEX IF NOT EXISTS idx_pedidos_data_month_{schema} ON {schema}.pedidos (EXTRACT(MONTH FROM ped_data));",
            
            # Composite index for Joins (Pedido + Industria)
            f"CREATE INDEX IF NOT EXISTS idx_pedidos_pedido_industria_{schema} ON {schema}.pedidos (ped_pedido, ped_industria);",
            f"CREATE INDEX IF NOT EXISTS idx_itens_ped_pedido_industria_{schema} ON {schema}.itens_ped (ite_pedido, ite_industria);",
            
            # Standard indexes for grouping and filtering if missing
            f"CREATE INDEX IF NOT EXISTS idx_pedidos_industria_{schema} ON {schema}.pedidos (ped_industria);",
            f"CREATE INDEX IF NOT EXISTS idx_pedidos_situacao_{schema} ON {schema}.pedidos (ped_situacao);",
            f"CREATE INDEX IF NOT EXISTS idx_itens_ped_industria_{schema} ON {schema}.itens_ped (ite_industria);",
            f"CREATE INDEX IF NOT EXISTS idx_itens_ped_produto_{schema} ON {schema}.itens_ped (ite_idproduto);",
            
            # Index for Client analysis
            f"CREATE INDEX IF NOT EXISTS idx_pedidos_cliente_data_{schema} ON {schema}.pedidos (ped_cliente, ped_data DESC);",
            
            # Index for for_nomered searches
            f"CREATE INDEX IF NOT EXISTS idx_fornecedores_nomered_{schema} ON {schema}.fornecedores (for_nomered);"
        ]
        
        for q in queries:
            try:
                db.execute_non_query(q)
                print(f"   ✅ {q.split(' ')[2]}")
            except Exception as e:
                print(f"   ❌ Error creating index: {e}")

        # Run ANALYZE to update statistics
        print(f"   📊 Running ANALYZE on {schema} tables...")
        db.execute_non_query(f"ANALYZE {schema}.pedidos;")
        db.execute_non_query(f"ANALYZE {schema}.itens_ped;")
        db.execute_non_query(f"ANALYZE {schema}.clientes;")
        db.execute_non_query(f"ANALYZE {schema}.fornecedores;")
        
    print("🎉 Optimization complete!")

if __name__ == "__main__":
    optimize_performance()
