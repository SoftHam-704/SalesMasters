
import pandas as pd
import json
import os
from sqlalchemy import create_engine, text
from datetime import datetime
import math

# Configuração do banco
DB_HOST = "node254557-salesmaster.sp1.br.saveincloud.net.br"
DB_PORT = "13062"
DB_NAME = "basesales"
DB_USER = "webadmin"
DB_PASSWORD = "ytAyO0u043"
SCHEMA = "ndsrep"

DATA_DIR = r"e:\Sistemas_ia\SalesMasters\data"
FILE_NAME = "produtos.json"

def get_db_engine():
    connection_string = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    return create_engine(connection_string, pool_pre_ping=True)

def parse_date(date_str):
    if not date_str or str(date_str).lower() == 'none' or str(date_str).strip() == '':
        return None
    try:
        return datetime.strptime(str(date_str).strip(), '%d.%m.%Y').date()
    except:
        return None

def clean_val(val, default=None):
    if val is None or str(val).lower() == 'none' or (isinstance(val, float) and math.isnan(val)):
        return default
    return val

def main():
    engine = get_db_engine()
    filepath = os.path.join(DATA_DIR, FILE_NAME)
    
    print(f"🚀 Iniciando Importação Inteligente (Upsert Prod + Preço)...")
    
    # 1. Ler e Limpar JSON
    print(f"   📂 Lendo {FILE_NAME}...")
    with open(filepath, 'r', encoding='latin-1') as f:
        content = f.read()
    
    content = content.replace(': False', ': false').replace(': True', ': true').replace(': None', ': null')
    data = json.loads(content)
    records = data['RecordSet']
    total_records = len(records)
    print(f"   📊 Registros identificados: {total_records}")

    # 2. Processar registros
    success_prod = 0
    success_price = 0
    errors = 0
    
    # Vamos processar um a um para garantir que a lógica da procedure funcione (como o backend faz)
    # Para acelerar, podemos usar transações por bloco
    
    chunk_size = 500
    with engine.connect() as conn:
        print(f"   ⏳ Processando registros em blocos de {chunk_size}...")
        
        # Configurar search_path para encontrar as funções e tabelas
        conn.execute(text(f"SET search_path TO {SCHEMA}, public"))
        conn.commit()
        
        for i in range(0, total_records, chunk_size):
            chunk = records[i:i + chunk_size]
            try:
                with conn.begin() as transaction:
                    for r in chunk:
                        try:
                            # 1. Upsert Produto
                            # Adicionando casts explícitos para evitar erro de "function does not exist"
                            sql_prod = text("""
                                SELECT fn_upsert_produto(
                                    CAST(:p_industria AS integer), 
                                    CAST(:p_codprod AS varchar), 
                                    CAST(:p_nome AS varchar), 
                                    CAST(:p_peso AS double precision), 
                                    CAST(:p_embalagem AS integer), 
                                    CAST(:p_grupo AS integer), 
                                    CAST(:p_setor AS varchar), 
                                    CAST(:p_linha AS varchar), 
                                    CAST(:p_ncm AS varchar), 
                                    CAST(:p_origem AS char), 
                                    CAST(:p_aplicacao AS varchar), 
                                    CAST(:p_codbarras AS varchar)
                                )
                            """)
                            
                            # Mapeamento do JSON para parâmetros
                            p_params = {
                                "p_industria": int(r.get("PRO_INDUSTRIA", 0)),
                                "p_codprod": str(r.get("PRO_CODPROD", "")),
                                "p_nome": str(r.get("PRO_NOME", ""))[:100],
                                "p_peso": clean_val(r.get("ITE_PESO"), 0.0),
                                "p_embalagem": clean_val(r.get("PRO_EMBALAGEM")),
                                "p_grupo": clean_val(r.get("PRO_GRUPO")),
                                "p_setor": str(r.get("PRO_SETOR", ""))[:30],
                                "p_linha": str(r.get("PRO_LINHA", ""))[:50] if r.get("PRO_LINHA") else None,
                                "p_ncm": str(r.get("PRO_NCM", ""))[:10] if r.get("PRO_NCM") else None,
                                "p_origem": None, # Não encontrado no JSON
                                "p_aplicacao": str(r.get("PRO_APLICACAO", ""))[:300],
                                "p_codbarras": str(r.get("PRO_CODBARRAS", ""))[:13] if r.get("PRO_CODBARRAS") else None
                            }
                            
                            pro_id = conn.execute(sql_prod, p_params).scalar()
                            success_prod += 1
                            
                            # 2. Upsert Preço
                            sql_price = text("""
                                SELECT fn_upsert_preco(
                                    CAST(:p_pro_id AS integer), 
                                    CAST(:p_industria AS integer), 
                                    CAST(:p_tabela AS varchar), 
                                    CAST(:p_precobruto AS double precision),
                                    CAST(:p_precopromo AS double precision), 
                                    CAST(:p_precoespecial AS double precision), 
                                    CAST(:p_ipi AS double precision), 
                                    CAST(:p_st AS double precision),
                                    CAST(:p_grupodesconto AS integer), 
                                    CAST(:p_descontoadd AS double precision), 
                                    CAST(:p_datatbela AS date),
                                    CAST(:p_datavencimento AS date), 
                                    CAST(:p_prepeso AS double precision)
                                )
                            """)
                            
                            pr_params = {
                                "p_pro_id": pro_id,
                                "p_industria": p_params["p_industria"],
                                "p_tabela": str(r.get("PRO_NOMETABELA", "PADRAO")),
                                "p_precobruto": clean_val(r.get("PRO_VALORNORMAL"), 0.0),
                                "p_precopromo": clean_val(r.get("PRO_VALORPROMO"), 0.0),
                                "p_precoespecial": clean_val(r.get("PRO_PRECO3"), 0.0),
                                "p_ipi": clean_val(r.get("PRO_IPI"), 0.0),
                                "p_st": clean_val(r.get("PRO_ST"), 0.0),
                                "p_grupodesconto": p_params["p_grupo"],
                                "p_descontoadd": clean_val(r.get("PRO_DESCADIC"), 0.0),
                                "p_datatbela": parse_date(r.get("PRO_DATATABELA")),
                                "p_datavencimento": parse_date(r.get("PRO_VENCPROMOCAO")),
                                "p_prepeso": clean_val(r.get("ITE_PREPESO"), 0.0)
                            }
                            
                            conn.execute(sql_price, pr_params)
                            success_price += 1
                            
                        except Exception as row_err:
                            errors += 1
                            if errors < 10:
                                print(f"      ❌ Erro no registro {i+chunk.index(r)}: {row_err}")
                
                    if (i + chunk_size) % 5000 == 0 or (i + chunk_size) >= total_records:
                        print(f"      ... {min(i + chunk_size, total_records)}/{total_records} processados")
            except Exception as block_err:
                print(f"   🚨 Erro no bloco {i}: {block_err}")
                # Transaction handles rollback automatically at 'with' block exit if exception occurs
                # but we catch it here to continue if possible or reported

    print(f"\n🏁 Importação Inteligente Finalizada!")
    print(f"   ✅ Produtos processados (UPSERT): {success_prod}")
    print(f"   ✅ Preços processados (UPSERT): {success_price}")
    print(f"   ❌ Total de falhas: {errors}")

if __name__ == "__main__":
    main()
