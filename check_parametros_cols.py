
from sqlalchemy import create_engine, text

engine = create_engine('postgresql://webadmin:ytAyO0u043@node254557-salesmaster.sp1.br.saveincloud.net.br:13062/basesales')

def check_parametros():
    with engine.connect() as conn:
        print("\n--- COLUNAS DA TABELA PARAMETROS (NDSREP) ---")
        try:
            res = conn.execute(text("""
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'parametros' 
                  AND table_schema = 'ndsrep'
                ORDER BY column_name
            """)).fetchall()
            
            if not res:
                # Try public
                res = conn.execute(text("""
                    SELECT column_name, data_type 
                    FROM information_schema.columns 
                    WHERE table_name = 'parametros' 
                      AND table_schema = 'public'
                    ORDER BY column_name
                """)).fetchall()
                print("Schema: public")
            else:
                print("Schema: ndsrep")

            for r in res:
                print(f"- {r[0]} ({r[1]})")
        except Exception as e:
            print(f"Erro: {e}")

if __name__ == "__main__":
    check_parametros()
