
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

DATA_DIR = r"e:\Sistemas_ia\SalesMasters\data"
FILE_NAME = "itens_ped.json"
TABLE_NAME = "itens_ped"

def get_db_engine():
    connection_string = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    return create_engine(connection_string, pool_pre_ping=True)

def main():
    engine = get_db_engine()
    filepath = os.path.join(DATA_DIR, FILE_NAME)
    
    print(f"🚀 Reiniciando importação de {TABLE_NAME} (Resetando Auto-incremento)...")
    
    # 1. Limpar tabela e resetar sequência
    with engine.connect() as conn:
        print(f"   🧹 Limpando tabela e resetando sequência...")
        conn.execute(text(f"TRUNCATE TABLE {SCHEMA}.{TABLE_NAME} RESTART IDENTITY CASCADE"))
        conn.commit()

    # 2. Ler e Limpar JSON
    print(f"   📂 Lendo {FILE_NAME}...")
    with open(filepath, 'r', encoding='latin-1') as f:
        content = f.read()
    content = content.replace(': False', ': false').replace(': True', ': true').replace(': None', ': null')
    data = json.loads(content)
    df = pd.DataFrame(data['RecordSet'])
    df.columns = [col.lower() for col in df.columns]

    # 3. Remover ITE_LANCTO do dataframe para o banco gerar o novo
    if 'ite_lancto' in df.columns:
        print("   ✂️ Removendo ite_lancto do arquivo para usar o auto-incremento do banco.")
        df = df.drop(columns=['ite_lancto'])

    # 4. Obter colunas atuais do banco (para filtrar o que sobrou)
    query_cols = f"SELECT column_name, data_type, character_maximum_length FROM information_schema.columns WHERE table_schema = '{SCHEMA}' AND table_name = '{TABLE_NAME}'"
    with engine.connect() as conn:
        res = conn.execute(text(query_cols))
        db_cols = {row[0]: {'type': row[1], 'max_len': row[2]} for row in res.fetchall()}

    existing_cols = [col for col in df.columns if col in db_cols]
    df_filtered = df[existing_cols].copy()
    
    # 5. Tratamento de Tipos
    print("   🔧 Tratando tipos e datas...")
    for col in df_filtered.columns:
        col_info = db_cols.get(col, {})
        db_type = col_info.get('type', '')
        max_len = col_info.get('max_len')
        
        if 'character' in db_type or 'text' in db_type:
            df_filtered[col] = df_filtered[col].fillna('').astype(str).replace('nan', '')
            if max_len: df_filtered[col] = df_filtered[col].str[:max_len]
        elif 'integer' in db_type:
            df_filtered[col] = pd.to_numeric(df_filtered[col], errors='coerce').fillna(0).astype(int)
        elif 'numeric' in db_type or 'double' in db_type:
            df_filtered[col] = pd.to_numeric(df_filtered[col], errors='coerce').fillna(0.0)
        elif 'date' in db_type or 'timestamp' in db_type:
            df_filtered[col] = pd.to_datetime(df_filtered[col], errors='coerce', dayfirst=True)
            min_date = datetime(1900, 1, 1)
            df_filtered.loc[df_filtered[col] < min_date, col] = pd.NaT

    # 6. Inserir
    try:
        print(f"   ⏳ Inserindo {len(df_filtered)} registros (Modo Bulk)...")
        # Sem method='multi' costuma ser mais rápido para grandes volumes se a latência permitir
        df_filtered.to_sql(TABLE_NAME, engine, schema=SCHEMA, if_exists='append', index=False, chunksize=1000)
        print(f"   🎉 Importação de itens_ped concluída com sucesso!")
    except Exception as e:
        print(f"   ❌ Erro no bulk insert: {e}")
        print(f"   ⏳ Tentando modo seguro em pequenos blocos...")
        success = 0
        chunk_size = 500
        for i in range(0, len(df_filtered), chunk_size):
            chunk = df_filtered.iloc[i : i + chunk_size]
            try:
                chunk.to_sql(TABLE_NAME, engine, schema=SCHEMA, if_exists='append', index=False)
                success += len(chunk)
                if success % 5000 == 0: print(f"      ... {success}/{len(df_filtered)} inseridos")
            except:
                for _, row in chunk.iterrows():
                    try:
                        pd.DataFrame([row]).to_sql(TABLE_NAME, engine, schema=SCHEMA, if_exists='append', index=False)
                        success += 1
                    except: pass
        print(f"   🎉 Finalizado: {success}/{len(df_filtered)} registros.")

if __name__ == "__main__":
    main()
