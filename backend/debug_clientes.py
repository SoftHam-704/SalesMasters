import psycopg2
from psycopg2.extras import RealDictCursor

conn_params = {
    "host": "node254557-salesmaster.sp1.br.saveincloud.net.br",
    "port": 13062,
    "database": "basesales",
    "user": "webadmin",
    "password": "ytAyO0u043"
}

def analyze_clientes(schema):
    try:
        conn = psycopg2.connect(**conn_params)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        print(f"\n--- Analyzing {schema}.clientes ---")
        
        # Check column names
        cur.execute(f"SELECT column_name FROM information_schema.columns WHERE table_schema = '{schema}' AND table_name = 'clientes'")
        cols = [r['column_name'] for r in cur.fetchall()]
        print(f"Columns: {cols}")
        
        # Check counts of cli_tipopes
        if 'cli_tipopes' in cols:
            cur.execute(f"SELECT cli_tipopes, count(*) as total FROM {schema}.clientes GROUP BY cli_tipopes")
            print(f"cli_tipopes counts: {cur.fetchall()}")
            
        # Check counts of cli_ativo
        if 'cli_ativo' in cols:
            cur.execute(f"SELECT cli_ativo, count(*) as total FROM {schema}.clientes GROUP BY cli_ativo")
            print(f"cli_ativo counts: {cur.fetchall()}")

        # Check counts of cli_status
        if 'cli_status' in cols:
            cur.execute(f"SELECT cli_status, count(*) as total FROM {schema}.clientes GROUP BY cli_status")
            print(f"cli_status counts: {cur.fetchall()}")

        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error in {schema}: {e}")

if __name__ == "__main__":
    analyze_clientes('ro_consult')
    analyze_clientes('barrosrep')
