import psycopg2
from psycopg2.extras import RealDictCursor

DB_CONFIG = {
    'host': 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    'port': 13062,
    'database': 'basesales',
    'user': 'webadmin',
    'password': 'ytAyO0u043'
}

def sync_february_2026():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()

        print("--- SINCRONIZANDO TOTAIS DE FEVEREIRO/2026 ---")
        
        # SQL para atualizar os cabeçalhos com base na soma real dos itens para Fevereiro/2026
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
            AND p.ped_data >= '2026-02-01' 
            AND p.ped_data <= '2026-02-28';
        """
        
        cur.execute(update_query)
        updated_count = cur.rowcount
        conn.commit()
        
        print(f"✅ Sincronização de Fevereiro finalizada! {updated_count} pedidos atualizados.")
        
        # Verificação do pedido específico MF004164
        cur.execute("""
            SELECT ped_pedido, ped_totliq 
            FROM ro_consult.pedidos 
            WHERE ped_pedido = 'MF004164'
        """)
        row = cur.fetchone()
        if row:
            print(f"📌 Status do Pedido MF004164: Agora o valor no cabeçalho é R$ {row[1]:,.2f}")

    except Exception as e:
        print(f"❌ Erro na sincronização de Fevereiro: {e}")
        if 'conn' in locals():
            conn.rollback()
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    sync_february_2026()
