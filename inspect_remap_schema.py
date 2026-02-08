import psycopg2

DB_CONFIG = {
    'host': 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    'port': 13062,
    'database': 'basesales',
    'user': 'webadmin',
    'password': 'ytAyO0u043'
}

tables = ['cidades', 'clientes', 'fornecedores', 'grupos', 'transportadora', 'vendedores']

def inspect_schema():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        
        for table in tables:
            print(f"\n--- {table} ---")
            cur.execute(f"""
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_schema = 'remap' 
                  AND table_name = '{table}'
            """)
            cols = cur.fetchall()
            if not cols:
                print("Table not found!")
            else:
                print([f"{c[0]} ({c[1]})" for c in cols])
                
        conn.close()

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    inspect_schema()
