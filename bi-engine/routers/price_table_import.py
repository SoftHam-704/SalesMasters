"""
API Endpoints para Importação Inteligente de Tabelas de Preço com IA
"""
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
import pandas as pd
import io
import json
from openai import OpenAI
import os
import httpx
import math
from psycopg2.extras import execute_batch

router = APIRouter(prefix="/api/price-table", tags=["price-table-import"])

# Cliente OpenAI
client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'), http_client=httpx.Client(timeout=60.0))


@router.post("/get-sheets")
async def get_sheets(file: UploadFile = File(...)):
    """
    Retorna lista de sheets (abas) do arquivo Excel para seleção do usuário.
    """
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="Arquivo deve ser .xlsx ou .xls")
    
    try:
        file_content = await file.read()
        xl = pd.ExcelFile(io.BytesIO(file_content), engine='openpyxl')
        
        sheets = []
        for sheet_name in xl.sheet_names:
            # Tentar obter o número total de linhas de forma eficiente
            sheet = xl.book[sheet_name]
            total_rows = sheet.max_row
            total_cols = sheet.max_column
            
            sheets.append({
                "name": sheet_name,
                "rows": total_rows,
                "cols": total_cols
            })
        
        return JSONResponse(content={
            "success": True,
            "sheets": sheets
        })
        
    except Exception as e:
        print(f"Erro ao ler sheets: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


def extract_sheet_sample(file_content: bytes, sheet_name: str, max_rows: int = 25):
    """Extrai amostra de uma sheet específica para análise pela IA"""
    try:
        xl = pd.ExcelFile(io.BytesIO(file_content), engine='openpyxl')
        df = pd.read_excel(xl, sheet_name=sheet_name, header=None, nrows=max_rows)
        
        # Converter para texto legível
        sample_text = df.to_string(max_colwidth=50)
        
        return {
            "sample_text": sample_text,
            "total_cols": len(df.columns)
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro ao ler sheet: {str(e)}")


def count_data_rows(file_content: bytes, sheet_name: str, data_start_row: int):
    """Conta total de linhas de dados na sheet"""
    try:
        xl = pd.ExcelFile(io.BytesIO(file_content), engine='openpyxl')
        df = pd.read_excel(xl, sheet_name=sheet_name, header=None)
        
        # Contar linhas após o data_start_row que não estão vazias
        data_df = df.iloc[data_start_row:]
        # Mais leniente: pelo menos 1 coluna preenchida (será validado depois por código/preço)
        non_empty = data_df.dropna(how='all')
        
        return len(non_empty)
    except:
        return 0


def analyze_with_ai(sample_text: str, total_cols: int):
    """Usa OpenAI para analisar e mapear as colunas dinamicamente"""
    
    prompt = f"""
Analise esta planilha de preços e identifique a estrutura.

PLANILHA ({total_cols} colunas):
{sample_text}

OBJETIVO: Identificar em qual coluna (índice 0-based) está cada campo:

CAMPOS OBRIGATÓRIOS:
- codigo: Código do produto (formatos: 060.480, 10070300, etc). Procure por "Código", "Cód", "Ref"
- descricao: Nome/descrição do produto. É sempre a coluna com TEXTO LONGO. Procure por "Descrição", "Desc", "Produto", "Nome"
- preco: Preço em R$. Procure valores numéricos como 255.83, R$ 100,00. Colunas: "Preço", "Preço Cheio", "Preço(R$)", "Vlr"

CAMPOS OPCIONAIS:
- ipi: Percentual IPI (ex: 3.25, 12%). Coluna: "IPI", "IPI%"
- aplicacao: Veículos compatíveis. Coluna: "Aplicação", "Veículo"
- referencia_original: Número original. Coluna: "N.Original", "Original"

DICAS IMPORTANTES:
1. O cabeçalho geralmente está entre as linhas 8-12 (após logo da empresa)
2. A coluna DESCRIÇÃO é a que tem os textos mais longos (nomes de produtos)
3. A coluna PREÇO tem valores numéricos monetários
4. Ignore colunas vazias ou com poucos dados

RETORNE JSON:
{{
    "header_row": 10,
    "data_start_row": 11,
    "mapping": {{
        "codigo": 5,
        "descricao": 8,
        "preco": 15,
        "ipi": 14,
        "aplicacao": 11,
        "referencia_original": 13
    }},
    "detected_columns": ["col0", "col1", "Código", "Descrição COMPLETA", "Preço(R$)", ...]
}}
"""

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "Você analisa planilhas de preços. Retorne APENAS JSON válido."
                },
                {"role": "user", "content": prompt}
            ],
            temperature=0.1,
            response_format={"type": "json_object"}
        )
        
        result = json.loads(response.choices[0].message.content)
        return result
        
    except Exception as e:
        print(f"Erro OpenAI: {e}")
        return {
            "header_row": 0,
            "data_start_row": 1,
            "mapping": {
                "codigo": 0,
                "descricao": 1,
                "preco": 2
            },
            "detected_columns": [f"Coluna {i+1}" for i in range(total_cols)],
            "error": str(e)
        }


