
from sqlalchemy import create_engine, text

# Conexão com o banco do tenant (ndsrep)
engine = create_engine('postgresql://webadmin:ytAyO0u043@node254557-salesmaster.sp1.br.saveincloud.net.br:13062/basesales')

SCHEMA = 'ndsrep'

def seed_crm():
    with engine.connect() as conn:
        trans = conn.begin()
        try:
            print(f"🌱 [CRM] Verificando e inserindo dados iniciais no schema {SCHEMA}...")

            # 0. Criar tabelas se não existirem
            print("   - Criando tabelas CRM se necessário...")
            conn.execute(text(f"""
                CREATE TABLE IF NOT EXISTS {SCHEMA}.crm_tipo_interacao (
                    id SERIAL PRIMARY KEY,
                    descricao VARCHAR(255) NOT NULL,
                    ativo BOOLEAN DEFAULT TRUE
                );
                CREATE TABLE IF NOT EXISTS {SCHEMA}.crm_canal (
                    id SERIAL PRIMARY KEY,
                    descricao VARCHAR(255) NOT NULL,
                    ativo BOOLEAN DEFAULT TRUE
                );
                CREATE TABLE IF NOT EXISTS {SCHEMA}.crm_resultado (
                    id SERIAL PRIMARY KEY,
                    descricao VARCHAR(255) NOT NULL,
                    ativo BOOLEAN DEFAULT TRUE,
                    ordem INTEGER DEFAULT 0
                );
                CREATE TABLE IF NOT EXISTS {SCHEMA}.crm_interacao (
                    interacao_id SERIAL PRIMARY KEY,
                    cli_codigo INTEGER NOT NULL,
                    ven_codigo INTEGER NOT NULL,
                    tipo_interacao_id INTEGER REFERENCES {SCHEMA}.crm_tipo_interacao(id),
                    canal_id INTEGER REFERENCES {SCHEMA}.crm_canal(id),
                    resultado_id INTEGER REFERENCES {SCHEMA}.crm_resultado(id),
                    descricao TEXT,
                    data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                CREATE TABLE IF NOT EXISTS {SCHEMA}.crm_interacao_industria (
                    interacao_id INTEGER REFERENCES {SCHEMA}.crm_interacao(interacao_id) ON DELETE CASCADE,
                    for_codigo INTEGER,
                    PRIMARY KEY (interacao_id, for_codigo)
                );
            """))

            # 1. Tipos de Interação
            print("   - Inserindo Tipos de Interação...")
            tipos = [
                (1, 'Promocional Nacional'),
                (2, 'Promocional Regional'),
                (3, 'Comercial'),
                (4, 'Divergências'),
                (5, 'Prospecção'),
                (6, 'Garantia'),
                (7, 'Treinamento'),
                (8, 'Suporte')
            ]
            for t_id, t_desc in tipos:
                sql = text(f"""
                    INSERT INTO {SCHEMA}.crm_tipo_interacao (id, descricao, ativo)
                    VALUES (:id, :descricao, true)
                    ON CONFLICT (id) DO UPDATE SET descricao = EXCLUDED.descricao, ativo = true;
                """)
                conn.execute(sql, {"id": t_id, "descricao": t_desc})

            # 2. Canais
            print("   - Inserindo Canais...")
            canais = [
                (1, 'Ligação telefônica'),
                (2, 'Visita'),
                (3, 'E-mail'),
                (4, 'Whatsapp/Skype'),
                (5, 'Reunião'),
                (6, 'Outros')
            ]
            for c_id, c_desc in canais:
                sql = text(f"""
                    INSERT INTO {SCHEMA}.crm_canal (id, descricao, ativo)
                    VALUES (:id, :descricao, true)
                    ON CONFLICT (id) DO UPDATE SET descricao = EXCLUDED.descricao, ativo = true;
                """)
                conn.execute(sql, {"id": c_id, "descricao": c_desc})

            # 3. Resultados
            print("   - Inserindo Resultados...")
            resultados = [
                (1, 'Em aberto', 1),
                (2, 'Agendado', 2),
                (3, 'Realizado', 3),
                (4, 'Cancelado', 4),
                (5, 'Positivo', 5),
                (6, 'Negativo', 6)
            ]
            for r_id, r_desc, r_ordem in resultados:
                sql = text(f"""
                    INSERT INTO {SCHEMA}.crm_resultado (id, descricao, ativo, ordem)
                    VALUES (:id, :descricao, true, :ordem)
                    ON CONFLICT (id) DO UPDATE SET descricao = EXCLUDED.descricao, ordem = EXCLUDED.ordem, ativo = true;
                """)
                conn.execute(sql, {"id": r_id, "descricao": r_desc, "ordem": r_ordem})

            trans.commit()
            print("✅ [CRM] Seed concluído com sucesso!")
            
        except Exception as e:
            trans.rollback()
            print(f"❌ [CRM] Erro ao popular dados: {e}")

if __name__ == "__main__":
    seed_crm()
