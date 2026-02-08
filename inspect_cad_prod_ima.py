
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
        
        # 1. Find IMA ID
        print("Finding IMA id in fornecedores...")
        cur.execute(f"SELECT for_codigo, for_rasocial FROM {schema}.fornecedores WHERE for_rasocial ILIKE '%IMA%' OR for_fantasia ILIKE '%IMA%'")
        fornecedores = cur.fetchall()
        for f in fornecedores:
            print(f"Found: ID={f[0]}, Name={f[1]}")
            
        if not fornecedores:
            print("IMA not found!")
            return

        ima_id = fornecedores[0][0]
        
        # 2. Check duplicates in cad_prod for this ID
        print(f"Checking for duplicates in {schema}.cad_prod for industry {ima_id}...")
        cur.execute(f"""
            SELECT pro_codprod, count(*) 
            FROM {schema}.cad_prod 
            WHERE pro_industria = {ima_id}
            GROUP BY pro_codprod 
            HAVING count(*) > 1 
            LIMIT 5
        """)
        dups = cur.fetchall()
        if dups:
            print(f"Found duplicates for industry {ima_id}! Example:")
            for d in dups:
                print(f"  Product {d[0]} has {d[1]} entries.")
                
                # Let's inspect one duplicate
                print(f"  Inspecting entries for product {d[0]}:")
                cur.execute(f"SELECT * FROM {schema}.cad_prod WHERE pro_codprod = '{d[0]}' AND pro_industria = {ima_id}")
                cols = [desc[0] for desc in cur.description]
                rows = cur.fetchall()
                for r in rows:
                    print(dict(zip(cols, r)))
        else:
            print(f"No duplicates found for industry {ima_id} in cad_prod.")

        conn.close()
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    run()
