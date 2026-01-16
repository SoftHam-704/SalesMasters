# 🗺️ SETORES E ITINERÁRIOS - PLANO DE IMPLEMENTAÇÃO

**Criado em:** 2026-01-16  
**Status:** Planejamento  
**Objetivo:** Dividir cidades grandes em setores e criar roteiros de visitas otimizados

---

## 📊 CONTEXTO DO PROBLEMA

### Situação Atual:
- Cidades são tratadas como uma unidade única
- Cidades grandes (Goiânia, São Paulo, etc.) têm clientes espalhados por diversos bairros
- Não há como planejar rotas de visita por proximidade geográfica
- Vendedor perde tempo cruzando a cidade sem lógica de roteiro

### Solução Proposta:
1. **Setores/Bairros**: Subdividir cidades em setores
2. **Associação Cliente-Setor**: Vincular cada cliente/filial a um setor
3. **Itinerários**: Criar roteiros de visita agrupando clientes por setor
4. **Visualização**: Mostrar clientes da rota em mapa ou lista ordenada

---

## 🗃️ MODELO DE DADOS

### Nova Tabela: `setores`
```sql
CREATE TABLE setores (
    set_codigo SERIAL PRIMARY KEY,
    set_descricao VARCHAR(100) NOT NULL,     -- Ex: "Setor Bueno", "Zona Sul"
    set_cidade_id INTEGER REFERENCES cidades(cid_codigo),
    set_ordem INTEGER DEFAULT 0,              -- Ordem sugerida de visita
    set_cor VARCHAR(7) DEFAULT '#3B82F6',     -- Cor para visualização no mapa
    set_observacao TEXT,
    set_ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_setores_cidade ON setores(set_cidade_id);
```

### Nova Tabela: `itinerarios` (Roteiros de Visita)
```sql
CREATE TABLE itinerarios (
    iti_codigo SERIAL PRIMARY KEY,
    iti_descricao VARCHAR(100) NOT NULL,      -- Ex: "Rota Segunda-Feira"
    iti_vendedor_id INTEGER REFERENCES vendedores(vend_id),
    iti_dia_semana INTEGER,                   -- 1=Seg, 2=Ter, ..., 7=Dom (opcional)
    iti_regiao_id INTEGER REFERENCES regioes(reg_codigo),
    iti_ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Nova Tabela: `itinerarios_setores` (Setores do Itinerário)
```sql
CREATE TABLE itinerarios_setores (
    its_id SERIAL PRIMARY KEY,
    its_itinerario_id INTEGER REFERENCES itinerarios(iti_codigo) ON DELETE CASCADE,
    its_setor_id INTEGER REFERENCES setores(set_codigo),
    its_ordem INTEGER DEFAULT 0               -- Ordem de visita dos setores
);

CREATE UNIQUE INDEX idx_its_unique ON itinerarios_setores(its_itinerario_id, its_setor_id);
```

### Alteração na Tabela `clientes`
```sql
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS cli_setor_id INTEGER REFERENCES setores(set_codigo);
CREATE INDEX idx_clientes_setor ON clientes(cli_setor_id);
```

---

## 🔄 FLUXO DE USO

### 1. Cadastro de Setores
```
Cidade: Goiânia
  └── Setor Bueno
  └── Setor Marista
  └── Setor Oeste
  └── Jardim Goiás
  └── Setor Sul
  └── Centro
```

### 2. Associação Cliente → Setor
- No cadastro do cliente, além de escolher a cidade, escolhe o setor
- Campo `cli_setor_id` referencia o setor

### 3. Criação de Itinerários
```
Itinerário: "Rota Segunda - Goiânia Sul"
Vendedor: João Silva
Dia: Segunda-feira
Setores na ordem:
  1. Setor Bueno
  2. Setor Marista
  3. Jardim Goiás
