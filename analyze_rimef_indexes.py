"""
Análise de Índices e Generators do Schema RIMEF
Script para identificar problemas de performance
"""

import psycopg2
from psycopg2 import sql
from tabulate import tabulate
import sys

# Configuração do banco
DB_CONFIG = {
    "host": "node254557-salesmaster.sp1.br.saveincloud.net.br",
    "port": "13062",
    "database": "basesales",
    "user": "webadmin",
    "password": "ytAyO0u043"
}

SCHEMA = "rimef"

def get_connection():
    return psycopg2.connect(**DB_CONFIG)

def analyze_tables(conn):
    """Analisa as tabelas do schema rimef"""
    print("\n" + "="*80)
    print("📊 TABELAS DO SCHEMA RIMEF")
    print("="*80)
    
    query = """
    SELECT 
        t.table_name,
        pg_size_pretty(pg_total_relation_size(quote_ident(t.table_schema) || '.' || quote_ident(t.table_name))) as total_size,
        pg_size_pretty(pg_relation_size(quote_ident(t.table_schema) || '.' || quote_ident(t.table_name))) as table_size,
        pg_size_pretty(pg_indexes_size(quote_ident(t.table_schema) || '.' || quote_ident(t.table_name))) as indexes_size,
        (SELECT COUNT(*) FROM information_schema.columns c WHERE c.table_schema = t.table_schema AND c.table_name = t.table_name) as columns_count
    FROM information_schema.tables t
    WHERE t.table_schema = %s
    AND t.table_type = 'BASE TABLE'
    ORDER BY pg_total_relation_size(quote_ident(t.table_schema) || '.' || quote_ident(t.table_name)) DESC;
    """
    
    with conn.cursor() as cur:
        cur.execute(query, (SCHEMA,))
        results = cur.fetchall()
        
        if results:
            headers = ["Tabela", "Tamanho Total", "Dados", "Índices", "Colunas"]
            print(tabulate(results, headers=headers, tablefmt="grid"))
        else:
            print("❌ Nenhuma tabela encontrada no schema rimef")
    
    return results

def analyze_row_counts(conn):
    """Conta registros em cada tabela"""
    print("\n" + "="*80)
    print("📈 CONTAGEM DE REGISTROS POR TABELA")
    print("="*80)
    
    query = """
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = %s AND table_type = 'BASE TABLE'
    """
    
    with conn.cursor() as cur:
        cur.execute(query, (SCHEMA,))
        tables = cur.fetchall()
        
        results = []
        for (table_name,) in tables:
            try:
                cur.execute(sql.SQL("SELECT COUNT(*) FROM {}.{}").format(
                    sql.Identifier(SCHEMA), 
                    sql.Identifier(table_name)
                ))
                count = cur.fetchone()[0]
                results.append((table_name, count))
            except Exception as e:
                results.append((table_name, f"ERRO: {e}"))
        
        results.sort(key=lambda x: x[1] if isinstance(x[1], int) else 0, reverse=True)
        headers = ["Tabela", "Registros"]
        print(tabulate(results, headers=headers, tablefmt="grid"))
    
    return results

def analyze_indexes(conn):
    """Analisa os índices existentes"""
    print("\n" + "="*80)
    print("🔍 ÍNDICES EXISTENTES NO SCHEMA RIMEF")
    print("="*80)
    
    query = """
    SELECT 
        i.tablename as tabela,
        i.indexname as indice,
        i.indexdef as definicao,
        pg_size_pretty(pg_relation_size(quote_ident(i.schemaname) || '.' || quote_ident(i.indexname))) as tamanho
    FROM pg_indexes i
    WHERE i.schemaname = %s
    ORDER BY i.tablename, i.indexname;
    """
    
    with conn.cursor() as cur:
        cur.execute(query, (SCHEMA,))
        results = cur.fetchall()
        
        if results:
            headers = ["Tabela", "Índice", "Definição", "Tamanho"]
            print(tabulate(results, headers=headers, tablefmt="grid", maxcolwidths=[15, 30, 60, 10]))
        else:
            print("⚠️ NENHUM ÍNDICE ENCONTRADO NO SCHEMA RIMEF!")
            print("   Isso pode ser a causa da lentidão!")
    
    return results

