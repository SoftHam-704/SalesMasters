import psycopg2
from psycopg2.extras import RealDictCursor

DB_CONFIG = {
    'host': 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    'port': 13062,
    'database': 'basesales',
    'user': 'webadmin',
    'password': 'ytAyO0u043'
}

def finalize_indices():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()

        print("--- VERIFICANDO E OTIMIZANDO ÍNDICES ---")
        
        # 1. Verificar se existe o índice de normalização no cad_prod
        cur.execute("SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'ro_consult' AND tablename = 'cad_prod' AND indexname = 'idx_cad_prod_norm'")
        if cur.fetchone()[0] == 0:
            print("🏗️ Criando índice idx_cad_prod_norm em ro_consult.cad_prod...")
            cur.execute("CREATE INDEX idx_cad_prod_norm ON ro_consult.cad_prod (pro_industria, pro_codigonormalizado)")
            conn.commit()
            print("✅ Índice criado no catálogo.")

        # 2. Verificar se existe o índice no itens_ped (ITE_PEDIDO)
        cur.execute("SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'ro_consult' AND tablename = 'itens_ped' AND indexname = 'idx_itens_ped_pedido'")
        if cur.fetchone()[0] == 0:
            print("🏗️ Criando índice idx_itens_ped_pedido em ro_consult.itens_ped...")
            cur.execute("CREATE INDEX idx_itens_ped_pedido ON ro_consult.itens_ped (ite_pedido)")
            conn.commit()
            print("✅ Índice criado nos itens (Link Pedido).")

        # 3. Verificar índice de busca por código normalizado nos itens
        cur.execute("SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'ro_consult' AND tablename = 'itens_ped' AND indexname = 'idx_itens_ped_norm'")
        if cur.fetchone()[0] == 0:
            print("🏗️ Criando índice idx_itens_ped_norm em ro_consult.itens_ped...")
            cur.execute("CREATE INDEX idx_itens_ped_norm ON ro_consult.itens_ped (ite_industria, ite_codigonormalizado)")
            conn.commit()
            print("✅ Índice criado nos itens (Busca Normalizada).")

        # 4. Verificar se existe índice de data nos pedidos (essencial para velocidade)
        cur.execute("SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'ro_consult' AND tablename = 'pedidos' AND indexname = 'idx_pedidos_data'")
        if cur.fetchone()[0] == 0:
            print("🏗️ Criando índice idx_pedidos_data em ro_consult.pedidos...")
            cur.execute("CREATE INDEX idx_pedidos_data ON ro_consult.pedidos (ped_data)")
            conn.commit()
            print("✅ Índice criado na data dos pedidos.")

        print("\n--- STATUS FINAL DOS ÍNDICES ---")
        cur.execute("""
            SELECT tablename, indexname 
            FROM pg_indexes 
            WHERE schemaname = 'ro_consult' 
            AND tablename IN ('pedidos', 'itens_ped', 'cad_prod')
            AND indexname LIKE 'idx_%%'
        """)
        for row in cur.fetchall():
            print(f"[{row[0]}] {row[1]}")

        conn.close()
    except Exception as e:
        print(f"Erro: {e}")

if __name__ == "__main__":
    finalize_indices()
