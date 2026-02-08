
import psycopg2
import sys

# Force output to utf-8
sys.stdout.reconfigure(encoding='utf-8')

def run():
    try:
        conn = psycopg2.connect(
            host='node254557-salesmaster.sp1.br.saveincloud.net.br',
            port=13062,
            database='basesales',
            user='webadmin',
            password='ytAyO0u043'
        )
        cur = conn.cursor()
        
        cur.execute("SELECT for_codigo, for_nomered, for_nome FROM fornecedores ORDER BY for_nomered LIMIT 100")
        rows = cur.fetchall()
        print(f"🏢 Listing all industries ({len(rows)}):")
        for r in rows:
            print(f"  - ID={r[0]} | NomRed={r[1]} | Nome={r[2]}")

        conn.close()
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    run()
