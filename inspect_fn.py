
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
        
        # Test the function with a known industry (e.g., 20) and table
        # I'll just check the column names of the result
        cur.execute("SELECT * FROM fn_listar_produtos_tabela(20, 'TABELA PADRAO') LIMIT 1")
        cols = [desc[0] for desc in cur.description]
        print(f"🔍 Columns from fn_listar_produtos_tabela:")
        for c in cols:
            print(f"  - {c}")

        conn.close()
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    run()
