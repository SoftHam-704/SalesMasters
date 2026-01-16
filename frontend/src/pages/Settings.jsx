import React, { useMemo } from 'react';
import { TabControl, Tab } from '../components/settings/TabControl';
import { DatabaseConfig } from '../components/settings/DatabaseConfig';
import { DataMigration } from '../components/settings/DataMigration';
import MasterPanel from '../components/settings/MasterPanel';
import { Database, RefreshCw, ShieldAlert } from 'lucide-react';
import './Settings.css';

const Settings = () => {
    // Verificar se é o usuário master da SoftHam (Hamilton)
    const isMaster = useMemo(() => {
        try {
            // Tenta pegar do objeto user no sessionStorage primeiro
            const userData = JSON.parse(sessionStorage.getItem('user') || '{}');
            const cnpj = userData.cnpj || localStorage.getItem('login_cnpj') || '';
            const rawCnpj = cnpj.replace(/\D/g, '');
            return rawCnpj === '17504829000124';
        } catch (e) {
            return false;
        }
    }, []);

    return (
        <div className="settings-page">
            <TabControl>
                <Tab label="Configuração de Banco de Dados" icon={<Database size={18} />}>
                    <DatabaseConfig />
                </Tab>
                <Tab label="Migração de Dados" icon={<RefreshCw size={18} />}>
                    <DataMigration />
                </Tab>
                {isMaster && (
                    <Tab label="Painel Admin" icon={<ShieldAlert size={18} className="text-red-500" />}>
                        <MasterPanel />
                    </Tab>
                )}
            </TabControl>
        </div>
    );
};

export default Settings;
