import requests
import json

BASE_URL = "http://localhost:8001"

print("=" * 60)
print("TESTANDO INTEGRAÇÃO DO PORTFOLIO ABC")
print("=" * 60)

# 1. Health Check
print("\n1️⃣ Health Check do módulo Portfolio...")
try:
    response = requests.get(f"{BASE_URL}/api/portfolio/health")
    print(f"   Status: {response.status_code}")
    print(f"   Response: {json.dumps(response.json(), indent=2)}")
except Exception as e:
    print(f"   ❌ Erro: {e}")

# 2. Listar Indústrias
print("\n2️⃣ Listando indústrias ativas...")
try:
    response = requests.get(f"{BASE_URL}/api/portfolio/industrias")
    data = response.json()
    print(f"   Status: {response.status_code}")
    print(f"   Total: {data.get('total', 0)} indústrias")
    if data.get('industrias'):
        print(f"   Primeiras 3:")
        for ind in data['industrias'][:3]:
            print(f"     - {ind['codigo']}: {ind['nome']}")
except Exception as e:
    print(f"   ❌ Erro: {e}")

# 3. Análise ABC (exemplo com Ajusa - ID 31, ano 2025)
print("\n3️⃣ Análise ABC - Ajusa (31) - Ano 2025...")
try:
    response = requests.get(
        f"{BASE_URL}/api/portfolio/analyze",
        params={"ano": 2025, "industria": 31}
    )
    data = response.json()
    print(f"   Status: {response.status_code}")
    
    if data.get('success'):
        print(f"   ✅ Análise bem-sucedida!")
        print(f"   Período: {data['data']['periodo']}")
        print(f"   Indústria: {data['data']['industria']['nome']}")
        print(f"   Total produtos: {data['data']['total_produtos_catalogo']}")
        print(f"   Curvas encontradas:")
        for curva in data['data']['curvas']:
            print(f"     - {curva['label']}: {curva['percentual_faturamento']}% do faturamento")
    else:
        print(f"   ⚠️ {data.get('message', 'Sem dados')}")
except Exception as e:
    print(f"   ❌ Erro: {e}")

# 4. Produtos da Curva OFF
print("\n4️⃣ Produtos da Curva OFF (5 primeiros)...")
try:
    response = requests.get(
        f"{BASE_URL}/api/portfolio/produtos/OFF",
        params={"ano": 2025, "industria": 31, "limit": 5}
    )
    data = response.json()
    print(f"   Status: {response.status_code}")
    
    if data.get('success'):
        print(f"   Total: {data['total']} produtos")
        for prod in data.get('produtos', [])[:3]:
            print(f"     - {prod['nome']}: {prod['dias_sem_venda']} dias sem venda")
except Exception as e:
    print(f"   ❌ Erro: {e}")

print("\n" + "=" * 60)
print("TESTE CONCLUÍDO")
print("=" * 60)
