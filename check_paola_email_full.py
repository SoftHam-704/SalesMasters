
from sqlalchemy import create_engine, text

engine = create_engine('postgresql://webadmin:ytAyO0u043@node254557-salesmaster.sp1.br.saveincloud.net.br:13062/basesales')

def check():
    with engine.connect() as conn:
        print('--- PARAMETROS COMPLETOS PAOLA (ID 29) ---')
        res = conn.execute(text('SELECT par_email, par_emailuser, par_emailpassword, par_emailserver, par_emailporta, par_emailtls, par_emailssl FROM ndsrep.parametros WHERE par_usuario = 29')).fetchone()
        if res:
            print(f'Email: {res[0]}')
            print(f'User SMTP: {res[1]}')
            print(f'Password SMTP: {res[2]}')
            print(f'Server: {res[3]}')
            print(f'Porta: {res[4]}')
            print(f'TLS: {res[5]}')
            print(f'SSL: {res[6]}')
        else:
            print('Parâmetros não encontrados para Paola.')

if __name__ == "__main__":
    check()
