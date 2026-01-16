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

# Mapeamento de arquivos para tabelas
FILE_TO_TABLE = {
    "clientes.xlsx": "clientes",
    "Industrias.xlsx": "fornecedores",
    "itens_ped.xlsx": "itens_ped",
    "pedidos.xlsx": "pedidos",
    "transportadora.xlsx": "transportadora",
    "vendedores.xlsx": "vendedores"
}

def get_table_columns(engine, schema, table):
    """Obter colunas existentes na tabela do banco"""
    query = f"""
        SELECT column_name, data_type, character_maximum_length
        FROM information_schema.columns 
        WHERE table_schema = '{schema}' AND table_name = '{table}'
    """
    with engine.connect() as conn:
        result = conn.execute(text(query))
        return {row[0]: {'type': row[1], 'max_len': row[2]} for row in result.fetchall()}

def main():
    # Criar engine de conexão
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
            # Ler a planilha
            df = pd.read_excel(filepath)
            print(f"   Linhas lidas: {len(df)}")
            
            # Converter nomes das colunas para minúsculas
            df.columns = [col.lower() for col in df.columns]
            
            # Obter colunas existentes na tabela com seus tipos
            db_columns = get_table_columns(engine, SCHEMA, table_name)
            print(f"   Colunas no banco: {len(db_columns)}")
            
            # Filtrar apenas colunas que existem no banco
            existing_cols = [col for col in df.columns if col in db_columns]
            df_filtered = df[existing_cols].copy()
            
            # Converter e truncar dados para caber no banco
            for col in df_filtered.columns:
                col_info = db_columns.get(col, {})
                db_type = col_info.get('type', '')
                max_len = col_info.get('max_len')
                
                # Tratar valores NaN
                if 'character' in db_type or 'text' in db_type:
                    df_filtered[col] = df_filtered[col].fillna('').astype(str)
                    df_filtered[col] = df_filtered[col].replace('nan', '')
                    # Truncar strings se necessário
                    if max_len:
                        df_filtered[col] = df_filtered[col].str[:max_len]
                elif 'integer' in db_type:
                    df_filtered[col] = pd.to_numeric(df_filtered[col], errors='coerce').fillna(0).astype(int)
                elif 'numeric' in db_type or 'double' in db_type:
                    df_filtered[col] = pd.to_numeric(df_filtered[col], errors='coerce').fillna(0.0)
                elif 'date' in db_type:
                    df_filtered[col] = pd.to_datetime(df_filtered[col], errors='coerce')
            
            print(f"   Colunas a importar: {len(df_filtered.columns)}")
            
            # Inserir dados
            df_filtered.to_sql(
                table_name,
                engine,
                schema=SCHEMA,
                if_exists='append',
                index=False,
                method='multi',
                chunksize=200
            )
            print(f"   ✅ {len(df_filtered)} registros importados para {SCHEMA}.{table_name}")
            
        except Exception as e:
            print(f"   ❌ Erro ao processar {filename}: {e}")
    
    print("\n🎉 Importação concluída!")

if __name__ == "__main__":
    main()
