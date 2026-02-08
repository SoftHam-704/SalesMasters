import pandas as pd
import psycopg2
from psycopg2 import extras
import numpy as np
import os
import re

# --- Configurations ---
DATA_DIR = 'data/'
DB_CONFIG = {
    'host': 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    'port': 13062,
    'database': 'basesales',
    'user': 'webadmin',
    'password': 'ytAyO0u043'
}

SCHEMA = 'remap'

FILES_MAP = {
    'cidades.xlsx': 'cidades',
    'fornecedores.xlsx': 'fornecedores'
}

COL_MAPPINGS = {
    'cidades': {
        'CODIGO': 'cid_codigo',
        'NOME': 'cid_nome',
        'UF': 'cid_uf',
        'CODMUN': 'cid_ibge',
        'COD_ORIGEM': 'cid_cod_origem',
        'ATIVO': 'cid_ativo'
    }
}

# --- Helpers ---
def safe_clean(val):
    if pd.isna(val) or val == '' or str(val).lower() == 'nan': return None
    s = str(val).strip()
    if s.endswith('.0'): s = s[:-2]
    return s

def get_column_specs(cur, table_name):
    """Returns dict {col_name: max_length}"""
    cur.execute(f"""
        SELECT column_name, character_maximum_length, data_type 
        FROM information_schema.columns 
        WHERE table_schema = '{SCHEMA}' 
          AND table_name = '{table_name}'
    """)
    specs = {}
    for row in cur.fetchall():
        col = row[0].lower()
        max_len = row[1]
        dtype = row[2]
        specs[col] = {'max_len': max_len, 'type': dtype}
    return specs

def process_dataframe(df, table_name, col_specs):
    # Standardize column names (after mapping)
    df.columns = [str(c).lower().strip() for c in df.columns]

    if table_name == 'fornecedores':
        if 'for_nomered' not in df.columns and 'for_nome' in df.columns:
            df['for_nomered'] = df['for_nome']
        elif 'for_nomered' in df.columns:
            df['for_nomered'] = df['for_nomered'].fillna(df['for_nome'])

    # Dynamic Truncation based on DB Schema
    for col in df.columns:
        if col in col_specs:
            spec = col_specs[col]
            if spec['max_len'] and spec['type'] in ('character varying', 'character', 'varchar', 'char'):
                max_len = spec['max_len']
                # Apply truncate
                df[col] = df[col].apply(lambda x: safe_clean(x)[:max_len] if safe_clean(x) else None)
            else:
                # Just basic clean for non-strings
                df[col] = df[col].apply(lambda x: safe_clean(x) if pd.notnull(x) else None)

    return df

def import_table(conn, file_name, table_name):
    print(f"\n--- Processing {file_name} -> {SCHEMA}.{table_name} ---")
    file_path = os.path.join(DATA_DIR, file_name)
    if not os.path.exists(file_path): return

    try:
        cur = conn.cursor()
        col_specs = get_column_specs(cur, table_name)
        
        # 1. Read
        df = pd.read_excel(file_path)
        if df.empty: return

        # 2. Rename
        # Force uppercase rename first for consistency
        df.columns = [str(c).upper().strip() for c in df.columns]
        if table_name in COL_MAPPINGS:
            df.rename(columns=COL_MAPPINGS[table_name], inplace=True)
            
        # 3. Process & Truncate
        df = process_dataframe(df, table_name, col_specs)
        
        # 4. Filter Valid Columns
        valid_cols = set(col_specs.keys())
        input_cols = [c for c in df.columns if c in valid_cols]
        
        if not input_cols:
            print(f"ERROR: No matching columns! DF: {list(df.columns)}")
            return

        final_df = df[input_cols]
        final_df = final_df.where(pd.notnull(final_df), None)
        
        # 5. Insert
        # Use simple individual inserts or slower batch if truncate fails? No, batch is fine now.
        # But let's truncate first.
        cur.execute(f"TRUNCATE TABLE {SCHEMA}.{table_name} CASCADE;")
        
        data = [tuple(x) for x in final_df.to_numpy()]
        cols = ','.join(input_cols)
        query = f"INSERT INTO {SCHEMA}.{table_name} ({cols}) VALUES %s"
        
        extras.execute_values(cur, query, data)
        print(f"SUCCESS: Inserted {len(data)} rows into {table_name}")
        cur.close()

    except Exception as e:
        print(f"ERROR importing {table_name}: {e}")

if __name__ == "__main__":
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        conn.autocommit = True
        
        for f in ['cidades.xlsx', 'fornecedores.xlsx']:
            import_table(conn, f, FILES_MAP[f])
            
        conn.close()
        print("\n--- DONE ---")
    except Exception as e:
        print(f"Fatal: {e}")
