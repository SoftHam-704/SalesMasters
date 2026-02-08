import psycopg2
from psycopg2.extras import RealDictCursor

DB_CONFIG = {
    'host': 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    'port': 13062,
    'database': 'basesales',
    'user': 'webadmin',
    'password': 'ytAyO0u043'
}

def check_indices():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor(cursor_factory=RealDictCursor)

        print("--- VERIFICAÇÃO DE ÍNDICES - SCHEMA ro_consult ---")
        
        query = """
            SELECT
                t.relname AS table_name,
                i.relname AS index_name,
                a.attname AS column_name,
                ix.indisunique AS is_unique,
                pg_size_pretty(pg_relation_size(quote_ident(n.nspname) || '.' || quote_ident(i.relname))) AS index_size
            FROM
                pg_class t,
                pg_class i,
                pg_index ix,
                pg_attribute a,
                pg_namespace n
            WHERE
                t.oid = ix.indrelid
                AND i.oid = ix.indexrelid
                AND a.attrelid = t.oid
                AND a.attnum = ANY(ix.indkey)
                AND t.relkind = 'r'
                AND n.oid = t.relnamespace
                AND n.nspname = 'ro_consult'
            ORDER BY
                t.relname,
                i.relname;
        """
        
        cur.execute(query)
        indices = cur.fetchall()
        
        current_table = ""
        for idx in indices:
            if idx['table_name'] != current_table:
                print(f"\nTabela: {idx['table_name']}")
                current_table = idx['table_name']
            
            unique = "[UNIQUE] " if idx['is_unique'] else ""
            print(f"  -> {idx['index_name']} ({idx['column_name']}) {unique}- Tamanho: {idx['index_size']}")

        # Verificar se faltam índices críticos
        print("\n--- ANÁLISE DE ÍNDICES CRÍTICOS ---")
        tables_to_check = ['pedidos', 'itens_ped', 'cad_prod']
        for tab in tables_to_check:
            cur.execute(f"SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'ro_consult' AND tablename = '{tab}';")
            count = cur.fetchone()['count']
            print(f"Indices em {tab}: {count}")

        conn.close()
    except Exception as e:
        print(f"Erro: {e}")

if __name__ == "__main__":
    check_indices()
