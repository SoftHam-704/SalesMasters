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
            # Ler apenas primeiras linhas para estimar tamanho
            df = pd.read_excel(xl, sheet_name=sheet_name, header=None, nrows=100)
            sheets.append({
                "name": sheet_name,
                "rows": len(df),  # Estimativa
                "cols": len(df.columns)
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
        non_empty = data_df.dropna(thresh=3)
        
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
        non_empty = data_df.dropna(thresh=3)
        
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
                    
                    # 1. UPSERT produto em cad_prod via fn_upsert_produto
                    cur.execute(
                        """SELECT fn_upsert_produto(%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) as pro_id""",
                        (
                            int(industry_id),    # p_industria
                            codigo,              # p_codprod
                            str(descricao)[:200] if descricao else codigo,  # p_nome
                            None,                # p_peso
                            None,                # p_embalagem
                            None,                # p_grupo
                            None,                # p_setor
                            None,                # p_linha
                            None,                # p_ncm
                            None,                # p_origem
                            str(aplicacao)[:500] if aplicacao else None,  # p_aplicacao
                            None                 # p_codbarras
                        )
                    )
                    
                    result = cur.fetchone()
                    pro_id = result[0] if result else None
                    
                    if not pro_id:
                        errors.append(f"Linha {idx}: Não foi possível criar produto {codigo}")
                        continue
                    
                    # 2. UPSERT preço em cad_tabelaspre via fn_upsert_preco
                    cur.execute(
                        """SELECT fn_upsert_preco(%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                        (
                            pro_id,               # p_idprod
                            int(industry_id),     # p_industria
                            target_table,         # p_tabela
                            preco_float,          # p_precobruto
                            preco_promo_float,    # p_precopromo
                            preco_esp_float,      # p_precoespecial
                            ipi_float,            # p_ipi
                            st_float,             # p_st
                            None,                 # p_grupodesconto
                            None,                 # p_descontoadd
                            datetime.now().strftime('%Y-%m-%d'),  # p_datatabela
                            None                  # p_datavencimento
                        )
                    )
                    
                    imported_count += 1
                    
                    # Commit a cada 100 registros para não sobrecarregar
                    if imported_count % 100 == 0:
                        conn.commit()
                        print(f"  -> Importados: {imported_count}")
                        
                except Exception as row_error:
                    errors.append(f"Linha {idx}: {str(row_error)}")
                    if len(errors) > 50:
                        break  # Para de erros excessivos
            
            # Commit final
            conn.commit()
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
