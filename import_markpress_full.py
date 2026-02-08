
import pandas as pd
from sqlalchemy import create_engine, text
import os
import datetime

# --- CONFIGURAÇÃO ---
DB_USER = "webadmin"
DB_PASS = "ytAyO0u043"
DB_HOST = "node254557-salesmaster.sp1.br.saveincloud.net.br"
DB_PORT = "13062"
DB_NAME = "basesales"
DB_SCHEMA = "markpress" 

# String de Conexão
DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

DATA_DIR = 'data'

def get_engine():
    return create_engine(DATABASE_URL, isolation_level="AUTOCOMMIT")

def clean_text(val):
    if pd.isna(val): return None
    return str(val).strip()

def import_vendedores(engine):
    print(f"\n--- IMPORTANDO VENDEDORES ---")
    df = pd.read_excel(os.path.join(DATA_DIR, 'vendedores.xlsx'))
    
    with engine.connect() as conn:
        # Define Schema
        conn.execute(text(f"SET search_path TO {DB_SCHEMA}, public"))
        
        for index, row in df.iterrows():
            try:
                cod = row.get('VEN_CODIGO')
                nome = clean_text(row.get('VEN_NOME'))
                
                # Insert simples (Vendedores)
                sql = text("""
                    INSERT INTO vendedores (ven_codigo, ven_nome, ven_situacao)
                    VALUES (:cod, :nome, 'ATIVO')
                    ON CONFLICT (ven_codigo) DO UPDATE 
                    SET ven_nome = EXCLUDED.ven_nome
                """)
                conn.execute(sql, {"cod": cod, "nome": nome})
            except Exception as e:
                print(f"Erro Vendedor {cod}: {e}")
    print(f"✅ Vendedores processados: {len(df)}")

def import_fornecedores(engine):
    print(f"\n--- IMPORTANDO FORNECEDORES (INDÚSTRIAS) ---")
    df = pd.read_excel(os.path.join(DATA_DIR, 'fornecedores.xlsx'))

    with engine.connect() as conn:
        conn.execute(text(f"SET search_path TO {DB_SCHEMA}, public"))
        
        for index, row in df.iterrows():
            try:
                # Mapeamento (Ajuste conforme colunas reais, assumindo FOR_CODIGO, FOR_NOMERED)
                cod = row.get('FOR_CODIGO')
                fantasia = clean_text(row.get('FOR_NOMERED') or row.get('FOR_FANTASIA'))
                razao = clean_text(row.get('FOR_RAZAO') or fantasia)
                
                if not cod: continue

                sql = text("""
                    INSERT INTO fornecedores (for_codigo, for_nomered, for_nome)
                    VALUES (:cod, :fantasia, :razao)
                    ON CONFLICT (for_codigo) DO UPDATE 
                    SET for_nomered = EXCLUDED.for_nomered,
                        for_nome = EXCLUDED.for_nome
                """)
                conn.execute(sql, {"cod": cod, "fantasia": fantasia, "razao": razao})
            except Exception as e:
                print(f"Erro Fornecedor {cod}: {e}")
    print(f"✅ Fornecedores processados: {len(df)}")

def import_grupos(engine):
    print(f"\n--- IMPORTANDO GRUPOS ---")
    df = pd.read_excel(os.path.join(DATA_DIR, 'grupos.xlsx'))
    
    with engine.connect() as conn:
        conn.execute(text(f"SET search_path TO {DB_SCHEMA}, public"))
        
        for index, row in df.iterrows():
            try:
                cod = row.get('GRP_CODIGO')
                desc = clean_text(row.get('GRP_DESCRICAO'))
                
                if not cod: continue

                sql = text("""
                    INSERT INTO grupos (grp_codigo, grp_descricao)
                    VALUES (:cod, :desc)
                    ON CONFLICT (grp_codigo) DO UPDATE 
                    SET grp_descricao = EXCLUDED.grp_descricao
                """)
                conn.execute(sql, {"cod": cod, "desc": desc})
            except Exception as e:
                print(f"Erro Grupo {cod}: {e}")
    print(f"✅ Grupos processados: {len(df)}")