```

### 4. Consulta de Clientes na Rota
```sql
SELECT c.cli_codigo, c.cli_nome, c.cli_endereco, s.set_descricao
FROM clientes c
INNER JOIN setores s ON c.cli_setor_id = s.set_codigo
INNER JOIN itinerarios_setores its ON s.set_codigo = its.its_setor_id
WHERE its.its_itinerario_id = :itinerario_id
ORDER BY its.its_ordem, c.cli_nome;
```

---

## 🎨 TELAS DO FRONTEND

### Tela 1: Cadastro de Setores (`frmSetores.jsx`)
- Grid com lista de setores
- Filtro por cidade
- Criar/Editar/Excluir setor
- Campos: Descrição, Cidade, Ordem, Cor, Observação

### Tela 2: Cadastro de Itinerários (`frmItinerarios.jsx`)
- Grid com lista de itinerários
- Criar novo itinerário
- Associar setores ao itinerário (drag-and-drop para ordenar)
- Visualizar clientes do itinerário

### Tela 3: Visualização da Rota (`RotaView.jsx`)
- Selecionar itinerário
- Lista de clientes ordenados por setor
- Informações de contato e endereço
- Opção de exportar para PDF/imprimir
- (Futuro) Integração com Google Maps

### Alteração: Cadastro de Cliente (`ClientForm.jsx`)
- Adicionar campo "Setor" após o campo "Cidade"
- Combobox filtrado pela cidade selecionada

---

## 📋 ENDPOINTS DA API

### Setores
```
GET    /api/v2/sectors                    # Lista todos os setores
GET    /api/v2/sectors?city_id=123        # Setores de uma cidade
GET    /api/v2/sectors/:id                # Detalhe do setor
POST   /api/v2/sectors                    # Criar setor
PUT    /api/v2/sectors/:id                # Atualizar setor
DELETE /api/v2/sectors/:id                # Excluir setor
```

### Itinerários
```
GET    /api/v2/itineraries                # Lista todos
GET    /api/v2/itineraries/:id            # Detalhe com setores
POST   /api/v2/itineraries                # Criar
PUT    /api/v2/itineraries/:id            # Atualizar
DELETE /api/v2/itineraries/:id            # Excluir

GET    /api/v2/itineraries/:id/sectors    # Setores do itinerário
POST   /api/v2/itineraries/:id/sectors    # Adicionar setor
PUT    /api/v2/itineraries/:id/sectors    # Reordenar setores
DELETE /api/v2/itineraries/:id/sectors/:sectorId  # Remover setor

GET    /api/v2/itineraries/:id/clients    # Clientes da rota (agregado)
```

---

## 🚀 FASES DE IMPLEMENTAÇÃO

### Fase 1: Fundação (2-3 horas)
- [ ] Criar tabelas no banco de dados
- [ ] Criar endpoints básicos de setores
- [ ] Testar CRUD de setores

### Fase 2: Integração com Cliente (2 horas)
- [ ] Adicionar campo setor no ClientForm
- [ ] Endpoint para buscar setores por cidade
- [ ] Salvar setor no cliente

### Fase 3: Itinerários (3-4 horas)
- [ ] Criar endpoints de itinerários
- [ ] Tela de cadastro de itinerários
- [ ] Associação de setores com ordenação

### Fase 4: Visualização da Rota (2-3 horas)
- [ ] Tela de visualização de rota
- [ ] Lista de clientes ordenados
- [ ] Exportação para PDF

### Fase 5: Melhorias (Futuro)
- [ ] Integração com Google Maps
- [ ] Cálculo de distância entre clientes
- [ ] Sugestão automática de ordem de visita
- [ ] App mobile com navegação GPS

---

## 💡 IDEIAS AVANÇADAS

### Geolocalização Automática
- Usar API do Google para obter latitude/longitude do endereço
- Agrupar clientes automaticamente por proximidade
- Sugerir setores com base em clusters geográficos

### Frequência de Visita
- Adicionar campo `cli_frequencia_visita` (semanal, quinzenal, mensal)
- Gerar itinerário automático baseado na frequência

### Check-in de Visita
- Vendedor marca "visitado" no app
- Registra horário e localização
- Relatório de cumprimento do itinerário

---

## 📊 EXEMPLO VISUAL

```
┌─────────────────────────────────────────────────────────────────┐
│  🗺️ ITINERÁRIO: Rota Segunda - Goiânia Sul                      │
│  Vendedor: João Silva | 15 clientes | 5 setores                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📍 1. SETOR BUENO (3 clientes)                                 │
│     ├── Supermercado Mais Você      📞 (62) 3333-1111           │
│     ├── Farmácia Bueno Center       📞 (62) 3333-2222           │
│     └── Padaria Pão Quente          📞 (62) 3333-3333           │
│                                                                 │
│  📍 2. SETOR MARISTA (4 clientes)                               │
│     ├── Mercado São José            📞 (62) 3333-4444           │
│     ├── Loja de Conveniência XYZ    📞 (62) 3333-5555           │
│     ├── Restaurante Sabor & Cia     📞 (62) 3333-6666           │
│     └── Hotel Marista Plaza         📞 (62) 3333-7777           │
│                                                                 │
│  📍 3. JARDIM GOIÁS (5 clientes)                                │
│     └── ...                                                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

**Responsável:** Equipe de Desenvolvimento  
**Última atualização:** 2026-01-16
