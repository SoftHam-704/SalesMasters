
import psycopg2

def check_structure():
    try:
        conn = psycopg2.connect(
            host='node254557-salesmaster.sp1.br.saveincloud.net.br',
            port=13062,
            database='basesales',
            user='webadmin',
            password='ytAyO0u043'
        )
        cur = conn.cursor()
        
        print("\n--- Estrutura de ro_consult.cad_prod ---")
        cur.execute("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'ro_consult' 
            AND table_name = 'cad_prod'
            ORDER BY column_name
        """)
        cols = cur.fetchall()
        for col in cols:
            print(f"  {col[0]} ({col[1]})")
            
        print("\n--- Estrutura de ro_consult.itens_ped (campos relevantes) ---")
        cur.execute("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'ro_consult' 
            AND table_name = 'itens_ped'
            AND (column_name LIKE '%ite_idproduto%' OR column_name LIKE '%ite_codigonormalizado%' OR column_name LIKE '%ite_produto%')
            ORDER BY column_name
        """)
        cols = cur.fetchall()
        for col in cols:
            print(f"  {col[0]} ({col[1]})")
            
        conn.close()
    except Exception as e:
        print(f"Erro: {e}")

if __name__ == '__main__':
    check_structure()
