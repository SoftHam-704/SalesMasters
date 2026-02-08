import psycopg2
from psycopg2.extras import RealDictCursor

DB_CONFIG = {
    'host': 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    'port': 13062,
    'database': 'basesales',
    'user': 'webadmin',
    'password': 'ytAyO0u043'
}

def safe_cleanup():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor(cursor_factory=RealDictCursor)

        print("--- VERIFICAÇÃO ANTES DA LIMPEZA ---")
        
        # Count Jan 2026
        cur.execute("""
            SELECT COUNT(*) as qtd 
            FROM ro_consult.pedidos 
            WHERE ped_data >= '2026-01-01' AND ped_data <= '2026-01-31'
        """)
        jan_orders = cur.fetchone()['qtd']
        
        cur.execute("""
            SELECT COUNT(*) as qtd 
            FROM ro_consult.itens_ped i
            JOIN ro_consult.pedidos p ON i.ite_pedido = p.ped_pedido
            WHERE p.ped_data >= '2026-01-01' AND p.ped_data <= '2026-01-31'
        """)
        jan_items = cur.fetchone()['qtd']

        # Count Feb 2026 (Safety Check)
        cur.execute("""
            SELECT COUNT(*) as qtd 
            FROM ro_consult.pedidos 
            WHERE ped_data >= '2026-02-01'
        """)
        feb_orders = cur.fetchone()['qtd']
        
        print(f"JANEIRO 2026: {jan_orders} pedidos e {jan_items} itens para LIMPAR.")
        print(f"FEVEREIRO 2026: {feb_orders} pedidos encontrados (ZONA PROTEGIDA - NÃO SERÃO EXCLUÍDOS).")

        if jan_orders == 0:
            print("Nenhum dado de Janeiro encontrado para limpar.")
            return

        # --- EXECUÇÃO DO CLEANUP ---
        
        # 1. Deletar Itens (Filhos) de Janeiro
        print("\n--- PASSO 1: Excluindo itens_ped de Janeiro... ---")
        cur.execute("""
            DELETE FROM ro_consult.itens_ped 
            WHERE ite_pedido IN (
                SELECT ped_pedido 
                FROM ro_consult.pedidos 
                WHERE ped_data >= '2026-01-01' AND ped_data <= '2026-01-31'
            )
        """)
        deleted_items = cur.rowcount
        print(f"✅ {deleted_items} itens excluídos com sucesso.")

        # 2. Deletar Pedidos (Pais) de Janeiro
        print("\n--- PASSO 2: Excluindo pedidos de Janeiro... ---")
        cur.execute("""
            DELETE FROM ro_consult.pedidos 
            WHERE ped_data >= '2026-01-01' AND ped_data <= '2026-01-31'
        """)
        deleted_orders = cur.rowcount
        print(f"✅ {deleted_orders} pedidos excluídos com sucesso.")

        conn.commit()
        print("\n🎉 LIMPEZA DE JANEIRO 2026 CONCLUÍDA COM SUCESSO!")

    except Exception as e:
        print(f"❌ ERRO DURANTE LIMPEZA: {e}")
        if 'conn' in locals():
            conn.rollback()
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    safe_cleanup()