def extract_preview(file_content: bytes, sheet_name: str, mapping: dict, header_row: int, data_start_row: int, max_rows: int = 10):
    """Extrai preview dos dados usando o mapeamento da IA"""
    try:
        xl = pd.ExcelFile(io.BytesIO(file_content), engine='openpyxl')
        df = pd.read_excel(xl, sheet_name=sheet_name, header=None)
        
        # Pegar linhas de dados
        data_rows = df.iloc[data_start_row:data_start_row + max_rows]
        
        preview = []
        for _, row in data_rows.iterrows():
            item = {}
            for field, col_idx in mapping.items():
                if col_idx is not None and isinstance(col_idx, int) and col_idx < len(row):
                    value = row.iloc[col_idx]
                    # Converter para tipo serializável
                    if pd.isna(value):
                        item[field] = None
                    elif isinstance(value, (int, float)):
                        item[field] = value
                    else:
                        item[field] = str(value)
            
            if item.get('codigo') or item.get('descricao'):
                preview.append(item)
        
        return preview
        
    except Exception as e:
        print(f"Erro ao extrair preview: {e}")
        return []


def extract_column_headers(file_content: bytes, sheet_name: str, header_row: int):
    """Extrai os nomes das colunas da linha de cabeçalho"""
    try:
        xl = pd.ExcelFile(io.BytesIO(file_content), engine='openpyxl')
        df = pd.read_excel(xl, sheet_name=sheet_name, header=None)
        
        if header_row < len(df):
            headers = df.iloc[header_row].tolist()
            # Limpar e converter para string
            return [str(h).strip()[:50] if pd.notna(h) else f"Coluna {i+1}" for i, h in enumerate(headers)]
        
        return [f"Coluna {i+1}" for i in range(len(df.columns))]
        
    except Exception as e:
        print(f"Erro ao extrair cabeçalhos: {e}")
        return []


@router.post("/analyze-sheet")
async def analyze_sheet(
    file: UploadFile = File(...),
    sheet_name: str = Form(...)
):
    """
    Analisa uma sheet específica usando IA para identificar a estrutura e mapear colunas.
    """
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="Arquivo deve ser .xlsx ou .xls")
    
    try:
        file_content = await file.read()
        
        # Extrair amostra da sheet selecionada
        sample_info = extract_sheet_sample(file_content, sheet_name)
        
        # Analisar com IA
        ai_analysis = analyze_with_ai(sample_info["sample_text"], sample_info["total_cols"])
        
        # Extrair cabeçalhos reais
        header_row = ai_analysis.get("header_row", 0)
        data_start_row = ai_analysis.get("data_start_row", header_row + 1)
        
        detected_columns = extract_column_headers(file_content, sheet_name, header_row)
        
        # Substituir detected_columns do AI pelos reais
        ai_analysis["detected_columns"] = detected_columns
        
        # Extrair preview dos dados
        mapping = ai_analysis.get("mapping", {})
        preview = extract_preview(file_content, sheet_name, mapping, header_row, data_start_row)
        
        # Contar total de linhas
        total_rows = count_data_rows(file_content, sheet_name, data_start_row)
        
        return JSONResponse(content={
            "success": True,
            "data": {
                "sheet_name": sheet_name,
                "header_row": header_row,
                "data_start_row": data_start_row,
                "mapping": mapping,
                "detected_columns": detected_columns,
                "preview": preview,
                "total_rows": total_rows,
                "industria": ai_analysis.get("industria_detectada"),
                "tabela": ai_analysis.get("tabela_detectada")
            }
        })
        
    except Exception as e:
        print(f"Erro na análise: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/import")
