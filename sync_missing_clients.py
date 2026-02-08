import psycopg2
from psycopg2.extras import RealDictCursor

DB_CONFIG = {
    'host': 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    'port': 13062,
    'database': 'basesales',
    'user': 'webadmin',
    'password': 'ytAyO0u043'
}

def sync_missing_clients():
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    # 1. Identificar clientes faltando em ro_consult para os pedidos de Jan/2026
    print("Buscando clientes faltantes em ro_consult para Jan/2026...")
    cur.execute("""
        SELECT DISTINCT p.ped_cliente 
        FROM ro_consult.pedidos p 
        LEFT JOIN ro_consult.clientes c ON p.ped_cliente = c.cli_codigo 
        WHERE p.ped_data BETWEEN '2026-01-01' AND '2026-01-31' 
          AND c.cli_codigo IS NULL
    """)
    missing_ids = [row['ped_cliente'] for row in cur.fetchall()]
    
    if not missing_ids:
        print("Nenhum cliente faltante encontrado.")
        conn.close()
        return

    print(f"IDs faltantes: {missing_ids}")

    # 2. Tentar buscar esses clientes no schema public
    print(f"Buscando IDs {missing_ids} no schema public...")
    cur.execute("SELECT * FROM public.clientes WHERE cli_codigo IN %s", (tuple(missing_ids),))
    clients_to_copy = cur.fetchall()
    
    if not clients_to_copy:
        print("Clientes não encontrados no schema public.")
    else:
        print(f"Encontrados {len(clients_to_copy)} clientes no public. Copiando para ro_consult...")
        for client in clients_to_copy:
            # Pegar colunas dinamicamente
            columns = client.keys()
            placeholders = ", ".join(["%s"] * len(columns))
            cols_str = ", ".join(columns)
            
            insert_query = f"INSERT INTO ro_consult.clientes ({cols_str}) VALUES ({placeholders}) ON CONFLICT DO NOTHING"
            cur.execute(insert_query, list(client.values()))
        
        conn.commit()
        print("Cópia concluída.")

    # 3. Verificar novamente
    cur.execute("""
        SELECT DISTINCT p.ped_cliente 
        FROM ro_consult.pedidos p 
        LEFT JOIN ro_consult.clientes c ON p.ped_cliente = c.cli_codigo 
        WHERE p.ped_data BETWEEN '2026-01-01' AND '2026-01-31' 
          AND c.cli_codigo IS NULL
    """)
    still_missing = [row['ped_cliente'] for row in cur.fetchall()]
    print(f"IDs ainda faltantes após cópia do public: {still_missing}")

    conn.close()

if __name__ == "__main__":
    sync_missing_clients()
