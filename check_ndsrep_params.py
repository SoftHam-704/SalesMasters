
from sqlalchemy import create_engine, text

engine = create_engine('postgresql://webadmin:ytAyO0u043@node254557-salesmaster.sp1.br.saveincloud.net.br:13062/basesales')

def check():
    with engine.connect() as conn:
        print('--- USUARIOS EM NDSREP ---')
        res = conn.execute(text('SELECT codigo, nome, usuario FROM ndsrep.user_nomes')).fetchall()
        for row in res:
            print(f'ID: {row[0]}, Nome: {row[1]}, Usuario: {row[2]}')
            
        print('\n--- PARAMETROS EM NDSREP ---')
        res = conn.execute(text('SELECT par_id, par_usuario, par_email, par_emailuser, par_emailserver FROM ndsrep.parametros')).fetchall()
        if not res:
            print('Nenhum registro em ndsrep.parametros')
        for row in res:
            print(f'Par ID: {row[0]}, User ID: {row[1]}, Email: {row[2]}, SMTP User: {row[3]}, Server: {row[4]}')

if __name__ == "__main__":
    check()