async def import_price_table(
    file: UploadFile = File(...),
    sheet_name: str = Form(...),
    mapping: str = Form(...),
    header_row: int = Form(0),
    data_start_row: int = Form(1),
    import_mode: str = Form("new"),  # 'new' or 'update'
    table_name: str = Form(None),  # Para modo 'new'
    existing_table: str = Form(None),  # Para modo 'update'
    industry_id: str = Form(...)
):
    """
    Importa os dados da planilha para o banco de dados usando as functions PostgreSQL.
    """
    from services.database import get_current_engine
    from datetime import datetime
    
    def get_db_connection():
        return get_current_engine().raw_connection()
    
    try:
        mapping_dict = json.loads(mapping)
        file_content = await file.read()
        
        xl = pd.ExcelFile(io.BytesIO(file_content), engine='openpyxl')
        df = pd.read_excel(xl, sheet_name=sheet_name, header=None)
        
        # Pegar apenas linhas de dados
        data_df = df.iloc[data_start_row:]
        # Filtro inicial leniente: remove apenas linhas totalmente vazias
        non_empty = data_df.dropna(how='all')
        
        target_table = table_name if import_mode == 'new' else existing_table
        
        print(f"=== INICIANDO IMPORTAÇÃO ===")
        print(f"Modo: {import_mode}")
        print(f"Tabela: {target_table}")
        print(f"Indústria: {industry_id}")
        print(f"Total de linhas: {len(non_empty)}")
        
        # Conectar ao banco
        conn = get_db_connection()
        cur = conn.cursor()
        
        imported_count = 0
        updated_count = 0
        errors = []
        prices_to_batch = [] # Lista para batch de preços
        
        try:
            for idx, row in non_empty.iterrows():
                try:
                    # Extrair valores do mapeamento
                    def get_value(field):
                        col_idx = mapping_dict.get(field)
                        if col_idx is not None and col_idx < len(row):
                            val = row.iloc[col_idx]
                            return val if pd.notna(val) else None
                        return None
                    
                    codigo = get_value('codigo')
                    descricao = get_value('descricao')
                    preco = get_value('preco')
                    preco_promocao = get_value('preco_promocao')
                    preco_especial = get_value('preco_especial')
                    ipi = get_value('ipi')
                    st = get_value('st')
                    aplicacao = get_value('aplicacao')
                    referencia_original = get_value('referencia_original')
                    conversao = get_value('conversao')
                    
                    # Validação mínima
                    if not codigo or not preco:
                        continue
                    
                    # Limpar código (remover espaços)
                    codigo = str(codigo).strip()
                    
                    # Converter preço para float
                    try:
                        preco_float = float(str(preco).replace(',', '.').replace('R$', '').strip())
                    except:
                        preco_float = 0.0
                    
                    # Converter outros preços
                    def parse_price(val):
                        if val is None:
                            return None
                        try:
                            return float(str(val).replace(',', '.').replace('R$', '').strip())
                        except:
                            return None
                    
                    preco_promo_float = parse_price(preco_promocao)
                    preco_esp_float = parse_price(preco_especial)
                    
                    # Converter percentuais
                    def parse_percent(val):
                        if val is None:
                            return None
                        try:
                            return float(str(val).replace(',', '.').replace('%', '').strip())
                        except:
                            return None
                    
                    ipi_float = parse_percent(ipi)
                    st_float = parse_percent(st)
                    


                    # --- LÓGICA DE PRESERVAÇÃO INTEGRAL (SMART MERGE V2) ---
                    # REGRA DE OURO: Importação parcial NUNCA deve apagar dados existentes.
                    # Se o Excel traz valor -> Atualiza.
                    # Se o Excel NÃO traz (ou é inválido) -> Mantém o que está no banco.

                    # 1. Busca dados atuais do Produto
                    # Normaliza o código para garantir match mesmo com formatação diferente
                    import re
                    def normalize_code(val):
                        # Remove tudo que não é dígito e remove zeros à esquerda
                        clean = re.sub(r'\D', '', str(val)).strip()
                        return clean.lstrip('0')

                    normalized_codigo = normalize_code(codigo)
                    cur.execute(
                        """SELECT pro_id, pro_nome, pro_peso, pro_embalagem, pro_grupo, pro_setor, 
                                  pro_linha, pro_ncm, pro_origem, pro_aplicacao, pro_codbarras, pro_codprod 
                           FROM cad_prod 
                           WHERE pro_industria = %s 
                           AND LTRIM(REPLACE(TRIM(pro_codprod), '.', ''), '0') = %s""",
                        (int(industry_id), normalized_codigo)
                    )
                    existing_prod = cur.fetchone()
                    
                    # Se encontrou, garantimos que vamos usar o CÓDIGO EXATO que já está no banco
                    # para evitar que o PostgreSQL crie um duplicado por causa de pontos/zeros
                    target_codprod = existing_prod[11] if existing_prod else codigo

                    # Função Helper para decidir valor final (Imita a lógica iif da procedure)
                    def resolve_val(new_val, old_db_idx, existing_row, default=None, is_numeric=False):
                        # Identifica se o valor do Excel é verdadeiramente vazio
                        is_empty = False
                        if new_val is None: is_empty = True
                        elif str(new_val).strip() == "": is_empty = True
                        elif str(new_val).lower() == "nan": is_empty = True
                        else:
                            try:
                                if isinstance(new_val, (float, int)) and math.isnan(new_val): is_empty = True
                            except: pass
                        
                        if not is_empty:
                             return new_val
                        
                        # Se estiver vazio na planilha, resgata o valor do Banco de Dados
                        if existing_row and old_db_idx < len(existing_row):
                            val_db = existing_row[old_db_idx]
                            if val_db is not None:
                                return float(val_db) if is_numeric else val_db
                        return default

                    # Extraindo valores brutos do Excel (podem ser None)
                    excel_nome = get_value('descricao')
                    excel_peso = get_value('peso')
                    excel_emb = get_value('embalagem')
                    excel_grupo = get_value('grupo')
                    excel_setor = get_value('setor')
                    excel_linha = get_value('linha')
                    excel_ncm = get_value('ncm')
                    excel_origem = get_value('origem')
                    excel_aplicacao = get_value('aplicacao')
                    excel_codbarras = get_value('codbarras')

                    # Resolvendo valores finais do Produto usando o Helper Blindado
                    final_nome = resolve_val(excel_nome, 1, existing_prod, default=codigo)
                    final_peso = resolve_val(excel_peso, 2, existing_prod, is_numeric=True)
                    final_emb = resolve_val(excel_emb, 3, existing_prod, is_numeric=True)
                    final_grupo = resolve_val(excel_grupo, 4, existing_prod, is_numeric=True)
                    final_setor = resolve_val(excel_setor, 5, existing_prod)
                    final_linha = resolve_val(excel_linha, 6, existing_prod)
                    final_ncm = resolve_val(excel_ncm, 7, existing_prod)
                    final_origem = resolve_val(excel_origem, 8, existing_prod)
                    final_aplicacao = resolve_val(excel_aplicacao, 9, existing_prod)
                    final_codbarras = resolve_val(excel_codbarras, 10, existing_prod)

                    # Truncar textos longos para evitar erro
                    if final_nome: final_nome = str(final_nome)[:200]
                    if final_aplicacao: final_aplicacao = str(final_aplicacao)[:500]


                    # 1. UPSERT produto em cad_prod via fn_upsert_produto
                    cur.execute(
                        """SELECT fn_upsert_produto(%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) as pro_id""",
                        (
                            int(industry_id),    # p_industria
                            target_codprod,      # p_codprod (USAMOS O CÓDIGO QUE ESTÁ NO BANCO SE EXISTIR)
                            final_nome,          # p_nome
                            final_peso,          # p_peso
                            final_emb,           # p_embalagem
                            final_grupo,         # p_grupo
                            final_setor,         # p_setor
                            final_linha,         # p_linha
                            final_ncm,           # p_ncm
                            final_origem,        # p_origem
                            final_aplicacao,     # p_aplicacao
                            final_codbarras      # p_codbarras
                        )
                    )
                    
                    result = cur.fetchone()
                    pro_id = result[0] if result else (existing_prod[0] if existing_prod else None)
                    
                    if not pro_id:
                        errors.append(f"Linha {idx}: Não foi possível criar/identificar produto {codigo}")
                        continue
                    
                    # 2. Busca dados atuais de PREÇOS (se existir)
                    cur.execute(
                        """SELECT itab_precopromo, itab_precoespecial, itab_ipi, itab_st, itab_precobruto,
                                  itab_grupodesconto, itab_descontoadd, itab_datavencimento
                           FROM cad_tabelaspre 
                           WHERE itab_idprod = %s AND itab_idindustria = %s AND itab_tabela = %s""",
                        (pro_id, int(industry_id), target_table)
                    )
                    existing_price = cur.fetchone() # [0..7]

                    # Valores do Excel (podem ser None se não mapeados)
                    # Nota: preco_float, preco_promo_float, etc já foram parseados lá em cima, mas podem ser 0.0 se falhou o parse
                    # Precisamos diferenciar "0.0 válido" de "não informado" -> Melhor usar o get_value cru para saber se veio da planilha
                    
                    raw_preco = get_value('preco')
                    raw_promo = get_value('preco_promocao')
                    raw_especial = get_value('preco_especial')
                    raw_ipi = get_value('ipi')
                    raw_st = get_value('st')

                    # Helper para preço e percentual
                    def resolve_num(raw_val, parsed_val, old_db_val):
                        # Se raw_val existe (foi mapeado e tem conteúdo), usa o parsed_val (mesmo que seja 0)
                        # Tratar NaN (pandas) como ausente
                        is_nan = False
                        try:
                            if isinstance(raw_val, float) and math.isnan(raw_val):
                                is_nan = True
                        except:
                            pass

                        if raw_val is not None and str(raw_val).strip() != "" and not is_nan and str(raw_val).lower() != "nan":
                             return parsed_val
                        # Se não veio na planilha (ou é NaN), preserva o banco
                        if old_db_val is not None and str(old_db_val).strip() != "":
                            try:
                                return float(old_db_val)
                            except:
                                return 0.0
                        return 0.0

                    final_bruto = resolve_num(raw_preco, preco_float, existing_price[4] if existing_price else None)
                    final_promo = resolve_num(raw_promo, preco_promo_float, existing_price[0] if existing_price else None)
                    final_especial = resolve_num(raw_especial, preco_esp_float, existing_price[1] if existing_price else None)
                    final_ipi = resolve_num(raw_ipi, ipi_float, existing_price[2] if existing_price else None)
                    final_st = resolve_num(raw_st, st_float, existing_price[3] if existing_price else None)
                    
                    # Resolve campos opcionais preservando do banco se vierem vazios
                    final_grupodesconto = resolve_num(get_value('grupodesconto'), None, existing_price[5] if existing_price else None)
                    final_descontoadd = resolve_num(get_value('descontoadd'), None, existing_price[6] if existing_price else None)
                    final_datavencimento = resolve_num(get_value('datavencimento'), None, existing_price[7] if existing_price else None)
                    # Coletar para batch de preços
                    prices_to_batch.append((
                        pro_id,               # p_idprod
                        int(industry_id),     # p_industria
                        target_table,         # p_tabela
                        final_bruto,          # p_precobruto (preservado)
                        final_promo,          # p_precopromo
                        final_especial,       # p_precoespecial
                        final_ipi,            # p_ipi
                        final_st,             # p_st
                        final_grupodesconto,  # p_grupodesconto (preservado)
                        final_descontoadd,    # p_descontoadd (preservado)
                        datetime.now().strftime('%Y-%m-%d'),  # p_datatabela
                        final_datavencimento   # p_datavencimento (preservado)
                    ))
                    
                    imported_count += 1
                    
                    # Executa batch a cada 500 registros para velocidade e segurança
                    if len(prices_to_batch) >= 500:
                        execute_batch(cur,
                            """SELECT fn_upsert_preco(%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                            prices_to_batch)
                        conn.commit()
                        print(f"  -> Batch de {len(prices_to_batch)} importados (Total: {imported_count})")
                        prices_to_batch.clear()
                        
                except Exception as row_error:
                    errors.append(f"Linha {idx}: {str(row_error)}")
                    if len(errors) > 50:
                        break  # Para de erros excessivos
            
            # Batch final para o que restou
            if prices_to_batch:
                execute_batch(cur,
                    """SELECT fn_upsert_preco(%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                    prices_to_batch)
                conn.commit()
                print(f"  -> Último batch de {len(prices_to_batch)} importados.")
            
            print(f"=== IMPORTAÇÃO CONCLUÍDA ===")
            print(f"Total importados: {imported_count}")
            print(f"Erros: {len(errors)}")
            
        except Exception as db_error:
            conn.rollback()
            raise db_error
        finally:
            cur.close()
            conn.close()
        
        return JSONResponse(content={
            "success": True,
            "message": f"Importação concluída com sucesso!",
            "total_imported": imported_count,
            "import_mode": import_mode,
            "table_name": target_table,
            "errors": errors[:10]  # Máximo 10 erros
        })
        
    except Exception as e:
        print(f"Erro na importação: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# Manter endpoint antigo para compatibilidade
@router.post("/analyze")
async def analyze_price_table(file: UploadFile = File(...)):
    """
    Endpoint legado - redireciona para o novo fluxo.
    """
    return JSONResponse(content={
        "success": False,
        "message": "Use o novo endpoint /api/price-table/get-sheets seguido de /api/price-table/analyze-sheet"
    })
