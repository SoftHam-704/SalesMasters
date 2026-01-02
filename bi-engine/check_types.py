from services.database_native import db

def check_types():
    query = """
    SELECT 
        table_name, column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name IN ('pedidos', 'clientes') 
      AND column_name IN ('ped_cliente', 'cli_codigo')
    """
    results = db.execute_query(query)
    for row in results:
        print(row)

if __name__ == "__main__":
    check_types()
