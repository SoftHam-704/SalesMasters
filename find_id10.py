import psycopg2
from psycopg2.extras import RealDictCursor

DB_CONFIG = {
    'host': 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    'port': 13062,
    'database': 'basesales',
    'user': 'webadmin',
    'password': 'ytAyO0u043'
}

def find_id_10():
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    # Check all schemas for ID 10 in fornecedores
    cur.execute("SELECT table_schema, table_name FROM information_schema.tables WHERE table_name LIKE '%fornecedores%'")
    tables = cur.fetchall()
    
    print("--- Searching for ID 10 ---")
    for t in tables:
        schema = t['table_schema']
        table = t['table_name']
        full_name = f"{schema}.{table}"
        
        try:
            cur.execute(f"SELECT column_name FROM information_schema.columns WHERE table_schema = '{schema}' AND table_name = '{table}'")
            cols = [c['column_name'] for c in cur.fetchall()]
            
            id_col = 'for_codigo' if 'for_codigo' in cols else 'id' if 'id' in cols else None
            name_col = 'for_nomered' if 'for_nomered' in cols else 'nome_fantasia' if 'nome_fantasia' in cols else None
            
            if id_col and name_col:
                cur.execute(f"SELECT {name_col} FROM {full_name} WHERE {id_col} = 10")
                row = cur.fetchone()
                if row:
                    print(f"FOUND 10 in {full_name}: {row}")
        except: pass
    conn.close()

if __name__ == "__main__":
    find_id_10()
