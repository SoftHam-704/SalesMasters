import psycopg2
from psycopg2.extras import RealDictCursor

DB_CONFIG = {
    'host': 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    'port': 13062,
    'database': 'basesales',
    'user': 'webadmin',
    'password': 'ytAyO0u043'
}

def normalize_and_link_products_safe():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()

        print("--- VINCULANDO PRODUTOS (MÉTODO SEGURO) ---")

        # 1. Garantir que a função de normalização existe
        cur.execute("""
            CREATE OR REPLACE FUNCTION fn_normalizar_codigo(codigo VARCHAR)
            RETURNS VARCHAR
            AS $$
            BEGIN
                IF codigo IS NULL OR TRIM(codigo) = '' THEN RETURN NULL; END IF;
                RETURN REGEXP_REPLACE(REGEXP_REPLACE(UPPER(codigo), '[^A-Z0-9]', '', 'g'), '^0+', '');
            END;
            $$ LANGUAGE plpgsql IMMUTABLE;
        """)

        # 2. Normalizar ite_codigonormalizado nos itens
        print("✨ Normalizando ite_codigonormalizado em ro_consult.itens_ped...")
        cur.execute("""
            UPDATE ro_consult.itens_ped
            SET ite_codigonormalizado = fn_normalizar_codigo(ite_produto)
            WHERE (ite_idproduto = 0 OR ite_idproduto IS NULL)
            AND ite_produto IS NOT NULL;
        """)
        norm_itens = cur.rowcount
        print(f"✅ {norm_itens} itens normalizados/verificados.")

        # 3. Vincular ite_idproduto com pro_id usando o código normalizado em tempo de execução para evitar erros de catálogo
        print("🔗 Vinculando ite_idproduto com pro_id (JOIN dinâmico)...")
        # I'll use a subquery to avoid duplicates in cad_prod if they exist
        link_query = """
            UPDATE ro_consult.itens_ped i
            SET ite_idproduto = sub.pro_id
            FROM (
                SELECT pro_id, pro_industria, COALESCE(pro_codigonormalizado, fn_normalizar_codigo(pro_codprod)) as code_norm
                FROM ro_consult.cad_prod
            ) sub
            WHERE i.ite_codigonormalizado = sub.code_norm
              AND i.ite_industria = sub.pro_industria
              AND (i.ite_idproduto = 0 OR i.ite_idproduto IS NULL);
        """
        cur.execute(link_query)
        linked_count = cur.rowcount
        print(f"✅ {linked_count} itens vinculados com sucesso.")

        # 4. Verificação final
        cur.execute("""
            SELECT COUNT(*) FROM ro_consult.itens_ped 
            WHERE (ite_idproduto = 0 OR ite_idproduto IS NULL)
        """)
        remaining = cur.fetchone()[0]
        print(f"⚠️ Itens que permaneceram sem vínculo: {remaining}")

        conn.commit()
        print("\n🎉 VÍNCULO CONCLUÍDO!")

    except Exception as e:
        print(f"❌ Erro: {e}")
        if 'conn' in locals(): conn.rollback()
    finally:
        if 'conn' in locals(): conn.close()

if __name__ == "__main__":
    normalize_and_link_products_safe()