def analyze_missing_indexes(conn):
    """Identifica tabelas sem índices ou primary keys"""
    print("\n" + "="*80)
    print("⚠️ TABELAS SEM ÍNDICES OU PRIMARY KEY")
    print("="*80)
    
    query = """
    SELECT 
        t.table_name,
        (SELECT COUNT(*) FROM pg_indexes i WHERE i.schemaname = %s AND i.tablename = t.table_name) as index_count,
        CASE WHEN pk.constraint_name IS NOT NULL THEN 'Sim' ELSE 'NÃO' END as has_pk
    FROM information_schema.tables t
    LEFT JOIN (
        SELECT tc.table_name, tc.constraint_name
        FROM information_schema.table_constraints tc
        WHERE tc.table_schema = %s AND tc.constraint_type = 'PRIMARY KEY'
    ) pk ON t.table_name = pk.table_name
    WHERE t.table_schema = %s AND t.table_type = 'BASE TABLE'
    ORDER BY index_count ASC, t.table_name;
    """
    
    with conn.cursor() as cur:
        cur.execute(query, (SCHEMA, SCHEMA, SCHEMA))
        results = cur.fetchall()
        
        headers = ["Tabela", "Qtd Índices", "Tem PK?"]
        print(tabulate(results, headers=headers, tablefmt="grid"))
        
        # Mostrar alertas
        no_pk = [r for r in results if r[2] == 'NÃO']
        no_idx = [r for r in results if r[1] == 0]
        
        if no_pk:
            print(f"\n🚨 ALERTA: {len(no_pk)} tabelas SEM PRIMARY KEY!")
            for t in no_pk:
                print(f"   - {t[0]}")
        
        if no_idx:
            print(f"\n🚨 ALERTA: {len(no_idx)} tabelas SEM NENHUM ÍNDICE!")
            for t in no_idx:
                print(f"   - {t[0]}")
    
    return results

def analyze_sequences(conn):
    """Analisa as sequences (generators) do schema"""
    print("\n" + "="*80)
    print("🔢 SEQUENCES (GENERATORS) NO SCHEMA RIMEF")
    print("="*80)
    
    query = """
    SELECT 
        s.sequence_name,
        s.start_value,
        s.minimum_value,
        s.maximum_value,
        s.increment
    FROM information_schema.sequences s
    WHERE s.sequence_schema = %s
    ORDER BY s.sequence_name;
    """
    
    with conn.cursor() as cur:
        cur.execute(query, (SCHEMA,))
        results = cur.fetchall()
        
        if results:
            headers = ["Sequence", "Início", "Mínimo", "Máximo", "Incremento"]
            print(tabulate(results, headers=headers, tablefmt="grid"))
        else:
            print("❌ Nenhuma sequence encontrada no schema rimef")
            print("   As sequences podem estar no schema public ou não existirem")
    
    # Verificar sequences no public também
    query_public = """
    SELECT 
        s.sequence_name,
        pg_sequence_last_value(quote_ident(s.sequence_schema) || '.' || quote_ident(s.sequence_name)) as last_value
    FROM information_schema.sequences s
    WHERE s.sequence_schema = 'public'
    AND s.sequence_name LIKE 'gen_%'
    ORDER BY s.sequence_name;
    """
    
    print("\n📋 Sequences no schema PUBLIC (para comparação):")
    with conn.cursor() as cur:
        try:
            cur.execute(query_public)
            public_sequences = cur.fetchall()
            if public_sequences:
                headers = ["Sequence", "Último Valor"]
                print(tabulate(public_sequences, headers=headers, tablefmt="grid"))
        except Exception as e:
            print(f"   Erro ao consultar sequences públicas: {e}")
    
    return results

def analyze_primary_keys(conn):
    """Analisa estrutura das primary keys"""
    print("\n" + "="*80)
    print("🔑 PRIMARY KEYS NO SCHEMA RIMEF")
    print("="*80)
    
    query = """
    SELECT 
        tc.table_name,
        tc.constraint_name,
        kcu.column_name,
        c.data_type
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name 
        AND tc.table_schema = kcu.table_schema
    JOIN information_schema.columns c 
        ON c.table_name = tc.table_name 
        AND c.table_schema = tc.table_schema 
        AND c.column_name = kcu.column_name
    WHERE tc.table_schema = %s 
    AND tc.constraint_type = 'PRIMARY KEY'
    ORDER BY tc.table_name;
    """
    
    with conn.cursor() as cur:
        cur.execute(query, (SCHEMA,))
        results = cur.fetchall()
        
        if results:
            headers = ["Tabela", "Constraint", "Coluna PK", "Tipo"]
            print(tabulate(results, headers=headers, tablefmt="grid"))
        else:
            print("⚠️ NENHUMA PRIMARY KEY DEFINIDA NO SCHEMA RIMEF!")
            print("   Isso é um problema SÉRIO de performance!")
    
    return results

