import pandas as pd
from sqlalchemy import create_engine, text
import os

# Configuração do banco
DB_HOST = "node254557-salesmaster.sp1.br.saveincloud.net.br"
DB_PORT = "13062"
DB_NAME = "basesales"
DB_USER = "webadmin"
DB_PASSWORD = "ytAyO0u043"
SCHEMA = "rimef"

# Arquivo e Tabela
FILENAME = "pedidos.xlsx"
TABLE_NAME = "pedidos"
DATA_DIR = r"e:\Sistemas_ia\SalesMasters\data"

def get_table_columns(engine, schema, table):
    query = f"""
        SELECT column_name, data_type, character_maximum_length
        FROM information_schema.columns 
        WHERE table_schema = '{schema}' AND table_name = '{table}'
    """
    with engine.connect() as conn:
        result = conn.execute(text(query))
        return {row[0]: {'type': row[1], 'max_len': row[2]} for row in result.fetchall()}

def main():
    connection_string = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    engine = create_engine(connection_string)
    
    print(f"Conectando ao banco {DB_NAME} no schema {SCHEMA}...")
    
    filepath = os.path.join(DATA_DIR, FILENAME)
    
    if not os.path.exists(filepath):
        print(f"❌ Arquivo não encontrado: {FILENAME}")
        return
    
    print(f"\n📄 Processando {FILENAME} -> {SCHEMA}.{TABLE_NAME}...")
    
    try:
        df = pd.read_excel(filepath)
        print(f"   Linhas lidas do Excel: {len(df)}")
        
        # Lowercase columns to match DB standard
        df.columns = [col.lower() for col in df.columns]
        
        db_columns = get_table_columns(engine, SCHEMA, TABLE_NAME)
        print(f"   Colunas no banco: {len(db_columns)}")
        
        # Filter only columns that exist in DB
        existing_cols = [col for col in df.columns if col in db_columns]
        df_filtered = df[existing_cols].copy()
        
        print(f"   Colunas mapeadas: {existing_cols}")
        
        # Type conversion based on DB schema
        for col in df_filtered.columns:
            col_info = db_columns.get(col, {})
            db_type = col_info.get('type', '')
            max_len = col_info.get('max_len')
            
            if 'character' in db_type or 'text' in db_type:
                df_filtered[col] = df_filtered[col].fillna('').astype(str)
                df_filtered[col] = df_filtered[col].replace('nan', '')
                if max_len:
                    df_filtered[col] = df_filtered[col].str[:max_len]
            elif 'integer' in db_type:
                df_filtered[col] = pd.to_numeric(df_filtered[col], errors='coerce').fillna(0).astype(int)
            elif 'numeric' in db_type or 'double' in db_type:
                df_filtered[col] = pd.to_numeric(df_filtered[col], errors='coerce').fillna(0.0)
            elif 'date' in db_type or 'timestamp' in db_type:
                df_filtered[col] = pd.to_datetime(df_filtered[col], errors='coerce')

        print(f"   Colunas a importar final: {len(df_filtered.columns)}")
        
        # Insert in chunks
        chunknames = [df_filtered[i:i+1000] for i in range(0, df_filtered.shape[0], 1000)]
        total = 0
        
        for i, chunk in enumerate(chunknames):
            try:
                chunk.to_sql(
                    TABLE_NAME,
                    engine,
                    schema=SCHEMA,
                    if_exists='append',
                    index=False,
                )
                total += len(chunk)
                print(f"   Chunk {i+1}/{len(chunknames)} inserido ({len(chunk)} reg). Total: {total}")
            except Exception as e:
                print(f"   ❌ Erro no chunk {i+1}: {e}")
                # Fallback: row by row if chunk fails
                print("   Tentando linha por linha para este chunk...")
                for idx, row in chunk.iterrows():
                    try:
                        pd.DataFrame([row]).to_sql(TABLE_NAME, engine, schema=SCHEMA, if_exists='append', index=False)
                    except Exception as row_e:
                        print(f"      Erro linha {idx}: {row_e}")

        print(f"   ✅ Processo finalizado! Total importado: {total}")
        
    except Exception as e:
        print(f"   ❌ Erro crítico: {e}")

if __name__ == "__main__":
    main()
