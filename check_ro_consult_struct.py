
import psycopg2
import sys

def check():
    try:
        conn = psycopg2.connect(
            host='node254557-salesmaster.sp1.br.saveincloud.net.br',
            port=13062,
            database='basesales',
            user='webadmin',
            password='ytAyO0u043'
        )
        cur = conn.cursor()
        
        for table in ['pedidos', 'itens_ped']:
            print(f"\n--- Estrutura de ro_consult.{table} ---")
            cur.execute(f"""
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_schema = 'ro_consult' 
                AND table_name = '{table}'
                ORDER BY ordinal_position
            """)
            cols = cur.fetchall()
            for col in cols:
                print(f"  {col[0]} ({col[1]})")
        
        conn.close()
    except Exception as e:
        print(f"Erro: {e}")

if __name__ == '__main__':
    check()
