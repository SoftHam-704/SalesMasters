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

# Diretório das planilhas
DATA_DIR = r"e:\Sistemas_ia\SalesMasters\data"

# Apenas as que faltam
FILE_TO_TABLE = {
    "clientes.xlsx": "clientes",
    "itens_ped.xlsx": "itens_ped",
}

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
    
    for filename, table_name in FILE_TO_TABLE.items():
        filepath = os.path.join(DATA_DIR, filename)
        
        if not os.path.exists(filepath):
            print(f"❌ Arquivo não encontrado: {filename}")
            continue
        
        print(f"\n📄 Processando {filename} -> {SCHEMA}.{table_name}...")
        
        try:
            df = pd.read_excel(filepath)
            print(f"   Linhas lidas: {len(df)}")
            
            df.columns = [col.lower() for col in df.columns]
            
            db_columns = get_table_columns(engine, SCHEMA, table_name)
            print(f"   Colunas no banco: {len(db_columns)}")
            
            existing_cols = [col for col in df.columns if col in db_columns]
            df_filtered = df[existing_cols].copy()
            
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
                elif 'date' in db_type:
                    df_filtered[col] = pd.to_datetime(df_filtered[col], errors='coerce')
            
            print(f"   Colunas a importar: {len(df_filtered.columns)}")
            
            # Inserir linha por linha para evitar erros de chunk
            success = 0
            errors = 0
            for idx, row in df_filtered.iterrows():
                try:
                    row_df = pd.DataFrame([row])
                    row_df.to_sql(
                        table_name,
                        engine,
                        schema=SCHEMA,
                        if_exists='append',
                        index=False,
                    )
                    success += 1
                except Exception as e:
                    errors += 1
                    if errors <= 3:
                        print(f"   Erro linha {idx}: {str(e)[:100]}")
                
                if success % 100 == 0:
                    print(f"   Progresso: {success} inseridos...")
            
            print(f"   ✅ {success} registros importados, {errors} erros")
            
        except Exception as e:
            print(f"   ❌ Erro ao processar {filename}: {e}")
    
    print("\n🎉 Importação concluída!")

if __name__ == "__main__":
    main()
