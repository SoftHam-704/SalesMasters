import psycopg2
from psycopg2.extras import RealDictCursor
import locale

# Set locale for currency formatting if possible, otherwise manual
try:
    locale.setlocale(locale.LC_ALL, 'pt_BR.UTF-8')
except:
    pass

DB_CONFIG = {
    'host': 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    'port': 13062,
    'database': 'basesales',
    'user': 'webadmin',
    'password': 'ytAyO0u043'
}

def run_query():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor(cursor_factory=RealDictCursor)

        # Main query for January 2026, using ro_consult only
        start_date = '2026-01-01'
        end_date = '2026-01-31'
        
        # Verify if we should use 'id' or 'for_codigo' or similar in fin_fornecedores
        # Based on previous check: ro_consult.fin_fornecedores columns: ['id', 'nome_fantasia', ...]




        # Initialize mapping
        mapping = {}

        # Check for ro_consult.industrias
        print("\n--- Check ro_consult.industrias ---")
        try:
            cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'ro_consult' AND table_name = 'industrias'")
            if cur.fetchone():
                cur.execute("SELECT id, nome FROM ro_consult.industrias")
                ind_rows = cur.fetchall()
                for r in ind_rows:
                    mapping[r['id']] = r['nome']
                print(f"Loaded {len(ind_rows)} industries from ro_consult.industrias")
            else:
                print("Table ro_consult.industrias not found.")
        except Exception as e:
            print(f"Error checking industrias: {e}")

        
        query = f"""
        SELECT
            p.ped_industria,
            SUM(p.ped_totliq) as total_liquido
        FROM
            ro_consult.pedidos p
        WHERE
            p.ped_situacao IN ('P', 'F')
            AND p.ped_data >= '{start_date}'
            AND p.ped_data <= '{end_date}'
        GROUP BY
            p.ped_industria
        ORDER BY
            total_liquido DESC;
        """
        
        print(f"\n--- Executing Query for {start_date[:7]} (Schema: ro_consult) ---")
        cur.execute(query)
        rows = cur.fetchall()
        
        total_geral = 0
        print(f"{'INDUSTRIA':<40} | {'TOTAL LIQUIDO':>20}")
        print("-" * 65)
        for row in rows:
            ind_id = row['ped_industria']
            nome = mapping.get(ind_id, f'INDUSTRIA {ind_id}')
            val = float(row['total_liquido'])
            total_geral += val
            print(f"{nome:<40} | {val:,.2f}")
            
        print("-" * 65)
        print(f"{'TOTAL GERAL':<40} | {total_geral:,.2f}")
        
        # Also print the raw SQL used, just in case user wants it
        print("\n\n--- SQL Query Used ---")
        print(query)

    except Exception as e:
        print(f"Error: {e}")
    finally:
        if 'conn' in locals(): conn.close()

if __name__ == '__main__':
    run_query()