def analyze_foreign_keys(conn):
    """Analisa foreign keys"""
    print("\n" + "="*80)
    print("🔗 FOREIGN KEYS NO SCHEMA RIMEF")
    print("="*80)
    
    query = """
    SELECT 
        tc.table_name as tabela_origem,
        kcu.column_name as coluna,
        ccu.table_name as tabela_destino,
        ccu.column_name as coluna_destino
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu 
        ON tc.constraint_name = ccu.constraint_name
    WHERE tc.table_schema = %s 
    AND tc.constraint_type = 'FOREIGN KEY'
    ORDER BY tc.table_name;
    """
    
    with conn.cursor() as cur:
        cur.execute(query, (SCHEMA,))
        results = cur.fetchall()
        
        if results:
            headers = ["Tabela Origem", "Coluna", "Tabela Destino", "Coluna Destino"]
            print(tabulate(results, headers=headers, tablefmt="grid"))
        else:
            print("ℹ️ Nenhuma foreign key definida")
            print("   FKs ajudam em joins mas podem impactar performance de escrita")
    
    return results

def analyze_column_types(conn):
    """Analisa tipos de dados das principais colunas"""
    print("\n" + "="*80)
    print("📋 COLUNAS POTENCIALMENTE PROBLEMÁTICAS")
    print("="*80)
    
    query = """
    SELECT 
        c.table_name,
        c.column_name,
        c.data_type,
        c.character_maximum_length,
        c.is_nullable
    FROM information_schema.columns c
    WHERE c.table_schema = %s
    AND (
        c.column_name LIKE '%_codigo%'
        OR c.column_name LIKE '%_id%'
        OR c.column_name LIKE '%_data%'
        OR c.column_name LIKE 'ped_%'
        OR c.column_name LIKE 'cli_%'
        OR c.column_name LIKE 'ite_%'
    )
    ORDER BY c.table_name, c.column_name;
    """
    
    with conn.cursor() as cur:
        cur.execute(query, (SCHEMA,))
        results = cur.fetchall()
        
        if results:
            headers = ["Tabela", "Coluna", "Tipo", "Tam. Max", "Nullable?"]
            print(tabulate(results, headers=headers, tablefmt="grid"))
    
    return results

def suggest_indexes(conn):
    """Sugere índices baseado na estrutura das tabelas"""
    print("\n" + "="*80)
    print("💡 SUGESTÕES DE ÍNDICES PARA O SCHEMA RIMEF")
    print("="*80)
    
    suggestions = []
    
    # Verificar tabelas sem índice
    query = """
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = %s AND table_type = 'BASE TABLE'
    """
    
    with conn.cursor() as cur:
        cur.execute(query, (SCHEMA,))
        tables = cur.fetchall()
        
        for (table_name,) in tables:
            # Verificar se tem índice
            cur.execute("""
                SELECT COUNT(*) FROM pg_indexes 
                WHERE schemaname = %s AND tablename = %s
            """, (SCHEMA, table_name))
            idx_count = cur.fetchone()[0]
            
            # Obter colunas da tabela
            cur.execute("""
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_schema = %s AND table_name = %s
                ORDER BY ordinal_position
            """, (SCHEMA, table_name))
            columns = cur.fetchall()
            
            if idx_count == 0:
                # Sugerir índices baseado em padrões de nome
                for col_name, col_type in columns:
                    if col_name.endswith('_codigo') or col_name.endswith('_id'):
                        suggestions.append({
                            "tabela": table_name,
                            "tipo": "PRIMARY KEY ou ÍNDICE",
                            "coluna": col_name,
                            "sql": f"CREATE INDEX idx_{SCHEMA}_{table_name}_{col_name} ON {SCHEMA}.{table_name}({col_name});"
                        })
                    elif '_industria' in col_name:
                        suggestions.append({
                            "tabela": table_name,
                            "tipo": "ÍNDICE (FK)",
                            "coluna": col_name,
                            "sql": f"CREATE INDEX idx_{SCHEMA}_{table_name}_{col_name} ON {SCHEMA}.{table_name}({col_name});"
                        })
                    elif '_data' in col_name:
                        suggestions.append({
                            "tabela": table_name,
                            "tipo": "ÍNDICE (DATA)",
                            "coluna": col_name,
                            "sql": f"CREATE INDEX idx_{SCHEMA}_{table_name}_{col_name} ON {SCHEMA}.{table_name}({col_name});"
                        })
    
    if suggestions:
        print("\n📝 SUGESTÕES DE ÍNDICES:")
        print("-" * 80)
        for s in suggestions:
            print(f"\n-- Tabela: {s['tabela']} | Coluna: {s['coluna']} | Tipo: {s['tipo']}")
            print(s['sql'])
    else:
        print("✅ Não há sugestões automáticas de índices")
    
    return suggestions

