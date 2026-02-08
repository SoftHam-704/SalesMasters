import psycopg2
from psycopg2.extras import RealDictCursor

DB_CONFIG = {
    'host': 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    'port': 13062,
    'database': 'basesales',
    'user': 'webadmin',
    'password': 'ytAyO0u043'
}

def normalize_and_link_products():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()

        print("--- NORMALIZANDO CÓDIGOS E VINCULANDO PRODUTOS (ro_consult) ---")

        # 1. Garantir que a função de normalização existe
        print("🛠️ Criando/Atualizando função fn_normalizar_codigo...")
        cur.execute("""
            CREATE OR REPLACE FUNCTION fn_normalizar_codigo(codigo VARCHAR)
            RETURNS VARCHAR
            LANGUAGE plpgsql
            IMMUTABLE
            AS $$
            DECLARE
                resultado VARCHAR;
            BEGIN
                IF codigo IS NULL OR TRIM(codigo) = '' THEN
                    RETURN NULL;
                END IF;
                resultado := UPPER(REGEXP_REPLACE(codigo, '[^A-Z0-9]', '', 'g'));
                resultado := REGEXP_REPLACE(resultado, '^0+', '');
                IF resultado = '' THEN
                    resultado := '0';
                END IF;
                RETURN resultado;
            END;
            $$;
        """)

        # 2. Normalizar ite_codigonormalizado nos itens que estão com id zerado
        print("✨ Normalizando ite_codigonormalizado em ro_consult.itens_ped...")
        cur.execute("""
            UPDATE ro_consult.itens_ped
            SET ite_codigonormalizado = fn_normalizar_codigo(ite_produto)
            WHERE (ite_idproduto = 0 OR ite_idproduto IS NULL)
            AND ite_produto IS NOT NULL;
        """)
        norm_itens = cur.rowcount
        print(f"✅ {norm_itens} itens normalizados.")

        # 3. Garantir que os produtos do cad_prod também estejam normalizados
        print("✨ Garantir normalização em ro_consult.cad_prod...")
        cur.execute("""
            UPDATE ro_consult.cad_prod
            SET pro_codigonormalizado = fn_normalizar_codigo(pro_codprod)
            WHERE pro_codprod IS NOT NULL 
            AND (pro_codigonormalizado IS NULL OR pro_codigonormalizado != fn_normalizar_codigo(pro_codprod));
        """)
        norm_prods = cur.rowcount
        print(f"✅ {norm_prods} produtos normalizados no catálogo.")

        # 4. Vincular ite_idproduto com pro_id usando o código normalizado + indústria
        print("🔗 Vinculando ite_idproduto com pro_id...")
        cur.execute("""
            UPDATE ro_consult.itens_ped i
            SET ite_idproduto = c.pro_id
            FROM ro_consult.cad_prod c
            WHERE i.ite_codigonormalizado = c.pro_id_norm_alias.pro_codigonormalizado -- use alias to avoid confusion
              AND i.ite_industria = c.pro_industria
              AND (i.ite_idproduto = 0 OR i.ite_idproduto IS NULL)
        """.replace("c.pro_id_norm_alias.pro_codigonormalizado", "c.pro_codigonormalizado")) # Fixing my brain fart
        
        # Actually better written as:
        cur.execute("""
            UPDATE ro_consult.itens_ped i
            SET ite_idproduto = c.pro_id
            FROM ro_consult.cad_prod c
            WHERE i.ite_codigonormalizado = c.pro_codigonormalizado
              AND i.ite_industria = c.pro_industria
              AND (i.ite_idproduto = 0 OR i.ite_idproduto IS NULL);
        """)
        linked_count = cur.rowcount
        print(f"✅ {linked_count} itens vinculados com sucesso ao cad_prod.")

        # 5. Verificação de itens que ainda ficaram zerados (não encontrados no catálogo)
        cur.execute("""
            SELECT COUNT(*) FROM ro_consult.itens_ped 
            WHERE (ite_idproduto = 0 OR ite_idproduto IS NULL)
        """)
        remaining = cur.fetchone()[0]
        print(f"⚠️ Itens que permaneceram sem vínculo (não encontrados no cadastro): {remaining}")

        conn.commit()
        print("\n🎉 PROCESSO CONCLUÍDO!")

    except Exception as e:
        print(f"❌ Erro no processo: {e}")
        if 'conn' in locals():
            conn.rollback()
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    normalize_and_link_products()
