import pandas as pd
from typing import Dict, List, Any

# --- DAX-like Measures ---

# Mapeamento dos meses
MONTH_COLS = ["met_jan", "met_fev", "met_mar", "met_abr", "met_mai", "met_jun", 
              "met_jul", "met_ago", "met_set", "met_out", "met_nov", "met_dez"]

def measure_faturamento_total(df_faturamento: pd.DataFrame) -> float:
    """CALCULATE(SUM(Faturamento))"""
    if df_faturamento.empty:
        return 0.0
    return float(df_faturamento['v_faturamento'].sum())

def measure_metas_totais(df_metas: pd.DataFrame) -> float:
    """CALCULATE(SUM(Metas))"""
    if df_metas.empty:
        return 0.0
    # Soma todas as colunas de metas
    total = 0.0
    for col in MONTH_COLS:
        if col in df_metas.columns:
            val = df_metas[col].sum()
            total += float(val) if val is not None and pd.notna(val) else 0.0
    return total

def measure_comparativo_mensal(df_fat: pd.DataFrame, df_metas: pd.DataFrame) -> List[Dict[str, Any]]:
    """
    Tabela calculada para gráfico de comparação mensal.
    Combina Faturamento Real vs Metas mês a mês.
    """
    # Converter Faturamento para Dicionário {Mês: Valor}
    fat_dict = {}
    if not df_fat.empty:
        fat_dict = {int(row['n_mes']): float(row['v_faturamento']) for _, row in df_fat.iterrows()}
    
    # Preparar Dados de Metas (uma única linha com colunas met_jan..met_dez)
    metas_row = df_metas.iloc[0] if not df_metas.empty else {}
    
    result = []
    labels = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
    
    for i in range(1, 13):
        label = labels[i-1]
        
        # Valor Meta (colunas met_jan, met_fev, ...)
        meta_key = MONTH_COLS[i-1]
        val_meta = 0.0
        if meta_key in metas_row:
            val = metas_row[meta_key]
            val_meta = float(val) if val is not None and pd.notna(val) else 0.0
        
        # Valor Faturamento
        val_fat = fat_dict.get(i, 0.0)
        
        result.append({
            "name": label,
            "faturamento": round(val_fat / 1000000, 2), # Visualização em Milhões
            "meta": round(val_meta / 1000000, 2),      # Visualização em Milhões
            "faturamento_real": round(val_fat, 2),
            "meta_real": round(val_meta, 2),
            "delta": round(val_fat - val_meta, 2),
            "performance": round((val_fat / val_meta * 100) if val_meta > 0 else 0, 1)
        })
        
    return result

def measure_evolucao_mensal(df_fat: pd.DataFrame, metrica: str = 'valor') -> List[Dict[str, Any]]:
    """
    Calcula a evolução mensal (MoM) para o gráfico de passos.
    Retorna valor atual, valor anterior e percentual de crescimento.
    """
    if df_fat.empty:
        return []
        
    # Converter para dicionário {Mês: Valor} dependendo da métrica
    col_name = 'v_faturamento' if metrica == 'valor' else 'q_quantidade'
    data_dict = {int(row['n_mes']): float(row[col_name]) for _, row in df_fat.iterrows()}
    
    result = []
    labels = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
    
    previous_value = 0.0
    
    for i in range(1, 13):
        current_value = data_dict.get(i, 0.0)
        
        # Calcular Delta % (MoM)
        delta_percent = 0.0
        if previous_value > 0:
            delta_percent = ((current_value - previous_value) / previous_value) * 100
        elif previous_value == 0 and current_value > 0:
            delta_percent = 100.0 # Crescimento infinito (0 -> X)
            
        result.append({
            "name": labels[i-1],
            "mes_num": i,
            "valor": current_value,
            "valor_anterior": previous_value,
            "delta_percent": round(delta_percent, 1),
            "tendencia": "up" if delta_percent >= 0 else "down"
        })
        
        previous_value = current_value
        
    return result
