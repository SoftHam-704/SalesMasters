import React from 'react';
import { TabControl, Tab } from '../components/settings/TabControl';
import { DatabaseConfig } from '../components/settings/DatabaseConfig';
import { DataMigration } from '../components/settings/DataMigration';
import { Database, RefreshCw } from 'lucide-react';
import './Settings.css';

const Settings = () => {
    return (
        <div className="settings-page">
            <TabControl>
                <Tab label="Configuração de Banco de Dados" icon={<Database size={18} />}>
                    <DatabaseConfig />
                </Tab>
                <Tab label="Migração de Dados" icon={<RefreshCw size={18} />}>
                    <DataMigration />
                </Tab>
            </TabControl>
        </div>
    );
};

export default Settings;
