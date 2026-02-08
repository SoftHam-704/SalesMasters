
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
        
        cur.execute("SET search_path TO markpress")
        
        # 1. List all distinct industries that HAVE products in this schema
        print("🏢 Industries with products in 'markpress':")
        cur.execute("SELECT DISTINCT pro_industria FROM cad_prod ORDER BY pro_industria")
        industries = [r[0] for r in cur.fetchall()]
        for ind in industries:
            cur.execute("SELECT for_nomered FROM fornecedores WHERE for_codigo = %s", [ind])
            name = cur.fetchone()
            name = name[0] if name else "Unknown"
            cur.execute("SELECT COUNT(*) FROM cad_prod WHERE pro_industria = %s", [ind])
            count = cur.fetchone()[0]
            print(f"  - ID: {ind} | Name: {name} | Products: {count}")

        conn.close()
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    run()
