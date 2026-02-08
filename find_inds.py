import psycopg2
from psycopg2.extras import RealDictCursor

DB_CONFIG = {
    'host': 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    'port': 13062,
    'database': 'basesales',
    'user': 'webadmin',
    'password': 'ytAyO0u043'
}

def find_industries():
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    print("--- Searching for tables named '%fornecedores%' ---")
    cur.execute("SELECT table_schema, table_name FROM information_schema.tables WHERE table_name LIKE '%fornecedores%'")
    tables = cur.fetchall()
    
    target_ids = [8, 3] # IDs missing from public.fornecedores
    
    for t in tables:
        schema = t['table_schema']
        table = t['table_name']
        full_name = f"{schema}.{table}"
        print(f"\nChecking {full_name}...")
        
        try:
            # Check if has 'for_codigo' or 'id'
            cur.execute(f"SELECT column_name FROM information_schema.columns WHERE table_schema = '{schema}' AND table_name = '{table}'")
            cols = [c['column_name'] for c in cur.fetchall()]
            
            id_col = 'for_codigo' if 'for_codigo' in cols else 'id' if 'id' in cols else None
            name_col = 'for_nomered' if 'for_nomered' in cols else 'nome_fantasia' if 'nome_fantasia' in cols else None
            
            if id_col:
                cur.execute(f"SELECT COUNT(*) as count FROM {full_name} WHERE {id_col} IN (8, 3)")
                count = cur.fetchone()['count']
                print(f"  -> Found {count} matching industries (IDs 8, 3)")
                
                if count > 0 and name_col:
                    cur.execute(f"SELECT {id_col}, {name_col} FROM {full_name} WHERE {id_col} IN (8, 3)")
                    print(f"  -> Samples: {cur.fetchall()}")
            else:
                print("  -> No ID column found")
                
        except Exception as e:
            print(f"  -> Error: {e}")

    conn.close()

if __name__ == "__main__":
    find_industries()
