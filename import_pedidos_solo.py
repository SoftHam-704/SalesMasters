
import pandas as pd
import json
import os
from sqlalchemy import create_engine, text
from datetime import datetime

# Configuração do banco
DB_HOST = "node254557-salesmaster.sp1.br.saveincloud.net.br"
DB_PORT = "13062"
DB_NAME = "basesales"
DB_USER = "webadmin"
DB_PASSWORD = "ytAyO0u043"
SCHEMA = "ndsrep"

# Diretório das planilhas
DATA_DIR = r"e:\Sistemas_ia\SalesMasters\data"
FILE_NAME = "pedidos.json"
TABLE_NAME = "pedidos"

def get_db_engine():
    connection_string = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    return create_engine(connection_string, pool_pre_ping=True)

def get_table_columns(engine, schema, table):
    query = f"""
        SELECT column_name, data_type, character_maximum_length
        FROM information_schema.columns 
        WHERE table_schema = '{schema}' AND table_name = '{table}'
    """
    with engine.connect() as conn:
        result = conn.execute(text(query))
        return {row[0].lower(): {'type': row[1], 'max_len': row[2]} for row in result.fetchall()}

def main():
    engine = get_db_engine()
    filepath = os.path.join(DATA_DIR, FILE_NAME)
    
    print(f"🚀 Iniciando importação isolada de {TABLE_NAME}...")
    
    # 1. Obter colunas do banco
    db_cols = get_table_columns(engine, SCHEMA, TABLE_NAME)
    
    # 2. Ler JSON
    print(f"   📂 Lendo {FILE_NAME}...")
    with open(filepath, 'r', encoding='latin-1') as f:
        content = f.read()
    
    # Limpeza de Python-isms
    content = content.replace(': False', ': false').replace(': True', ': true').replace(': None', ': null')
    data = json.loads(content)
    df = pd.DataFrame(data['RecordSet'])
    
    # 3. Mapeamento e Limpeza
    df.columns = [col.lower() for col in df.columns]
    
    # Aplicar regra de PED_EXPORTADO = 'S' (padrão)
    if 'ped_exportado' in df.columns:
        df['ped_exportado'] = 'S'
    
    # Filtrar colunas que existem no banco
    existing_cols = [col for col in df.columns if col in db_cols]
    df_filtered = df[existing_cols].copy()
    
    # Tratamento de tipos
    for col in df_filtered.columns:
        col_info = db_cols.get(col, {})
        db_type = col_info.get('type', '')
        max_len = col_info.get('max_len')
        
        if 'character' in db_type or 'text' in db_type:
            df_filtered[col] = df_filtered[col].fillna('').astype(str).replace('nan', '')
            if max_len: 
                df_filtered[col] = df_filtered[col].str[:max_len]
        elif 'integer' in db_type:
            df_filtered[col] = pd.to_numeric(df_filtered[col], errors='coerce').fillna(0).astype(int)
        elif 'numeric' in db_type or 'double' in db_type:
            df_filtered[col] = pd.to_numeric(df_filtered[col], errors='coerce').fillna(0.0)
        elif 'date' in db_type or 'timestamp' in db_type:
            df_filtered[col] = pd.to_datetime(df_filtered[col], errors='coerce', dayfirst=True)
            # Proteção contra datas inválidas no Postgres
            min_date = datetime(1900, 1, 1)
            df_filtered.loc[df_filtered[col] < min_date, col] = pd.NaT

    # 4. Limpar tabela no banco
    with engine.connect() as conn:
        conn.execute(text(f"TRUNCATE TABLE {SCHEMA}.{TABLE_NAME} CASCADE"))
        conn.commit()
    print(f"   🧹 Tabela {TABLE_NAME} limpa.")

    # 5. Inserir dados
    try:
        print(f"   ⏳ Inserindo {len(df_filtered)} registros em lotes...")
        df_filtered.to_sql(TABLE_NAME, engine, schema=SCHEMA, if_exists='append', index=False, method='multi', chunksize=100)
        print(f"   🎉 Importação concluída com sucesso!")
    except Exception as e:
        print(f"   ⚠️ Erro no bulk insert, tentando modo individual...")
        success = 0
        for idx, row in df_filtered.iterrows():
            try:
                pd.DataFrame([row]).to_sql(TABLE_NAME, engine, schema=SCHEMA, if_exists='append', index=False)
                success += 1
            except: pass
        print(f"   🎉 Finalizado: {success} de {len(df_filtered)} registros inseridos.")

if __name__ == "__main__":
    main()
