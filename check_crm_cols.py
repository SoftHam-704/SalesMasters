
from sqlalchemy import create_engine, text

engine = create_engine('postgresql://webadmin:ytAyO0u043@node254557-salesmaster.sp1.br.saveincloud.net.br:13062/basesales')

def check_crm_columns():
    with engine.connect() as conn:
        conn.execute(text("SET search_path TO ndsrep, public"))
        
        print("\n--- COLUNAS CRM_INTERACOES ---")
        try:
            res = conn.execute(text("""
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'crm_interacoes'
                ORDER BY column_name
            """)).fetchall()
            
            for r in res:
                print(f"  - {r[0]} ({r[1]})")
        except Exception as e:
            print(f"Erro: {e}")

if __name__ == "__main__":
    check_crm_columns()
