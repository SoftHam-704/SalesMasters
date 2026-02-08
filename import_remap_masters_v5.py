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
    'transportadora': {
        'CODIGO': 'tra_codigo', 'NOME': 'tra_nome', 'ENDERECO': 'tra_endereco', 
        'BAIRRO': 'tra_bairro', 'CIDADE': 'tra_cidade', 'CEP': 'tra_cep',
        'UF': 'tra_uf', 'CONTATO': 'tra_contato', 'EMAIL': 'tra_email',
        'TELEFONE1': 'tra_fone', 'CNPJ': 'tra_cgc', 'IEST': 'tra_inscricao'
    }
}

# --- Helpers ---
def clean_numeric_str(val, max_len=None):
    if pd.isna(val): return None
    s = str(val).strip()
    s = re.sub(r'[^0-9]', '', s) # Keep only numbers
    if not s: return None
    return s[:max_len] if max_len else s

def safe_str(val, max_len=None):
    if pd.isna(val) or val == '' or str(val).lower() == 'nan': return None
    s = str(val).strip()
    if s.endswith('.0'): s = s[:-2]
    if max_len and len(s) > max_len: s = s[:max_len]
    return s

def process_dataframe(df, table_name):
    # Standardize column names
    df.columns = [str(c).lower().strip() for c in df.columns]

    if table_name == 'fornecedores':
        # NomRed Fallback
        if 'for_nomered' not in df.columns and 'for_nome' in df.columns:
            df['for_nomered'] = df['for_nome']
        elif 'for_nomered' in df.columns:
            df['for_nomered'] = df['for_nomered'].fillna(df['for_nome'])

        # Fix Lengths
        # for_cgc (CNPJ) - usually 14 digits, field might be varchar(15) or (18)
        # Just strip non-numeric to be safe and efficient
        if 'for_cgc' in df.columns:
            df['for_cgc'] = df['for_cgc'].apply(lambda x: clean_numeric_str(x, 14))
            
        if 'for_inscricao' in df.columns:
             df['for_inscricao'] = df['for_inscricao'].apply(lambda x: clean_numeric_str(x, 15))
             
        if 'for_fone' in df.columns:
            # Phones can be messy. Just safe truncate
            df['for_fone'] = df['for_fone'].apply(lambda x: safe_str(x, 15))
            
        if 'for_fone2' in df.columns:
             df['for_fone2'] = df['for_fone2'].apply(lambda x: safe_str(x, 15))
             
        if 'for_cep' in df.columns:
             df['for_cep'] = df['for_cep'].apply(lambda x: clean_numeric_str(x, 8))

    return df

def get_valid_columns(cur, table_name):
    cur.execute(f"SELECT column_name FROM information_schema.columns WHERE table_schema = '{SCHEMA}' AND table_name = '{table_name}'")
    return {row[0].lower() for row in cur.fetchall()}

def import_table(conn, file_name, table_name):
    print(f"\n--- Processing {file_name} -> {SCHEMA}.{table_name} ---")
    file_path = os.path.join(DATA_DIR, file_name)
    
    if not os.path.exists(file_path):
        print(f"Skipping {file_name}")
        return

    try:
        cur = conn.cursor()
        print(f"Truncating {SCHEMA}.{table_name}...")
        cur.execute(f"TRUNCATE TABLE {SCHEMA}.{table_name} CASCADE;")
        
        df = pd.read_excel(file_path)
        if df.empty: return

        df = process_dataframe(df, table_name)
        
        valid_cols = get_valid_columns(cur, table_name)
        input_cols = [c for c in df.columns if c in valid_cols]
        
        if not input_cols:
            print(f"ERROR: No matching columns! DF: {list(df.columns)}")
            return

        final_df = df[input_cols]
        final_df = final_df.astype(object).where(pd.notnull(final_df), None)
        
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
        
        # Only process failed ones
        files_to_retry = ['cidades.xlsx', 'fornecedores.xlsx']
        
        for f in files_to_retry:
            if f in FILES_MAP:
                import_table(conn, f, FILES_MAP[f])
                
        conn.close()
        print("\n--- RETRY COMPLETED ---")
    except Exception as e:
        print(f"Fatal: {e}")
