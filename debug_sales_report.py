
from sqlalchemy import create_engine, text

# Conexão com o banco do tenant (ndsrep)
engine = create_engine('postgresql://webadmin:ytAyO0u043@node254557-salesmaster.sp1.br.saveincloud.net.br:13062/basesales')

def debug_sales_report():
    with engine.connect() as conn:
        print("\n--- DIAGNOSTICO MAPA DE VENDAS (NDSREP) ---")
        
        # 0. Setar Schema
        conn.execute(text("SET search_path TO ndsrep, public"))

        # 1. Verificar Pedidos em 2025 com Status P ou F
        query1 = text("""
            SELECT COUNT(*) 
            FROM pedidos p 
            WHERE p.ped_data >= '2025-01-01' 
              AND p.ped_situacao IN ('P', 'F')
        """)
        res1 = conn.execute(query1).scalar()
        print(f"1. Pedidos P/F em 2025: {res1}")

        if res1 == 0:
            print("   -> SEM PEDIDOS! Verifique se ha dados em 2025.")
            return

        # 2. Verificar se esses pedidos tem itens
        query2 = text("""
            SELECT COUNT(*) 
            FROM pedidos p 
            JOIN itens_ped ip ON p.ped_pedido = ip.ite_pedido
            WHERE p.ped_data >= '2025-01-01' 
              AND p.ped_situacao IN ('P', 'F')
        """)
        res2 = conn.execute(query2).scalar()
        print(f"2. Pedidos com Itens (JOIN itens_ped): {res2}")
        
        # 3. Verificar JOIN com Clientes
        query3 = text("""
            SELECT COUNT(*) 
            FROM pedidos p 
            JOIN clientes c ON p.ped_cliente = c.cli_codigo
            WHERE p.ped_data >= '2025-01-01' 
              AND p.ped_situacao IN ('P', 'F')
        """)
        res3 = conn.execute(query3).scalar()
        print(f"3. Pedidos com Cliente Valido (JOIN clientes): {res3}")

        # 4. Verificar JOIN com Fornecedores (Industria)
        query4 = text("""
            SELECT COUNT(*) 
            FROM pedidos p 
            JOIN fornecedores f ON p.ped_industria = f.for_codigo
            WHERE p.ped_data >= '2025-01-01' 
              AND p.ped_situacao IN ('P', 'F')
        """)
        res4 = conn.execute(query4).scalar()
        print(f"4. Pedidos com Industria Valida (JOIN fornecedores): {res4}")

        if res4 < res1:
            print("   -> ATENCAO: Muitos pedidos estao perdendo o JOIN com Fornecedores.")
            print("      Isso significa que o codigo em ped_industria nao existe na tabela fornecedores.")
            
            # Mostrar exemplos de industrias problematicas
            bad_inds = conn.execute(text("""
                SELECT DISTINCT p.ped_industria 
                FROM pedidos p 
                LEFT JOIN fornecedores f ON p.ped_industria = f.for_codigo
                WHERE p.ped_data >= '2025-01-01' 
                  AND p.ped_situacao IN ('P', 'F')
                  AND f.for_codigo IS NULL
                LIMIT 5
            """)).fetchall()
            if bad_inds:
                print("      Codigos de industria sem cadastro:", [r[0] for r in bad_inds])

if __name__ == "__main__":
    debug_sales_report()
