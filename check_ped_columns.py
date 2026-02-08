
import psycopg2
import sys

# Force UTF-8 output
sys.stdout.reconfigure(encoding='utf-8')

def run():
    try:
        conn = psycopg2.connect(
            host="node254557-salesmaster.sp1.br.saveincloud.net.br",
            port=13062,
            database="basesales",
            user="webadmin",
            password="ytAyO0u043"
        )
        cur = conn.cursor()
        
        # Check columns in public.pedidos
        print("--- Columns in public.pedidos ---")
        cur.execute("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'pedidos'
            ORDER BY column_name
        """)
        cols = cur.fetchall()
        for col in cols:
            print(f"{col[0]} ({col[1]})")
            
        print("\n--- Columns in brasil_wl.pedidos ---")
        cur.execute("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'brasil_wl' AND table_name = 'pedidos'
            ORDER BY column_name
        """)
        cols = cur.fetchall()
        for col in cols:
            print(f"{col[0]} ({col[1]})")

        conn.close()
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    run()
