
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
        
        # Check column names in cad_prod in a likely schema (e.g., ro_consult or public)
        # We'll check 'ro_consult' as it was used in the user's script
        schema = 'ro_consult' 
        print(f"Checking columns in {schema}.cad_prod:")
        
        cur.execute(f"""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_schema = '{schema}' 
            AND table_name = 'cad_prod'
        """)
        rows = cur.fetchall()
        for r in rows:
            print(f" - {r[0]}")
            
        print("-" * 20)
        
        # Also check if duplicates exist for a single product in cad_prod
        # Just count for one product info
        print("Checking for potential duplicates in cad_prod:")
        cur.execute(f"""
            SELECT pro_codprod, count(*) 
            FROM {schema}.cad_prod 
            WHERE pro_industria = 'IMA' 
            GROUP BY pro_codprod 
            HAVING count(*) > 1 
            LIMIT 5
        """)
        dups = cur.fetchall()
        if dups:
            print(f"Found duplicates for pro_industria='IMA' in {schema}.cad_prod! Example:")
            for d in dups:
                print(f"  Product {d[0]} has {d[1]} entries.")
        else:
            print("No duplicates found for pro_industria='IMA' in cad_prod based on pro_codprod aggregation.")

        conn.close()
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    run()
