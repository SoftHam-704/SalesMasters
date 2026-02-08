
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

# Mapeamento de Arquivos/Tabelas (Apenas EXCEL/CSV menores agora)
IMPORT_CONFIG = {
    "vendedores": {"file": "vendedores.xlsx", "type": "excel"},
    "fornecedores": {"file": "fornecedores.xlsx", "type": "excel"},
    "transportadora": {"file": "transportadora.xlsx", "type": "excel", "special_prefix": "tra_"},
    "clientes": {"file": "clientes.xlsx", "type": "excel", "map": {"CLI_DATAABERTURA": "cli_dtabertura"}},
    "cidades": {"file": "cidades.xlsx", "type": "excel", "map": {"CODIGO": "cid_codigo", "CODMUN": "cid_ibge", "NOME": "cid_nome", "UF": "cid_uf"}},
    "regioes": {"file": "regioes.xlsx", "type": "excel"},
    "area_atu": {"file": "area_atu.xlsx", "type": "excel"},
    "atua_cli": {"file": "atua_cli.xlsx", "type": "excel"},
    "cidades_regioes": {"file": "cidades_regioes.xlsx", "type": "excel"},
    "cli_aniv": {"file": "cli_aniv.csv", "type": "csv"},
    "cli_ind": {"file": "cli_ind.xlsx", "type": "excel"},
    "contato_for": {"file": "contato_for.xlsx", "type": "excel"},
    "grupo_desc": {"file": "grupo_desc.xlsx", "type": "excel"},
    "grupos": {"file": "grupos.xlsx", "type": "excel"},
    "ind_metas": {"file": "ind_metas.xlsx", "type": "excel"},
    "indclientes": {"file": "indclientes.xlsx", "type": "excel"}
}

def get_db_engine():
    connection_string = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    return create_engine(connection_string, pool_pre_ping=True)

def get_table_columns(engine, schema, table):
    try:
        query = f"""
            SELECT column_name, data_type, character_maximum_length
            FROM information_schema.columns 
            WHERE table_schema = '{schema}' AND table_name = '{table}'
        """
        with engine.connect() as conn:
            result = conn.execute(text(query))
            return {row[0].lower(): {'type': row[1], 'max_len': row[2]} for row in result.fetchall()}
    except:
        return {}

def load_data(config):
    filepath = os.path.join(DATA_DIR, config['file'])
    if not os.path.exists(filepath):
        print(f"   ⚠️ Arquivo não encontrado: {config['file']}")
        return None

    try:
        if config['type'] == 'excel':
            return pd.read_excel(filepath)
        elif config['type'] == 'csv':
            # Tentar diferentes delimitadores comuns para CSVs brasileiros
            for sep in [';', ',', '\t']:
                try:
                    df = pd.read_csv(filepath, sep=sep, encoding='latin-1')
                    if len(df.columns) > 1: return df
                except: continue
            return pd.read_csv(filepath, encoding='latin-1')
    except Exception as e:
        print(f"   ❌ Erro ao ler {config['file']}: {e}")
    return None

def clean_data(df, db_cols, config, table_name):
    if 'map' in config:
        df = df.rename(columns=config['map'])
    
    if 'special_prefix' in config:
        mapping = {
            'CODIGO': 'tra_codigo', 'NOME': 'tra_nome', 'ENDERECO': 'tra_endereco',
            'BAIRRO': 'tra_bairro', 'CIDADE': 'tra_cidade', 'CEP': 'tra_cep',
            'UF': 'tra_uf', 'CONTATO': 'tra_contato', 'EMAIL': 'tra_email',
            'TELEFONE1': 'tra_fone', 'CNPJ': 'tra_cgc', 'IEST': 'tra_inscricao'
        }
        df = df.rename(columns=lambda x: mapping.get(x.upper(), x))

    df.columns = [col.lower() for col in df.columns]
    existing_cols = [col for col in df.columns if col in db_cols]
    df_filtered = df[existing_cols].copy()
    
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

    # Drop duplicates for safety
    pk_map = {
        'cidades': 'cid_codigo', 'vendedores': 'ven_codigo', 'fornecedores': 'for_codigo', 
        'transportadora': 'tra_codigo', 'clientes': 'cli_codigo', 'grupos': 'grp_codigo',
        'area_atu': 'are_codigo'
    }
    if table_name in pk_map and pk_map[table_name] in df_filtered.columns:
        df_filtered = df_filtered.drop_duplicates(subset=[pk_map[table_name]])

    return df_filtered

def main():
    engine = get_db_engine()
    print(f"🚀 Finalizando tabelas Excel/CSV para {SCHEMA}...")
    
    for table_name, config in IMPORT_CONFIG.items():
        print(f"\n📦 Tabela: {table_name}")
        
        db_cols = get_table_columns(engine, SCHEMA, table_name)
        if not db_cols:
            print(f"   ❌ Tabela {SCHEMA}.{table_name} não encontrada.")
            continue

        try:
            with engine.connect() as conn:
                conn.execute(text(f"TRUNCATE TABLE {SCHEMA}.{table_name} CASCADE"))
                conn.commit()
            print(f"   🧹 Tabela limpa.")
        except Exception as e:
            print(f"   ⚠️ Erro ao limpar {table_name}: {e}")
            
        df = load_data(config)
        if df is None or df.empty: continue
            
        df_final = clean_data(df, db_cols, config, table_name)
        print(f"   ✅ {len(df_final)} registros preparados.")
        
        try:
            df_final.to_sql(table_name, engine, schema=SCHEMA, if_exists='append', index=False, method='multi', chunksize=100)
            print(f"   🎉 Importação concluída!")
        except Exception as e:
            print(f"   ⚠️ Erro no bulk insert, tentando modo individual...")
            success = 0
            for idx, row in df_final.iterrows():
                try:
                    pd.DataFrame([row]).to_sql(table_name, engine, schema=SCHEMA, if_exists='append', index=False)
                    success += 1
                except: pass
            print(f"   🎉 Finalizado: {success}/{len(df_final)} registros.")

    print("\n🏁 Processo de tabelas menores finalizado!")

if __name__ == "__main__":
    main()
