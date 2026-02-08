const { Pool } = require('pg');
require('dotenv').config({ path: 'e:/Sistemas_ia/SalesMasters/backend/.env' });

async function checkCascade() {
    const pool = new Pool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: 'basesales',
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD
    });

    try {
        const schema = 'repsoma';
        const table = 'itens_ped';

        console.log(`--- Verificando Foreign Keys em ${schema}.${table} ---`);

        // Query to get FK details including update/delete rules
        const query = `
            SELECT
                tc.constraint_name, 
                kcu.column_name, 
                ccu.table_schema AS foreign_table_schema,
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name,
                rc.update_rule,
                rc.delete_rule
            FROM 
                information_schema.table_constraints AS tc 
                JOIN information_schema.key_column_usage AS kcu
                  ON tc.constraint_name = kcu.constraint_name
                  AND tc.table_schema = kcu.table_schema
                JOIN information_schema.constraint_column_usage AS ccu
                  ON ccu.constraint_name = tc.constraint_name
                  AND ccu.table_schema = tc.table_schema
                JOIN information_schema.referential_constraints AS rc
                  ON rc.constraint_name = tc.constraint_name
                  AND rc.constraint_schema = tc.constraint_schema
            WHERE 
                tc.constraint_type = 'FOREIGN KEY' 
                AND tc.table_schema = $1
                AND tc.table_name = $2;
        `;

        const res = await pool.query(query, [schema, table]);

        if (res.rows.length === 0) {
            console.log(`⚠️  Nenhuma Foreign Key encontrada em ${schema}.${table}.`);
            console.log('   Isso significa que NÃO há exclusão em cascata configurada via banco de dados.');
        } else {
            res.rows.forEach(fk => {
                console.log(`\n🔑 Constraint: ${fk.constraint_name}`);
                console.log(`   Coluna Local: ${fk.column_name}`);
                console.log(`   Referencia: ${fk.foreign_table_schema}.${fk.foreign_table_name} (${fk.foreign_column_name})`);
                console.log(`   DELETE Rule: ${fk.delete_rule}`);

                if (fk.delete_rule === 'CASCADE') {
                    console.log('   ✅ CASCADE ATIVO: Excluir o pai excluirá os filhos.');
                } else {
                    console.log('   ❌ CASCADE INATIVO (Provavelmente RESTRICT ou NO ACTION).');
                }
            });
        }

    } catch (err) {
        console.error('❌ Erro:', err.message);
    } finally {
        await pool.end();
    }
}

checkCascade();
