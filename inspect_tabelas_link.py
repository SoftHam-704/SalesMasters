
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
        schema = 'ro_consult'
        
        ids = [195950, 198468, 200986, 203504]
        ids_str = ",".join(map(str, ids))
        
        print(f"Checking cad_tabelaspre for products {ids_str}...")
        cur.execute(f"""
            SELECT itab_idprod, itab_tabela, itab_idindustria
            FROM {schema}.cad_tabelaspre 
            WHERE itab_idprod IN ({ids_str})
        """)
        
        rows = cur.fetchall()
        for r in rows:
            print(f"ProdID: {r[0]} | Table: {r[1]} | Ind: {r[2]}")
            
        conn.close()
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    run()
