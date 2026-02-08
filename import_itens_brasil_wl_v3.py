
import pandas as pd
import psycopg2
import sys
import numpy as np
import os

# CONFIGURAÇÃO DE NUVEM
DB_HOST = "node254557-salesmaster.sp1.br.saveincloud.net.br"
DB_PORT = 13062
DB_NAME = "basesales"
DB_USER = "webadmin"
DB_PASS = "ytAyO0u043"
SCHEMA = "brasil_wl"

# Force UTF-8 output
sys.stdout.reconfigure(encoding='utf-8')

def get_db_columns(cur, table_name):
    cur.execute(f"""
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_schema = '{SCHEMA}' 
        AND table_name = '{table_name}'
    """)
    return {row[0].lower(): {"type": row[1], "nullable": row[2] == 'YES'} for row in cur.fetchall()}

def clean_row(row):
    cleaned = {}
    for k, v in row.items():
        if pd.isna(v):
            cleaned[k] = None
        elif isinstance(v, (np.int64, np.int32)):
            cleaned[k] = int(v)
        elif isinstance(v, (np.float64, np.float32)):
            cleaned[k] = float(v)
        else:
            cleaned[k] = v
    return cleaned

def import_sheet(cur, file_path, table_name):
    if not os.path.exists(file_path):
        print(f"⚠️ Arquivo não encontrado: {file_path}")
        return

    print(f"\n📂 Processando {file_path} -> {SCHEMA}.{table_name}")
    
    db_cols_meta = get_db_columns(cur, table_name)
    if not db_cols_meta:
        print(f"❌ Tabela {SCHEMA}.{table_name} não encontrada!")
        return

    try:
        df = pd.read_excel(file_path)
    except Exception as e:
        print(f"❌ Erro leitura: {e}")
        return

    df.columns = [str(c).strip().lower() for c in df.columns]
    
    # EXCLUIR ite_lancto (auto-incremento)
    valid_cols = [c for c in df.columns if c in db_cols_meta and c != 'ite_lancto']
    
    print(f"   Mapeado: {len(valid_cols)} cols (excluindo ite_lancto)")

    # Limpar tabela
    try:
        cur.execute(f"TRUNCATE TABLE {SCHEMA}.{table_name} CASCADE")
        print("   🗑️ Tabela limpa.")
    except Exception as e:
        print(f"   ⚠️ Erro ao limpar: {e}")

    # Inserir
    cols_str = ', '.join(valid_cols)
    vals_str = ', '.join(['%s'] * len(valid_cols))
    query = f"INSERT INTO {SCHEMA}.{table_name} ({cols_str}) VALUES ({vals_str})"

    count = 0
    errors = 0
    
    # Campos obrigatórios no banco (que não podem ser nulos)
    not_null_cols = [col for col, meta in db_cols_meta.items() if not meta['nullable'] and col != 'ite_lancto']
    print(f"   Campos obrigatórios: {not_null_cols}")

    for _, row in df.iterrows():
        try:
            row_data = clean_row(row)
            
            # Correção para campos obrigatórios nulos
            for col in not_null_cols:
                if col in row_data and row_data[col] is None:
                    if db_cols_meta[col]['type'] in ('integer', 'smallint', 'bigint', 'numeric', 'double precision'):
                        row_data[col] = 0
                    else:
                        row_data[col] = ''
            
            values = [row_data[c] for c in valid_cols]
            cur.execute(query, values)
            count += 1
            if count % 1000 == 0:
                print(f"   Progresso: {count} registros...")
        except Exception as e:
            errors += 1
            if errors <= 10:
                print(f"   ❌ Erro no registro {count+errors} (Item: {row_data.get('ite_pedido')}): {e}")
    
    print(f"✅ FINALIZADO {table_name}: Sucesso: {count} | Falhas: {errors}")

def run():
    print(f"🚀 Iniciando importação EXCLUSIVA de ITENS_PED no schema '{SCHEMA}'...")
    print("⚠️ ite_lancto removido (autoincremento).")
    
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASS
        )
        conn.autocommit = True
        cur = conn.cursor()
        
        import_sheet(cur, 'data/itens_ped.xlsx', 'itens_ped')
        
        conn.close()
        print("\n🏁 OPERAÇÃO CONCLUÍDA!")

    except Exception as e:
        print(f"\n❌ ERRO FATAL: {e}")

if __name__ == "__main__":
    run()
