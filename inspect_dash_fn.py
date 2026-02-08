import psycopg2
from psycopg2.extras import RealDictCursor

DB_CONFIG = {
    'host': 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    'port': 13062,
    'database': 'basesales',
    'user': 'webadmin',
    'password': 'ytAyO0u043'
}

def inspect_dashboard_function():
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    print("--- INSPECTING get_dashboard_metrics RETURN COLUMNS ---")
    try:
        # Call with dummy params to see column names
        cur.execute("SELECT * FROM public.get_dashboard_metrics(2025, 1, 0) LIMIT 0")
        colnames = [desc[0] for desc in cur.description]
        print(f"Columns returned: {colnames}")
    except Exception as e:
        print(f"Error: {e}")
        
    conn.close()

if __name__ == "__main__":
    inspect_dashboard_function()
