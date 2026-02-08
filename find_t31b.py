
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
        
        # Search specifically for T31B in markpress
        cur.execute("SET search_path TO markpress")
        print("🔍 Searching for 'T31B' in 'markpress' schema...")
        cur.execute("""
            SELECT pro_id, pro_codprod, pro_nome, pro_conversao, pro_codigooriginal, pro_industria
            FROM cad_prod 
            WHERE pro_codprod = 'T31B' OR pro_conversao = 'HF08B'
        """)
        rows = cur.fetchall()
        for r in rows:
            print(f"  - ID: {r[0]} | Cod: {r[1]} | Nome: {r[2]} | Conv: {r[3]} | Orig: {r[4]} | Ind: {r[5]}")

        # Let's also check the view
        print("\n🔍 Checking view 'vw_produtos_precos' for 'HF08B'...")
        try:
            cur.execute("""
                SELECT pro_codprod, itab_tabela, pro_conversao, pro_industria
                FROM vw_produtos_precos
                WHERE pro_codprod = 'T31B' OR pro_conversao = 'HF08B'
            """)
            for r in cur.fetchall():
                print(f"  - View: Cod={r[0]} | Tab={r[1]} | Conv={r[2]} | Ind={r[3]}")
        except Exception as e:
            print(f"  ❌ View error: {e}")

        conn.close()
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    run()
