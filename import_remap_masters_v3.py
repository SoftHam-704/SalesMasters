import pandas as pd
import psycopg2
from psycopg2 import extras
import numpy as np
import os
import datetime

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
    'transportadora.xlsx': 'transportadora',
    'grupos.xlsx': 'grupos',
    'vendedores.xlsx': 'vendedores',
    'fornecedores.xlsx': 'fornecedores',
    'clientes.xlsx': 'clientes'
}

COL_MAPPINGS = {
    'transportadora': {
        'CODIGO': 'tra_codigo', 'NOME': 'tra_nome', 'ENDERECO': 'tra_endereco',
        'BAIRRO': 'tra_bairro', 'CIDADE': 'tra_cidade', 'CEP': 'tra_cep',
        'UF': 'tra_uf', 'CONTATO': 'tra_contato', 'EMAIL': 'tra_email',
        'TELEFONE1': 'tra_fone', 'CNPJ': 'tra_cgc', 'IEST': 'tra_inscricao'
    }
}

# --- Cleaning Functions ---

def clean_date(val):
    if pd.isna(val) or val == '' or str(val).lower() == 'nan':
        return None
    try:
        return pd.to_datetime(val).date()
    except:
        return None

def clean_str(val, max_len=None):
    if pd.isna(val) or val == '' or str(val).lower() == 'nan':
        return None
    s = str(val).strip()
    if s.endswith('.0'): # remove float artifact from strings like 'SP.0'
        s = s[:-2]
    if max_len and len(s) > max_len:
        s = s[:max_len]
    return s

def clean_int(val):
    if pd.isna(val) or val == '' or str(val).lower() == 'nan':
        return None
    try:
        return int(float(val))
    except:
        return None

def clean_dataframe(df, table_name):
    # Standardize column names
    df.columns = [c.lower() for c in df.columns]
    
    # 1. CLIENTES Special Logic
    if table_name == 'clientes':
        # Fix Missing Fields
        if 'cli_nomred' not in df.columns:
            if 'cli_nome' in df.columns:
                df['cli_nomred'] = df['cli_nome']
        else:
            df['cli_nomred'] = df['cli_nomred'].fillna(df['cli_nome'])
            
        # Fix Dates
        date_cols = ['cli_datacad', 'cli_dtnasc', 'cli_dtultcomp']
        for col in date_cols:
            if col in df.columns:
                df[col] = df[col].apply(clean_date)
                
        # Fix Strings & Codes
        if 'cli_uf' in df.columns:
            df['cli_uf'] = df['cli_uf'].apply(lambda x: clean_str(x, 2))
            
    # 2. VENDEDORES Special Logic
    if table_name == 'vendedores':
        if 'ven_uf' in df.columns:
             df['ven_uf'] = df['ven_uf'].apply(lambda x: clean_str(x, 2))
        
        # Status usually char(1)
        if 'ven_status' in df.columns:
             df['ven_status'] = df['ven_status'].apply(lambda x: clean_str(x, 1))

    # 3. FORNECEDORES Special Logic
    if table_name == 'fornecedores':
        # Fix NomRed
        if 'for_nomered' not in df.columns:
            if 'for_nome' in df.columns:
                df['for_nomered'] = df['for_nome']
        else:
            df['for_nomered'] = df['for_nomered'].fillna(df['for_nome'])
            
        # Fix Large Numbers (CNPJ/IE) treated as Ints
        str_cols = ['for_cgc', 'for_inscricao', 'for_fone', 'for_fone2', 'for_cep']
        for col in str_cols:
            if col in df.columns:
                df[col] = df[col].apply(lambda x: clean_str(x))
                
        if 'for_uf' in df.columns:
            df['for_uf'] = df['for_uf'].apply(lambda x: clean_str(x, 2))

    # General Cleaning: Replace ALL NaNs with None for final SQL safety
    df = df.astype(object).where(pd.notnull(df), None)
    
    return df

def get_valid_columns(cur, table_name):
    cur.execute(f"SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = '{SCHEMA}' AND table_name = '{table_name}'")
    return {row[0].lower(): row[1] for row in cur.fetchall()}

def import_table(conn, file_name, table_name):
    print(f"\n--- Processing {file_name} -> {SCHEMA}.{table_name} ---")
    file_path = os.path.join(DATA_DIR, file_name)
    
    if not os.path.exists(file_path):
        print(f"Skipping {file_name}")
        return

    try:
        cur = conn.cursor()
        
        # Truncate
        cur.execute(f"TRUNCATE TABLE {SCHEMA}.{table_name} CASCADE;")
        
        df = pd.read_excel(file_path)
        if df.empty: return

        # Rename
        if table_name in COL_MAPPINGS:
            df.rename(columns=COL_MAPPINGS[table_name], inplace=True)
            
        # Clean
        df = clean_dataframe(df, table_name)
        
        # Filter Columns
        db_cols_info = get_valid_columns(cur, table_name)
        valid_cols = set(db_cols_info.keys())
        
        cols_to_insert = [c for c in df.columns if c in valid_cols]
        
        if not cols_to_insert:
            print("No matching columns!")
            return

        final_df = df[cols_to_insert]
        
        # Final Nulo Check
        final_df = final_df.where(pd.notnull(final_df), None)
        
        data_tuples = [tuple(x) for x in final_df.to_numpy()]
        cols_str = ','.join(cols_to_insert)
        query = f"INSERT INTO {SCHEMA}.{table_name} ({cols_str}) VALUES %s"
        
        extras.execute_values(cur, query, data_tuples)
        print(f"SUCCESS: Inserted {len(data_tuples)} rows into {table_name}")
        cur.close()

    except Exception as e:
        print(f"ERROR importing {table_name}: {e}")

if __name__ == "__main__":
    import main as m
    # Hack to allow running
    pass

# Direct execution
try:
    conn = psycopg2.connect(**DB_CONFIG)
    conn.autocommit = True
    ordered_files = ['cidades.xlsx', 'transportadora.xlsx', 'grupos.xlsx', 'vendedores.xlsx', 'fornecedores.xlsx', 'clientes.xlsx']
    for f in ordered_files:
        if f in FILES_MAP:
            import_table(conn, f, FILES_MAP[f])
    conn.close()
    print("\n--- DONE ---")
except Exception as e:
    print(f"Fatal: {e}")
