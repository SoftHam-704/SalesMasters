import psycopg2
from psycopg2.extras import RealDictCursor

DB_CONFIG = {
    'host': 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    'port': 13062,
    'database': 'basesales',
    'user': 'webadmin',
    'password': 'ytAyO0u043'
}

def fix_links_step_by_step():
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()

    # 1. Normalizar ITENS (Pequeno volume, 17k)
    print("Normalizando itens...")
    cur.execute("""
        UPDATE ro_consult.itens_ped 
        SET ite_codigonormalizado = REGEXP_REPLACE(REGEXP_REPLACE(UPPER(ite_produto), '[^A-Z0-9]', '', 'g'), '^0+', '')
        WHERE ite_codigonormalizado IS NULL AND ite_produto IS NOT NULL;
    """)
    print(f"Itens normalizados: {cur.rowcount}")
    conn.commit()

    # 2. Normalizar CATALOGO (Ignorando erros de duplicidade)
    print("Normalizando catálogo (sem forçar unificacao)...")
    cur.execute("""
        UPDATE ro_consult.cad_prod
        SET pro_codigonormalizado = REGEXP_REPLACE(REGEXP_REPLACE(UPPER(pro_codprod), '[^A-Z0-9]', '', 'g'), '^0+', '')
        WHERE pro_codigonormalizado IS NULL AND pro_codprod IS NOT NULL;
    """)
    # If this fails, I'll catch it and do it differently
    conn.commit()
    print(f"Produtos do catálogo normalizados: {cur.rowcount}")

    # 3. Vincular (JOIN)
    print("Vinculando...")
    cur.execute("""
        UPDATE ro_consult.itens_ped i
        SET ite_idproduto = c.pro_id
        FROM ro_consult.cad_prod c
        WHERE i.ite_idproduto = 0
          AND i.ite_codigonormalizado = c.pro_codigonormalizado
          AND i.ite_industria = c.pro_industria;
    """)
    print(f"Vínculos criados: {cur.rowcount}")
    conn.commit()

    conn.close()

if __name__ == "__main__":
    try:
        fix_links_step_by_step()
    except Exception as e:
        print(f"Erro: {e}")
