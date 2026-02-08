
import pandas as pd
import psycopg2
import sys

# Force UTF-8 output
sys.stdout.reconfigure(encoding='utf-8')

def run():
    try:
        # Load Excel to see columns
        df = pd.read_excel('data/itens_ped.xlsx')
        print(f"📄 Excel Columns (itens_ped.xlsx):")
        print(df.columns.tolist())
        
        # Connect to DB to check table/columns
        conn = psycopg2.connect(
            host="node254557-salesmaster.sp1.br.saveincloud.net.br",
            port=13062,
            database="basesales",
            user="webadmin",
            password="ytAyO0u043"
        )
        cur = conn.cursor()
        
        print(f"\n🔍 DB Columns (brasil_wl.itens_ped):")
        cur.execute("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'brasil_wl' 
            AND table_name = 'itens_ped'
        """)
        cols = cur.fetchall()
        if not cols:
            print("❌ Table 'brasil_wl.itens_ped' not found!")
        else:
            for c in cols:
                print(f"  - {c[0]} ({c[1]})")

        conn.close()
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    run()
