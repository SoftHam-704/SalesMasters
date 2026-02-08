
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
FILE_NAME = "produtos.json"
TABLE_NAME = "cad_tabelaspre"

def get_db_engine():
    connection_string = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    return create_engine(connection_string, pool_pre_ping=True)

def main():
    engine = get_db_engine()
    filepath = os.path.join(DATA_DIR, FILE_NAME)
    
    print(f"🚀 Iniciando importação de {TABLE_NAME} a partir de {FILE_NAME}...")
    
    # 1. Obter colunas do banco
    query_cols = f"""
        SELECT column_name, data_type, character_maximum_length 
        FROM information_schema.columns 
        WHERE table_schema = '{SCHEMA}' AND table_name = '{TABLE_NAME}'
    """
    with engine.connect() as conn:
        res = conn.execute(text(query_cols))
        db_cols = {row[0].lower(): {'type': row[1], 'max_len': row[2]} for row in res.fetchall()}

    # 2. Ler e Limpar JSON
    print(f"   📂 Lendo e limpando {FILE_NAME}...")
    try:
        with open(filepath, 'r', encoding='latin-1') as f:
            content = f.read()
        
        # Limpeza crítica: Transformar Python-isms em JSON válido
        # Substituímos com espaço antes para não pegar partes de strings se possível, 
        # mas no RecordSet o padrão é " : False," ou " : False}"
        content = content.replace(': False', ': false').replace(': True', ': true').replace(': None', ': null')
        
        data = json.loads(content)
        df = pd.DataFrame(data['RecordSet'])
        print(f"   📊 Registros carregados: {len(df)}")
    except Exception as e:
        print(f"   ❌ ERRO CRÍTICO no carregamento do JSON: {e}")
        return

    # 3. Mapeamento Explícito
    # Mapeamento fornecido/inferido:
    mapping = {
        "PRO_CODIGO": "itab_idprod",
        "PRO_INDUSTRIA": "itab_idindustria",
        "PRO_NOMETABELA": "itab_tabela",
        "PRO_GRUPO": "itab_grupodesconto",
        "PRO_VALORNORMAL": "itab_precobruto",
        "PRO_VALORPROMO": "itab_precopromo",
        "PRO_IPI": "itab_ipi",
        "PRO_DATATABELA": "itab_datatabela",
        "PRO_VENCPROMOCAO": "itab_datavencimento"
    }
    
    df = df.rename(columns=mapping)
    df.columns = [col.lower() for col in df.columns]
    
    # Filtrar apenas o que o banco aceita
    existing_cols = [col for col in df.columns if col in db_cols]
    df_filtered = df[existing_cols].copy()
    
    # 4. Tratamento de Tipos
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

    # 5. Limpeza da Tabela
    print(f"   🧹 Limpando tabela {SCHEMA}.{TABLE_NAME}...")
    try:
        with engine.connect() as conn:
            conn.execute(text(f"TRUNCATE TABLE {SCHEMA}.{TABLE_NAME} CASCADE"))
            conn.commit()
    except Exception as e:
        print(f"   ⚠️ Erro ao limpar tabela: {e}")

    # 6. Inserção
    try:
        print(f"   ⏳ Inserindo dados (Bulk Mode - Chunk 500)...")
        # Usando chunk menor pela presença da Trigger no banco (cada insert pesa mais)
        df_filtered.to_sql(TABLE_NAME, engine, schema=SCHEMA, if_exists='append', index=False, chunksize=500)
        print(f"   🎉 Importação concluída com sucesso! (A trigger deve ter populado cad_prod)")
    except Exception as e:
        print(f"   ❌ ERRO NA INSERÇÃO: {e}")
        print(f"   Tentando isolar o problema em chunks menores de 50...")
        
        success = 0
        chunk_size = 50
        for i in range(0, len(df_filtered), chunk_size):
            chunk = df_filtered.iloc[i : i + chunk_size]
            try:
                chunk.to_sql(TABLE_NAME, engine, schema=SCHEMA, if_exists='append', index=False)
                success += len(chunk)
                if success % 1000 == 0:
                    print(f"      ... {success}/{len(df_filtered)} registros processados")
            except Exception as chunk_err:
                print(f"   🚨 DIFICULDADE ENCONTRADA no chunk começando em {i}:")
                print(f"      Erro: {str(chunk_err)[:200]}")
                print(f"      Parando importação conforme solicitado.")
                break

if __name__ == "__main__":
    main()