def generate_fix_script(conn):
    """Gera script SQL para corrigir problemas encontrados"""
    print("\n" + "="*80)
    print("📜 SCRIPT SQL PARA CORREÇÕES")
    print("="*80)
    
    script_lines = [
        "-- ============================================",
        f"-- Script de Criação de Índices para Schema {SCHEMA}",
        "-- Gerado automaticamente",
        "-- ============================================",
        ""
    ]
    
    query = """
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = %s AND table_type = 'BASE TABLE'
    """
    
    with conn.cursor() as cur:
        cur.execute(query, (SCHEMA,))
        tables = [t[0] for t in cur.fetchall()]
        
        table_indexes = {
            "pedidos": [
                ("ped_pedido", "PRIMARY KEY"),
                ("ped_industria", "INDEX"),
                ("ped_cliente", "INDEX"),
                ("ped_data", "INDEX"),
                ("ped_situacao", "INDEX"),
            ],
            "itens_ped": [
                ("ite_pedido, ite_industria, ite_item", "PRIMARY KEY COMPOSTA"),
                ("ite_pedido", "INDEX"),
                ("ite_industria", "INDEX"),
                ("ite_produto", "INDEX"),
            ],
            "clientes": [
                ("cli_codigo", "PRIMARY KEY"),
                ("cli_cnpj", "INDEX"),
                ("cli_industria", "INDEX"),
                ("cli_nome", "INDEX"),
            ],
            "vendedores": [
                ("ven_codigo", "PRIMARY KEY"),
            ],
            "fornecedores": [
                ("for_codigo", "PRIMARY KEY"),
            ],
            "transportadora": [
                ("tra_codigo", "PRIMARY KEY"),
            ]
        }
        
        for table_name in tables:
            if table_name in table_indexes:
                script_lines.append(f"\n-- Tabela: {SCHEMA}.{table_name}")
                script_lines.append("-" * 50)
                
                for cols, idx_type in table_indexes[table_name]:
                    if "PRIMARY KEY" in idx_type:
                        if "COMPOSTA" in idx_type:
                            script_lines.append(f"-- Adicionar PRIMARY KEY COMPOSTA em ({cols})")
                            script_lines.append(f"ALTER TABLE {SCHEMA}.{table_name} ADD PRIMARY KEY ({cols});")
                        else:
                            script_lines.append(f"-- Adicionar PRIMARY KEY em {cols}")
                            script_lines.append(f"ALTER TABLE {SCHEMA}.{table_name} ADD PRIMARY KEY ({cols});")
                    else:
                        idx_name = f"idx_{SCHEMA}_{table_name}_{cols.replace(', ', '_')}"
                        script_lines.append(f"CREATE INDEX IF NOT EXISTS {idx_name} ON {SCHEMA}.{table_name}({cols});")
    
    script = "\n".join(script_lines)
    print(script)
    
    # Salvar o script em arquivo
    script_file = "e:\\Sistemas_ia\\SalesMasters\\scripts_bancodedados\\fix_rimef_indexes.sql"
    with open(script_file, "w", encoding="utf-8") as f:
        f.write(script)
    print(f"\n✅ Script salvo em: {script_file}")
    
    return script

def main():
    print("="*80)
    print("🔬 ANÁLISE DE PERFORMANCE DO SCHEMA RIMEF")
    print("="*80)
    print(f"Host: {DB_CONFIG['host']}")
    print(f"Database: {DB_CONFIG['database']}")
    print(f"Schema: {SCHEMA}")
    
    try:
        conn = get_connection()
        print("✅ Conexão estabelecida com sucesso!\n")
        
        # Executar análises
        analyze_tables(conn)
        analyze_row_counts(conn)
        analyze_indexes(conn)
        analyze_primary_keys(conn)
        analyze_missing_indexes(conn)
        analyze_sequences(conn)
        analyze_foreign_keys(conn)
        analyze_column_types(conn)
        suggest_indexes(conn)
        generate_fix_script(conn)
        
        conn.close()
        print("\n" + "="*80)
        print("✅ Análise concluída!")
        print("="*80)
        
    except Exception as e:
        print(f"❌ Erro ao conectar: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
