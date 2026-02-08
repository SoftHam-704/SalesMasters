import psycopg2
from psycopg2.extras import RealDictCursor

DB_CONFIG = {
    'host': 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    'port': 13062,
    'database': 'basesales',
    'user': 'webadmin',
    'password': 'ytAyO0u043'
}

def sync_parents_with_children():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()

        print("--- SINCRONIZANDO TOTAIS: PAIS (Pedidos) VS FILHOS (Itens) ---")
        
        # SQL para atualizar os cabeçalhos com base na soma real dos itens
        # Aplicado apenas para Janeiro/2026 no schema ro_consult
        update_query = """
            UPDATE ro_consult.pedidos p
            SET 
                ped_totliq = COALESCE(sub.total_liq, 0),
                ped_totbruto = COALESCE(sub.total_bruto, 0)
            FROM (
                SELECT 
                    ite_pedido, 
                    SUM(ite_totliquido) as total_liq, 
                    SUM(ite_totbruto) as total_bruto
                FROM ro_consult.itens_ped
                GROUP BY ite_pedido
            ) sub
            WHERE p.ped_pedido = sub.ite_pedido
            AND p.ped_data >= '2026-01-01' 
            AND p.ped_data <= '2026-01-31';
        """
        
        cur.execute(update_query)
        updated_count = cur.rowcount
        conn.commit()
        
        print(f"✅ Sincronização finalizada! {updated_count} pedidos atualizados com os valores reais dos itens.")
        
        # Verificação final do total líquido dos pedidos (cabeçalho)
        cur.execute("""
            SELECT SUM(ped_totliq) as total_final
            FROM ro_consult.pedidos
            WHERE ped_data >= '2026-01-01' AND ped_data <= '2026-01-31'
            AND ped_situacao IN ('P', 'F')
        """)
        total_final = cur.fetchone()[0]
        print(f"📊 Valor Total no Cabeçalho (Jan/2026): R$ {total_final:,.2f}")

    except Exception as e:
        print(f"❌ Erro na sincronização: {e}")
        if 'conn' in locals():
            conn.rollback()
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    sync_parents_with_children()