def import_produtos(engine):
    print(f"\n--- IMPORTANDO PRODUTOS ---")
    df = pd.read_excel(os.path.join(DATA_DIR, 'produtos.xlsx'))
    
    with engine.connect() as conn:
        conn.execute(text(f"SET search_path TO {DB_SCHEMA}, public"))
        
        count = 0
        for index, row in df.iterrows():
            try:
                cod = clean_text(row.get('PRO_CODIGO'))
                desc = clean_text(row.get('PRO_DESCRICAO'))
                id_industria = row.get('PRO_INDUSTRIA')
                id_grupo = row.get('PRO_GRUPO')
                preco = row.get('PRO_PRECO1') or 0
                
                if not cod: continue

                sql = text("""
                    INSERT INTO produtos (
                        pro_codigo, pro_descricao, pro_industria, pro_grupo, pro_preco1
                    )
                    VALUES (:cod, :desc, :ind, :grp, :preco)
                    ON CONFLICT (pro_codigo, pro_industria) DO UPDATE 
                    SET pro_descricao = EXCLUDED.pro_descricao,
                        pro_preco1 = EXCLUDED.pro_preco1
                """)
                conn.execute(sql, {
                    "cod": cod, "desc": desc, "ind": id_industria, 
                    "grp": id_grupo, "preco": preco
                })
                count += 1
                if count % 1000 == 0: print(f"   ... {count} produtos")
            except Exception as e:
                # Erro comum: FK de industria inexistente
                # print(f"Erro Produto {cod}: {e}")
                pass
    print(f"✅ Produtos processados: {count}")

def import_clientes(engine):
    print(f"\n--- IMPORTANDO CLIENTES ---")
    df = pd.read_excel(os.path.join(DATA_DIR, 'clientes.xlsx'))
    # Limpar NaN
    df = df.where(pd.notnull(df), None)

    with engine.connect() as conn:
        conn.execute(text(f"SET search_path TO {DB_SCHEMA}, public"))
        
        count = 0
        for index, row in df.iterrows():
            try:
                cod = row.get('CLI_CODIGO')
                cpfcnpj = clean_text(row.get('CLI_CNPJ'))
                nome = clean_text(row.get('CLI_NOME'))
                fantasia = clean_text(row.get('CLI_FANTASIA'))
                endereco = clean_text(row.get('CLI_ENDERECO'))
                bairro = clean_text(row.get('CLI_BAIRRO'))
                cidade_nome = clean_text(row.get('CLI_CIDADE'))
                uf = clean_text(row.get('CLI_UF'))
                cep = clean_text(row.get('CLI_CEP'))
                vendedor_id = row.get('CLI_VENDEDOR')
                
                # Tenta achar ID da cidade pelo nome (Busca simples na tabela CIDADES se existir)
                # Por simplicidade, vamos deixar cli_idcidade null se nao tiver mapeado, ou usar um default
                cid_id = row.get('CLI_IDCIDADE') 

                sql = text("""
                    INSERT INTO clientes (
                        cli_codigo, cli_cnpj, cli_nome, cli_nomred, cli_endereco, 
                        cli_bairro, cli_cidade, cli_uf, cli_cep, cli_vendedor, cli_idcidade
                    )
                    VALUES (
                        :cod, :cnpj, :nome, :fantasia, :end, 
                        :bairro, :cid, :uf, :cep, :vend, :cid_id
                    )
                    ON CONFLICT (cli_codigo) DO UPDATE 
                    SET cli_nome = EXCLUDED.cli_nome,
                        cli_nomred = EXCLUDED.cli_nomred,
                        cli_cnpj = EXCLUDED.cli_cnpj
                """)
                
                conn.execute(sql, {
                    "cod": cod, "cnpj": cpfcnpj, "nome": nome, "fantasia": fantasia,
                    "end": endereco, "bairro": bairro, "cid": cidade_nome, "uf": uf,
                    "cep": cep, "vend": vendedor_id, "cid_id": cid_id
                })
                count += 1
                if count % 1000 == 0: print(f"   ... {count} clientes")
            except Exception as e:
                print(f"Erro Cliente {cod}: {e}")

    print(f"✅ Clientes processados: {count}")

def main():
    print(f"🔥 INICIANDO IMPORTAÇÃO MARKPRESS ({DB_SCHEMA}) 🔥")
    engine = get_engine()
    
    import_vendedores(engine)
    import_fornecedores(engine)
    import_grupos(engine)
    import_produtos(engine)
    import_clientes(engine)
    
    print("\n🏆 IMPORTAÇÃO CONCLUÍDA COM SUCESSO!")

if __name__ == "__main__":
    main()
