
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
        
        cur.execute("SELECT for_codigo, for_nomered, for_nome FROM fornecedores WHERE for_nomered ILIKE '%MDS%' OR for_nome ILIKE '%MDS%'")
        rows = cur.fetchall()
        for r in rows:
            print(f"🏢 MDS found: ID={r[0]} | Name={r[1]} | Full={r[2]}")

        conn.close()
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    run()
