import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Construction, CheckSquare } from 'lucide-react';
import { toast } from 'sonner';

const ProjectModeToggle = () => {

    const handleActivateProjectMode = () => {
        // Read current tenant config
        const currentConfigStr = sessionStorage.getItem('tenantConfig');
        const currentConfig = currentConfigStr ? JSON.parse(currentConfigStr) : {};

        // Update RAMOATV to 'Projetos' temporarily
        const newConfig = { ...currentConfig, ramoatv: 'Projetos' };
        sessionStorage.setItem('tenantConfig', JSON.stringify(newConfig));

        toast.success("Modo Projetos ATIVADO! A página será recarregada.");
        setTimeout(() => window.location.reload(), 1500);
    };

    const handleDeactivateProjectMode = () => {
        // Read current tenant config
        const currentConfigStr = sessionStorage.getItem('tenantConfig');
        const currentConfig = currentConfigStr ? JSON.parse(currentConfigStr) : {};

        // Revert RAMOATV to 'Autopeças'
        const newConfig = { ...currentConfig, ramoatv: 'Autopeças' };
        sessionStorage.setItem('tenantConfig', JSON.stringify(newConfig));

        toast.info("Modo Projetos DESATIVADO! A página será recarregada.");
        setTimeout(() => window.location.reload(), 1500);
    };

    return (
        <div className="p-8 max-w-2xl mx-auto space-y-6">
            <Card className="border-indigo-100 shadow-md">
                <CardHeader className="bg-indigo-50/50 pb-4">
                    <CardTitle className="text-xl font-bold text-indigo-900 flex items-center gap-2">
                        <Construction className="h-6 w-6 text-indigo-600" />
                        Teste de Ambiente: Projetos (Bertolini)
                    </CardTitle>
                    <CardDescription>
                        Esta ferramenta permite alternar temporariamente o tipo de negócio do tenant atual para testar
                        as funcionalidades exclusivas do módulo de Projetos e Engenharia.
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                    <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg text-sm text-yellow-800 mb-4">
                        <strong>Atenção:</strong> Esta alteração afeta apenas a sua sessão atual (navegador).
                        Nenhuma alteração é feita no banco de dados da empresa. Ao fazer logout, a configuração voltará ao normal.
                    </div>

                    <div className="flex gap-4">
                        <Button
                            onClick={handleActivateProjectMode}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white flex-1 h-12 text-md font-bold"
                        >
                            <Construction className="mr-2 h-5 w-5" />
                            ATIVAR MODO PROJETOS
                        </Button>

                        <Button
                            onClick={handleDeactivateProjectMode}
                            variant="outline"
                            className="border-slate-300 text-slate-700 hover:bg-slate-50 flex-1 h-12 text-md font-bold"
                        >
                            <CheckSquare className="mr-2 h-5 w-5" />
                            Voltar para Autopeças
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default ProjectModeToggle;
