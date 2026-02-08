
from sqlalchemy import create_engine, text

# Conexão com o banco do tenant (ndsrep)
engine = create_engine('postgresql://webadmin:ytAyO0u043@node254557-salesmaster.sp1.br.saveincloud.net.br:13062/basesales')

def analyze_orders():
    with engine.connect() as conn:
        print("\n--- ANALISE DE SITUACAO DOS PEDIDOS ---")
        
        # 1. Contagem por Situacao
        res = conn.execute(text("SELECT ped_situacao, COUNT(*) FROM pedidos GROUP BY ped_situacao")).fetchall()
        print("Contagem por Situacao:")
        for row in res:
            print(f"  {row[0]}: {row[1]}")
            
        # 2. Verificar pedidos recentes
        print("\n--- PEDIDOS RECENTES (2025) ---")
        res2 = conn.execute(text("SELECT COUNT(*) FROM pedidos WHERE ped_data >= '2025-01-01'")).fetchall()
        print(f"Total pedidos em 2025: {res2[0][0]}")

        # 3. Verificar se ha pedidos com situacao nula ou espacos
        res3 = conn.execute(text("SELECT COUNT(*) FROM pedidos WHERE ped_situacao IS NULL OR TRIM(ped_situacao) = ''")).fetchall()
        print(f"Pedidos com situacao invalida: {res3[0][0]}")
        
        # 4. Verificar Industrias presentes nos pedidos de 2025
        print("\n--- INDUSTRIAS MOVIMENTADAS EM 2025 ---")
        res4 = conn.execute(text("""
            SELECT DISTINCT f.for_nomered 
            FROM pedidos p 
            JOIN fornecedores f ON p.ped_industria = f.for_codigo 
            WHERE p.ped_data >= '2025-01-01'
            LIMIT 10
        """)).fetchall()
        for row in res4:
            print(f"  - {row[0]}")

if __name__ == "__main__":
    analyze_orders()
