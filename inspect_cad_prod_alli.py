
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
        
        ima_id = 8 # ALLI
        
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
                # Show columns of the duplicates to see differences
                cur.execute(f"SELECT * FROM {schema}.cad_prod WHERE pro_industria = {ima_id} AND pro_codprod = '{d[0]}'")
                cols = [desc[0] for desc in cur.description]
                rows = cur.fetchall()
                for r in rows:
                    print(r)
        else:
            print(f"No duplicates found for industry {ima_id} in cad_prod.")

        conn.close()
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    run()
