
import psycopg2

def check_sellout_struct():
    try:
        conn = psycopg2.connect(
            host='node254557-salesmaster.sp1.br.saveincloud.net.br',
            port=13062,
            database='basesales',
            user='webadmin',
            password='ytAyO0u043'
        )
        cur = conn.cursor()
        
        print("\n--- Estrutura de ro_consult.crm_sellout ---")
        cur.execute("""
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_schema = 'ro_consult' 
            AND table_name = 'crm_sellout'
            ORDER BY ordinal_position
        """)
        cols = cur.fetchall()
        if not cols:
            print("❌ Tabela ro_consult.crm_sellout não encontrada!")
        else:
            for col in cols:
                print(f"  {col[0]} ({col[1]}) - Nullable: {col[2]}")
            
        conn.close()
    except Exception as e:
        print(f"Erro: {e}")

if __name__ == '__main__':
    check_sellout_struct()
