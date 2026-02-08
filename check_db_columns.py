
from sqlalchemy import create_engine, text

# Conexão com o banco do tenant (ndsrep)
engine = create_engine('postgresql://webadmin:ytAyO0u043@node254557-salesmaster.sp1.br.saveincloud.net.br:13062/basesales')

def check_columns():
    with engine.connect() as conn:
        conn.execute(text("SET search_path TO ndsrep, public"))
        
        tables = ['pedidos', 'itens_ped', 'clientes', 'fornecedores']
        
        print("\n--- VERIFICACAO DE COLUNAS (NDSREP) ---")
        
        for tbl in tables:
            print(f"\nTABLE: {tbl}")
            try:
                # Query information_schema specifically for ndsrep schema
                res = conn.execute(text(f"""
                    SELECT column_name, data_type 
                    FROM information_schema.columns 
                    WHERE table_schema = 'ndsrep' 
                      AND table_name = '{tbl}'
                    ORDER BY column_name
                """)).fetchall()
                
                if not res:
                    print("  (Tabela nao encontrada ou sem colunas no schema ndsrep)")
                    continue
                    
                cols = [f"{r[0]} ({r[1]})" for r in res]
                # Filter relevant ones for brevity
                relevant = [c for c in cols if any(k in c for k in ['cli_', 'for_', 'ped_', 'ite_', 'nom', 'cod', 'tot', 'liq', 'quant', 'val', 'red'])]
                
                for c in relevant:
                    print(f"  - {c}")
            except Exception as e:
                print(f"  Erro ao ler tabela: {e}")

if __name__ == "__main__":
    check_columns()
