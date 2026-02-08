import psycopg2
from psycopg2.extras import RealDictCursor

DB_CONFIG = {
    'host': 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    'port': 13062,
    'database': 'basesales',
    'user': 'webadmin',
    'password': 'ytAyO0u043'
}

def check_targeted_indices():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor(cursor_factory=RealDictCursor)

        print("--- ÍNDICES CRÍTICOS PARA PERFORMANCE DO DASHBOARD E JOINS ---")
        
        target_tables = ('pedidos', 'itens_ped', 'cad_prod')
        
        query = """
            SELECT
                t.relname AS table_name,
                i.relname AS index_name,
                string_agg(a.attname, ', ') AS columns,
                ix.indisunique AS is_unique
            FROM
                pg_class t
                JOIN pg_index ix ON t.oid = ix.indrelid
                JOIN pg_class i ON i.oid = ix.indexrelid
                JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
                JOIN pg_namespace n ON n.oid = t.relnamespace
            WHERE
                n.nspname = 'ro_consult'
                AND t.relname IN %s
            GROUP BY
                t.relname, i.relname, ix.indisunique
            ORDER BY
                t.relname, i.relname;
        """
        
        cur.execute(query, (target_tables,))
        indices = cur.fetchall()
        
        for idx in indices:
            unique = "[UNIQUE] " if idx['is_unique'] else ""
            print(f"[{idx['table_name']}] {idx['index_name']} -> ({idx['columns']}) {unique}")

        # Check for missing but recommended indices
        print("\n--- RECOMENDAÇÕES ---")
        existing_indices = [idx['index_name'] for idx in indices]
        
        if not any('ped_data' in str(idx['columns']) for idx in indices if idx['table_name'] == 'pedidos'):
            print("⚠️ RECOMENDADO: Índice em pedidos(ped_data) para acelerar o Dashboard.")
        else:
            print("✅ OK: pedidos(ped_data) indexado.")

        if not any('ite_codigonormalizado' in str(idx['columns']) for idx in indices if idx['table_name'] == 'itens_ped'):
            print("⚠️ RECOMENDADO: Índice em itens_ped(ite_codigonormalizado) para busca de produtos.")
        else:
            print("✅ OK: itens_ped(ite_codigonormalizado) indexado.")

        conn.close()
    except Exception as e:
        print(f"Erro: {e}")

if __name__ == "__main__":
    check_targeted_indices()
