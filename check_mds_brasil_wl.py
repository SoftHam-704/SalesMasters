
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
        
        # Set search path to brasil_wl
        cur.execute("SET search_path TO brasil_wl")
        
        cur.execute("SELECT for_codigo, for_nomered, for_nome FROM fornecedores WHERE for_nomered ILIKE '%MDS%' OR for_nome ILIKE '%MDS%'")
        rows = cur.fetchall()
        print(f"🏢 MDS in brasil_wl schema:")
        for r in rows:
            print(f"  - ID={r[0]} | NomRed={r[1]} | Nome={r[2]}")

        # If not found, list all in brasil_wl
        if not rows:
            print("Listing all industries in brasil_wl:")
            cur.execute("SELECT for_codigo, for_nomered FROM fornecedores LIMIT 20")
            for r in cur.fetchall():
                print(f"  - ID={r[0]} | NomRed={r[1]}")

        conn.close()
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    run()
