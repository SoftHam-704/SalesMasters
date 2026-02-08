
import pandas as pd
import os

# --- MODO GERADOR DE SQL (OFFLINE) ---
DB_SCHEMA = "markpress"
DATA_DIR = 'data'
OUTPUT_FILE = 'importante_dados_markpress.sql'

def clean_text(val):
    if pd.isna(val): return 'NULL'
    clean = str(val).strip().replace("'", "''") # Escape single quotes
    return f"'{clean}'"

def clean_num(val):
    if pd.isna(val): return 'NULL'
    return str(val)

sql_statements = []

def generate_vendedores():
    print(f"Lendo Vendedores...")
    df = pd.read_excel(os.path.join(DATA_DIR, 'vendedores.xlsx'))
    sql_statements.append(f"-- IMPORTANDO VENDEDORES ({len(df)})")
    
    for _, row in df.iterrows():
        cod = row.get('VEN_CODIGO')
        nome = clean_text(row.get('VEN_NOME'))
        
        sql = f"""
        INSERT INTO {DB_SCHEMA}.vendedores (ven_codigo, ven_nome, ven_situacao)
        VALUES ({cod}, {nome}, 'ATIVO')
        ON CONFLICT (ven_codigo) DO UPDATE SET ven_nome = EXCLUDED.ven_nome;
        """
        sql_statements.append(sql.strip())

def generate_fornecedores():
    print(f"Lendo Fornecedores...")
    df = pd.read_excel(os.path.join(DATA_DIR, 'fornecedores.xlsx'))
    sql_statements.append(f"\n-- IMPORTANDO FORNECEDORES ({len(df)})")
    
    for _, row in df.iterrows():
        cod = row.get('FOR_CODIGO')
        if not cod: continue
        fantasia = clean_text(row.get('FOR_NOMERED') or row.get('FOR_FANTASIA'))
        razao = clean_text(row.get('FOR_RAZAO') or row.get('FOR_NOMERED'))
        
        sql = f"""
        INSERT INTO {DB_SCHEMA}.fornecedores (for_codigo, for_nomered, for_razao, for_situacao)
        VALUES ({cod}, {fantasia}, {razao}, 'ATIVO')
        ON CONFLICT (for_codigo) DO UPDATE SET for_nomered = EXCLUDED.for_nomered;
        """
        sql_statements.append(sql.strip())

def generate_grupos():
    print(f"Lendo Grupos...")
    df = pd.read_excel(os.path.join(DATA_DIR, 'grupos.xlsx'))
    sql_statements.append(f"\n-- IMPORTANDO GRUPOS ({len(df)})")
    
    for _, row in df.iterrows():
        cod = row.get('GRP_CODIGO')
        if not cod: continue
        desc = clean_text(row.get('GRP_DESCRICAO'))
        
        sql = f"""
        INSERT INTO {DB_SCHEMA}.grupos (grp_codigo, grp_descricao)
        VALUES ({cod}, {desc})
        ON CONFLICT (grp_codigo) DO UPDATE SET grp_descricao = EXCLUDED.grp_descricao;
        """
        sql_statements.append(sql.strip())

def generate_produtos():
    print(f"Lendo Produtos...")
    df = pd.read_excel(os.path.join(DATA_DIR, 'produtos.xlsx'))
    sql_statements.append(f"\n-- IMPORTANDO PRODUTOS ({len(df)})")
    
    for _, row in df.iterrows():
        cod = clean_text(row.get('PRO_CODIGO'))
        if cod == 'NULL': continue
        desc = clean_text(row.get('PRO_DESCRICAO'))
        ind = clean_num(row.get('PRO_INDUSTRIA'))
        grp = clean_num(row.get('PRO_GRUPO'))
        preco = clean_num(row.get('PRO_PRECO1') or 0)
        
        sql = f"""
        INSERT INTO {DB_SCHEMA}.produtos (pro_codigo, pro_descricao, pro_industria, pro_grupo, pro_preco1, pro_situacao)
        VALUES ({cod}, {desc}, {ind}, {grp}, {preco}, 'ATIVO')
        ON CONFLICT (pro_codigo, pro_industria) DO UPDATE 
        SET pro_descricao = EXCLUDED.pro_descricao, pro_preco1 = EXCLUDED.pro_preco1;
        """
        sql_statements.append(sql.strip())

def generate_clientes():
    print(f"Lendo Clientes...")
    df = pd.read_excel(os.path.join(DATA_DIR, 'clientes.xlsx'))
    df = df.where(pd.notnull(df), None)
    sql_statements.append(f"\n-- IMPORTANDO CLIENTES ({len(df)})")
    
    for _, row in df.iterrows():
        cod = row.get('CLI_CODIGO')
        cnpj = clean_text(row.get('CLI_CNPJ'))
        nome = clean_text(row.get('CLI_NOME'))
        fantasia = clean_text(row.get('CLI_FANTASIA'))
        endereco = clean_text(row.get('CLI_ENDERECO'))
        bairro = clean_text(row.get('CLI_BAIRRO'))
        cidade = clean_text(row.get('CLI_CIDADE'))
        uf = clean_text(row.get('CLI_UF'))
        cep = clean_text(row.get('CLI_CEP'))
        vend = clean_num(row.get('CLI_VENDEDOR'))
        cid_id = clean_num(row.get('CLI_IDCIDADE'))
        
        sql = f"""
        INSERT INTO {DB_SCHEMA}.clientes (
            cli_codigo, cli_cnpj, cli_nome, cli_nomred, cli_endereco, 
            cli_bairro, cli_cidade, cli_uf, cli_cep, cli_vendedor, cli_idcidade, cli_situacao
        )
        VALUES (
            {cod}, {cnpj}, {nome}, {fantasia}, {endereco}, 
            {bairro}, {cidade}, {uf}, {cep}, {vend}, {cid_id}, 'ATIVO'
        )
        ON CONFLICT (cli_codigo) DO UPDATE 
        SET cli_nome = EXCLUDED.cli_nome, cli_nomred = EXCLUDED.cli_nomred;
        """
        sql_statements.append(sql.strip())

def main():
    try:
        generate_vendedores()
        generate_fornecedores()
        generate_grupos()
        generate_produtos()
        generate_clientes()
        
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            f.write("BEGIN;\n\n")
            f.write("\n".join(sql_statements))
            f.write("\n\nCOMMIT;")
            
        print(f"\n✅ ARQUIVO SQL GERADO: {OUTPUT_FILE}")
        print("Copie o conteúdo deste arquivo e rode no pgAdmin!")
        
    except Exception as e:
        print(f"❌ Erro: {e}")

if __name__ == "__main__":
    main()
