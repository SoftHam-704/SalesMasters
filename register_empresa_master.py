
from sqlalchemy import create_engine, text
from datetime import datetime, date

engine = create_engine('postgresql://webadmin:ytAyO0u043@node254557-salesmaster.sp1.br.saveincloud.net.br:13062/salesmasters_master')

# Dados da empresa (conforme imagem e solicitação)
empresa = {
    "cnpj": "18976342000107",
    "razao_social": "FABÍOLA NANTES DE SOUZA",
    "nome_fantasia": "NDS REPRESENTAÇÕES",
    "telefone": "(67) 3222-7322",
    "status": "ATIVO",
    "data_adesao": datetime.now(),
    "data_vencimento": date(2099, 12, 31),
    "valor_mensalidade": 0,
    "limite_usuarios": 10,
    "db_host": "node254557-salesmaster.sp1.br.saveincloud.net.br",
    "db_nome": "basesales",
    "db_usuario": "webadmin",
    "db_senha": "ytAyO0u043",
    "db_porta": 13062,
    "versao_liberada": "1.0.0",
    "limite_sessoes": 10,
    "alerta_percentual": 80,
    "bloqueio_ativo": "N",
    "db_schema": "ndsrep",
    "ios_enabled": "S" # Liberado conforme solicitado
}

try:
    with engine.connect() as conn:
        # Verifica se já existe
        check_sql = text("SELECT id FROM public.empresas WHERE cnpj = :cnpj")
        existing_id = conn.execute(check_sql, {"cnpj": empresa["cnpj"]}).scalar()
        
        if existing_id:
            # Update
            update_sql = text("""
                UPDATE public.empresas SET
                    razao_social = :razao_social,
                    nome_fantasia = :nome_fantasia,
                    telefone = :telefone,
                    status = :status,
                    db_schema = :db_schema,
                    ios_enabled = :ios_enabled,
                    db_host = :db_host,
                    db_nome = :db_nome,
                    db_usuario = :db_usuario,
                    db_senha = :db_senha,
                    db_porta = :db_porta
                WHERE id = :id
            """)
            empresa["id"] = existing_id
            conn.execute(update_sql, empresa)
            print(f"✅ Empresa atualizada com sucesso! ID: {existing_id}")
        else:
            # Insert
            insert_sql = text("""
                INSERT INTO public.empresas (
                    cnpj, razao_social, nome_fantasia, telefone, status, 
                    data_adesao, data_vencimento, valor_mensalidade, limite_usuarios, 
                    db_host, db_nome, db_usuario, db_senha, db_porta, 
                    versao_liberada, limite_sessoes, alerta_percentual, bloqueio_ativo, 
                    db_schema, ios_enabled
                ) VALUES (
                    :cnpj, :razao_social, :nome_fantasia, :telefone, :status, 
                    :data_adesao, :data_vencimento, :valor_mensalidade, :limite_usuarios, 
                    :db_host, :db_nome, :db_usuario, :db_senha, :db_porta, 
                    :versao_liberada, :limite_sessoes, :alerta_percentual, :bloqueio_ativo, 
                    :db_schema, :ios_enabled
                ) RETURNING id;
            """)
            new_id = conn.execute(insert_sql, empresa).scalar()
            print(f"✅ Empresa cadastrada com sucesso! ID: {new_id}")
            
        conn.commit()
        print(f"   CNPJ: {empresa['cnpj']}")
        print(f"   Razão: {empresa['razao_social']}")
        print(f"   iOS Liberado: {empresa['ios_enabled']}")
except Exception as e:
    print(f"❌ Erro ao cadastrar/atualizar empresa: {e}")
