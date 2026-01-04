"""
Script para testar as 4 funções do dashboard Equipe
"""
import sqlalchemy
from sqlalchemy import create_engine, text
import urllib.parse

# Connection string
password = urllib.parse.quote_plus("@12Pilabo")
DB_URL = f"postgresql://postgres:{password}@localhost:5432/basesales"

engine = create_engine(DB_URL)

def test_function(name, query):
    print(f"\n{'='*60}")
    print(f"🧪 TESTANDO: {name}")
    print(f"{'='*60}")
    try:
        with engine.connect() as conn:
            result = conn.execute(text(query))
            rows = result.fetchall()
            columns = result.keys()
            
            print(f"✅ SUCESSO! Retornou {len(rows)} registros")
            
            if rows:
                print(f"\n📊 Colunas: {list(columns)}")
                print(f"\n📝 Primeiros 2 registros:")
                for i, row in enumerate(rows[:2]):
                    print(f"   {i+1}. {dict(zip(columns, row))}")
            else:
                print("⚠️  Nenhum registro retornado (dados vazios)")
                
    except Exception as e:
        print(f"❌ ERRO: {e}")
        if hasattr(e, 'orig'):
            print(f"   Detalhe: {e.orig}")

if __name__ == "__main__":
    print("\n" + "🔍 TESTE DAS FUNÇÕES DO DASHBOARD EQUIPE ".center(60, "="))
    
    # Teste 1: fn_vendedores_performance
    test_function(
        "fn_vendedores_performance(2025, 1, NULL)",
        "SELECT * FROM fn_vendedores_performance(2025, 1, NULL) LIMIT 5"
    )
    
    # Teste 2: fn_vendedores_clientes_risco
    test_function(
        "fn_vendedores_clientes_risco(NULL, 60)",
        "SELECT * FROM fn_vendedores_clientes_risco(NULL, 60) LIMIT 5"
    )
    
    # Teste 3: fn_vendedores_historico_mensal
    test_function(
        "fn_vendedores_historico_mensal(1, 6)",
        "SELECT * FROM fn_vendedores_historico_mensal(1, 6) LIMIT 5"
    )
    
    # Teste 4: fn_vendedores_interacoes_crm
    test_function(
        "fn_vendedores_interacoes_crm(2025, 1, NULL)",
        "SELECT * FROM fn_vendedores_interacoes_crm(2025, 1, NULL) LIMIT 5"
    )
    
    print("\n" + "="*60)
    print("🏁 TESTES CONCLUÍDOS")
    print("="*60)
