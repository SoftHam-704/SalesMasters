/**
 * SCRIPT DE IMPORTAÇÃO CRM - NDSREP
 * Origem: data/interacoes.json (Exportado do Firebird)
 * Destino: PostgreSQL Schema ndsrep
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    host: 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    port: 13062,
    database: 'basesales',
    user: 'webadmin',
    password: 'ytAyO0u043',
    max: 5
});

async function runImport() {
    console.log('🚀 Iniciando Migração CRM para NDSREP...');

    try {
        // 1. Carregar JSON
        const dataPath = path.join(__dirname, '..', 'data', 'interacoes.json');
        if (!fs.existsSync(dataPath)) {
            console.error('❌ Arquivo data/interacoes.json não encontrado!');
            return;
        }

        const rawData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
        const records = rawData.RecordSet;
        console.log(`📦 ${records.length} registros carregados.`);

        // 2. Buscar IDs de Lookup (Configuração Fixa)
        console.log('🔍 Mapeando IDs de tipos, canais e resultados...');

        const canalRes = await pool.query("SELECT id FROM ndsrep.crm_canal WHERE descricao ILIKE '%telefone%' OR descricao ILIKE '%ligação%' LIMIT 1");
        const tipoRes = await pool.query("SELECT id FROM ndsrep.crm_tipo_interacao WHERE descricao ILIKE '%Comercial%' LIMIT 1");
        const statusRes = await pool.query("SELECT id FROM ndsrep.crm_resultado WHERE descricao ILIKE '%Realizado%' LIMIT 1");

        const FIXED_CANAL = canalRes.rows[0]?.id || 1;
        const FIXED_TIPO = tipoRes.rows[0]?.id || 3; // Padrão comercial
        const FIXED_RESULTADO = statusRes.rows[0]?.id || 3; // Padrão realizado

        // 3. Mapear Indústrias para busca no texto
        const indRes = await pool.query("SELECT for_codigo, for_nomered FROM ndsrep.fornecedores");
        const industriesMap = indRes.rows.map(i => ({
            id: i.for_codigo,
            name: i.for_nomered.toUpperCase()
        }));

        // 4. Mapear Vendedores (por nome)
        const venRes = await pool.query("SELECT ven_codigo, ven_nome FROM ndsrep.vendedores");
        const vendorsMapping = {};
        venRes.rows.forEach(v => {
            const firstName = v.ven_nome.split(' ')[0].toUpperCase();
            vendorsMapping[firstName] = v.ven_codigo;
        });

        console.log('⚙️ Configurações prontas. Iniciando inserção...');

        let successCount = 0;
        let skipCount = 0;

        for (const rec of records) {
            try {
                // Faxina de Texto
                let descricao = (rec.AGE_ASSUNTO || '')
                    .replace(/[\r\n]+/g, ' ') // Remove quebras de linha
                    .replace(/\s\s+/g, ' ')   // Remove espaços duplos
                    .trim();

                // Tenta identificar o vendedor pelo campo AGE_OPERADOR
                const opName = (rec.AGE_OPERADOR || '').split(' ')[0].toUpperCase();
                const ven_codigo = vendorsMapping[opName] || 1; // Default para o primeiro se não achar

                // Formatar Data (Firebird DD.MM.YYYY para ISO)
                const [d, m, y] = rec.AGE_DATA.split('.');
                const data_interacao = `${y}-${m}-${d} ${rec.AGE_HORARIO || '00:00'}:00`;

                // Inserir registro principal
                const insertRes = await pool.query(`
                    INSERT INTO ndsrep.crm_interacao 
                    (cli_codigo, ven_codigo, tipo_interacao_id, canal_id, resultado_id, data_interacao, descricao)
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                    RETURNING interacao_id
                `, [
                    rec.AGE_CLIENTE,
                    ven_codigo,
                    FIXED_TIPO,
                    FIXED_CANAL,
                    FIXED_RESULTADO,
                    data_interacao,
                    descricao
                ]);

                const interacaoId = insertRes.rows[0].interacao_id;

                // --- Lógica de Múltiplas Indústrias ---
                // Verifica quais indústrias aparecem na descrição
                const matchedIndustries = industriesMap.filter(ind =>
                    descricao.toUpperCase().includes(ind.name)
                );

                // Adiciona a indústria que já veio no campo fixo se não estiver no match
                if (rec.AGE_INDUSTRIA && !matchedIndustries.find(i => i.id === rec.AGE_INDUSTRIA)) {
                    const originalInd = industriesMap.find(i => i.id === rec.AGE_INDUSTRIA);
                    if (originalInd) matchedIndustries.push(originalInd);
                }

                // Gravar na tabela de ligação
                for (const ind of matchedIndustries) {
                    await pool.query(`
                        INSERT INTO ndsrep.crm_interacao_industria (interacao_id, for_codigo)
                        VALUES ($1, $2)
                        ON CONFLICT DO NOTHING
                    `, [interacaoId, ind.id]);
                }

                successCount++;
                if (successCount % 100 === 0) process.stdout.write(`.`);

            } catch (err) {
                // console.error(`\n⚠️ Erro no registro ${rec.CLI_NOMRED}:`, err.message);
                skipCount++;
            }
        }

        console.log(`\n\n✅ FIM DA MIGRAÇÃO!`);
        console.log(`📊 Sucesso: ${successCount}`);
        console.log(`⚠️ Ignorados/Erros: ${skipCount}`);

    } catch (err) {
        console.error('❌ Erro fatal:', err.message);
    } finally {
        await pool.end();
    }
}

runImport();
