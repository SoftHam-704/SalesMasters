
import psycopg2
import sys

# Force output to utf-8
sys.stdout.reconfigure(encoding='utf-8')

def run():
    try:
        print("🚀 Connecting to Cloud Master DB...")
        conn = psycopg2.connect(
            host='node254557-salesmaster.sp1.br.saveincloud.net.br',
            port=13062,
            database='salesmasters_master',
            user='webadmin',
            password='ytAyO0u043'
        )
        cur = conn.cursor()
        
        print("✅ Connected! Inspecting 'empresas' table columns...")
        cur.execute("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'empresas'
        """)
        cols = cur.fetchall()
        for c in cols:
            print(f"  - {c[0]} ({c[1]})")

        conn.close()
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    run()
