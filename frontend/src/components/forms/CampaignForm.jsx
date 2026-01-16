import React, { useState, useEffect } from 'react';
import {
    Target, Calendar, TrendingUp, DollarSign, Package,
    ArrowRight, Save, Calculator, Wallet, Receipt
} from 'lucide-react';
import FormCadPadraoV2 from '../FormCadPadraoV2';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import DbComboBox from '../DbComboBox';
import { toast } from "sonner";
import { NODE_API_URL, getApiUrl } from '../../utils/apiConfig';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

const CampaignForm = ({ data, onClose, onSave }) => {
    // Steps: 1=Config, 2=Simulation, 3=Review
    const [step, setStep] = useState(1);
    const [loadingSim, setLoadingSim] = useState(false);

    const [form, setForm] = useState({
        cmp_descricao: '',
        cmp_cliente_id: null,
        client_name: '',
        cmp_industria_id: null,
        industry_name: '',
        cmp_promotor_id: null,

        // Dates
        cmp_periodo_base_ini: '', // Ex: 2024-01-01
        cmp_periodo_base_fim: '',
        cmp_campanha_ini: '',
        cmp_campanha_fim: '',

        // Target
        cmp_perc_crescimento: 20.00,

        // Simulation Result (Populated by API)
        simulation_data: null,

        cmp_observacao: ''
    });

    // Load initial data if editing (Not implemented fully for EDIT yet, focus on CREATE)
    useEffect(() => {
        if (data) {
            // TODO: Populate for edit
        }
    }, [data]);

    const handleSimulate = async () => {
        if (!form.cmp_cliente_id || !form.cmp_industria_id || !form.cmp_periodo_base_ini || !form.cmp_periodo_base_fim) {
            toast.error("Preencha cliente, indústria e período base.");
            return;
        }

        setLoadingSim(true);
        try {
            const payload = {
                client_id: form.cmp_cliente_id,
                industry_id: form.cmp_industria_id,
                base_start: form.cmp_periodo_base_ini,
                base_end: form.cmp_periodo_base_fim,
                campaign_start: form.cmp_campanha_ini,
                campaign_end: form.cmp_campanha_fim,
                growth_percent: form.cmp_perc_crescimento
            };

            const res = await fetch(getApiUrl(NODE_API_URL, '/api/v2/campaigns/simulate'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const json = await res.json();

            if (json.success) {
                setForm(prev => ({ ...prev, simulation_data: json.data }));
                setStep(2); // Go to results
                toast.success("Simulação calculada com sucesso!");
            } else {
                toast.error(json.message);
            }
        } catch (error) {
            console.error(error);
            toast.error("Erro ao simular campanha.");
        } finally {
            setLoadingSim(false);
        }
    };

    const handleSave = () => {
        onSave(form);
    };

    // --- Chart Config ---
    const chartDataVal = form.simulation_data ? {
        labels: ['Média Diária (Histórico)', 'Meta Diária (Campanha)'],
        datasets: [
            {
                label: 'Valor (R$)',
                data: [
                    form.simulation_data.base.daily_avg_value,
                    form.simulation_data.projection.target_daily_value
                ],
                backgroundColor: ['#94a3b8', '#10b981'], // Gray vs Emerald
                borderRadius: 6,
            }
        ]
    } : null;

    const chartDataQty = form.simulation_data ? {
        labels: ['Média Diária (Qtd)', 'Meta Diária (Qtd)'],
        datasets: [
            {
                label: 'Volume (Un)',
                data: [
                    form.simulation_data.base.daily_avg_qty,
                    form.simulation_data.projection.target_daily_qty
                ],
                backgroundColor: ['#94a3b8', '#3b82f6'], // Gray vs Blue
                borderRadius: 6,
            }
        ]
    } : null;

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: { display: false },
            title: { display: false },
        },
        scales: {
            y: { beginAtZero: true }
        }
    };

    return (
        <FormCadPadraoV2
            title={data ? "Editar Campanha" : "Nova Campanha Promocional"}
            onSave={step === 2 ? handleSave : null} // Only save on last step
            onCancel={onClose}
            saveLabel="Confirmar e Ativar"
        >
            <div className="flex flex-col h-full bg-gray-50/50 p-6 space-y-6 overflow-auto">

                {/* Stepper Visual */}
                <div className="flex items-center justify-center mb-6">
                    <div className={`flex items-center gap-2 ${step >= 1 ? 'text-emerald-700 font-bold' : 'text-gray-400'}`}>
                        <div className="w-8 h-8 rounded-full border-2 border-current flex items-center justify-center">1</div>
                        <span>Configuração</span>
                    </div>
                    <div className="w-16 h-0.5 bg-gray-300 mx-2" />
                    <div className={`flex items-center gap-2 ${step >= 2 ? 'text-emerald-700 font-bold' : 'text-gray-400'}`}>
                        <div className="w-8 h-8 rounded-full border-2 border-current flex items-center justify-center">2</div>
                        <span>Simulação & Metas</span>
                    </div>
                </div>

                {step === 1 && (
                    <div className="max-w-3xl mx-auto w-full space-y-6 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            <div className="col-span-2">
                                <Label>Nome da Campanha</Label>
                                <Input
                                    value={form.cmp_descricao}
                                    onChange={e => setForm({ ...form, cmp_descricao: e.target.value })}
                                    placeholder="Ex: Desafio de Verão 2026 - Coca Cola"
                                    className="font-medium text-lg"
                                />
                            </div>

                            <div className="space-y-4">
                                <Label className="text-emerald-800 font-semibold flex items-center gap-2">
                                    <Target size={16} /> Quem? (Cliente & Indústria)
                                </Label>

                                <div className="space-y-1">
                                    <Label className="text-xs text-gray-500">Cliente</Label>
                                    <DbComboBox
                                        placeholder="Buscar cliente..."
                                        value={form.client_name ? { cli_codigo: form.cmp_cliente_id, cli_fantasia: form.client_name } : null}
                                        onChange={(item) => setForm(prev => ({ ...prev, cmp_cliente_id: item.cli_codigo, client_name: item.cli_fantasia }))}
                                        fetchData={async (search) => {
                                            const res = await fetch(getApiUrl(NODE_API_URL, `/api/items/clientes?search=${search}&limit=10`));
                                            return await res.json();
                                        }}
                                        labelKey="cli_fantasia"
                                        valueKey="cli_codigo"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs text-gray-500">Indústria</Label>
                                    <DbComboBox
                                        placeholder="Buscar indústria..."
                                        value={form.industry_name ? { for_codigo: form.cmp_industria_id, for_nome: form.industry_name } : null}
                                        onChange={(item) => setForm(prev => ({ ...prev, cmp_industria_id: item.for_codigo, industry_name: item.for_nome }))}
                                        fetchData={async (search) => {
                                            // Assuming a route for industries exists or generic items
                                            const res = await fetch(getApiUrl(NODE_API_URL, `/api/items/fornecedores?search=${search}&limit=10`));
                                            return await res.json();
                                        }}
                                        labelKey="for_nome"
                                        valueKey="for_codigo"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <Label className="text-emerald-800 font-semibold flex items-center gap-2">
                                    <Calendar size={16} /> Quando? (Períodos)
                                </Label>

                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <Label className="text-xs text-gray-500">Histórico Início</Label>
                                        <Input type="date" value={form.cmp_periodo_base_ini} onChange={e => setForm({ ...form, cmp_periodo_base_ini: e.target.value })} />
                                    </div>
                                    <div>
                                        <Label className="text-xs text-gray-500">Histórico Fim</Label>
                                        <Input type="date" value={form.cmp_periodo_base_fim} onChange={e => setForm({ ...form, cmp_periodo_base_fim: e.target.value })} />
                                    </div>
                                </div>
                                <div className="text-[10px] text-gray-400 text-center">- vs -</div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <Label className="text-xs text-emerald-600 font-bold">Campanha Início</Label>
                                        <Input type="date" className="border-emerald-200 bg-emerald-50" value={form.cmp_campanha_ini} onChange={e => setForm({ ...form, cmp_campanha_ini: e.target.value })} />
                                    </div>
                                    <div>
                                        <Label className="text-xs text-emerald-600 font-bold">Campanha Fim</Label>
                                        <Input type="date" className="border-emerald-200 bg-emerald-50" value={form.cmp_campanha_fim} onChange={e => setForm({ ...form, cmp_campanha_fim: e.target.value })} />
                                    </div>
                                </div>
                            </div>

                            <div className="col-span-2 pt-4 border-t">
                                <div className="flex items-end gap-4">
                                    <div className="flex-1">
                                        <Label className="text-lg font-bold text-gray-800">Objetivo de Crescimento</Label>
                                        <p className="text-xs text-gray-500">Quanto queremos crescer sobre a média histórica?</p>
                                    </div>
                                    <div className="w-32 relative">
                                        <Input
                                            type="number"
                                            className="text-right pr-8 font-bold text-lg border-emerald-500 text-emerald-700"
                                            value={form.cmp_perc_crescimento}
                                            onChange={e => setForm({ ...form, cmp_perc_crescimento: e.target.value })}
                                        />
                                        <span className="absolute right-3 top-2.5 font-bold text-emerald-700">%</span>
                                    </div>
                                </div>
                            </div>

                        </div>

                        <div className="flex justify-end pt-4">
                            <Button size="lg" onClick={handleSimulate} disabled={loadingSim} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                                {loadingSim ? 'Calculando...' : 'Simular Cenário'} <ArrowRight size={18} />
                            </Button>
                        </div>
                    </div>
                )}

                {step === 2 && form.simulation_data && (
                    <div className="max-w-5xl mx-auto w-full space-y-6">
                        {/* Summary Header */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800">{form.cmp_descricao}</h2>
                                <p className="text-gray-500 font-medium">
                                    Simulação de Crescimento de <span className="text-emerald-600 font-bold">+{form.simulation_data.projection.growth_percent}%</span>
                                </p>
                            </div>
                            <Button variant="outline" onClick={() => setStep(1)}>
                                Ajustar Parâmetros
                            </Button>
                        </div>

                        {/* The Big Numbers */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Valor (R$) Card */}
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-l-4 border-l-emerald-500 space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700"><DollarSign size={20} /></div>
                                    <h3 className="font-bold text-lg text-gray-700">Metas Financeiras</h3>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <span className="text-xs text-gray-500 block uppercase tracking-wider">Média Histórica (Dia)</span>
                                        <span className="text-xl font-bold text-gray-600">
                                            {form.simulation_data.base.daily_avg_value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </span>
                                    </div>
                                    <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
                                        <span className="text-xs text-emerald-600 block uppercase tracking-wider font-bold">Nova Meta (Dia)</span>
                                        <span className="text-2xl font-black text-emerald-600">
                                            {form.simulation_data.projection.target_daily_value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </span>
                                    </div>
                                </div>

                                <div className="h-40 mt-4">
                                    <Bar data={chartDataVal} options={chartOptions} />
                                </div>

                                <div className="pt-2 border-t text-center">
                                    <span className="text-sm text-gray-500">Meta Total da Campanha ({form.simulation_data.projection.days} dias):</span>
                                    <div className="text-xl font-bold text-emerald-700">
                                        {form.simulation_data.projection.target_total_value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </div>
                                </div>
                            </div>

                            {/* Qtd (Vol) Card */}
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-l-4 border-l-blue-500 space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="p-2 bg-blue-100 rounded-lg text-blue-700"><Package size={20} /></div>
                                    <h3 className="font-bold text-lg text-gray-700">Metas de Volume</h3>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <span className="text-xs text-gray-500 block uppercase tracking-wider">Média Histórica (Dia)</span>
                                        <span className="text-xl font-bold text-gray-600">
                                            {form.simulation_data.base.daily_avg_qty.toFixed(2)} und
                                        </span>
                                    </div>
                                    <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                                        <span className="text-xs text-blue-600 block uppercase tracking-wider font-bold">Nova Meta (Dia)</span>
                                        <span className="text-2xl font-black text-blue-600">
                                            {form.simulation_data.projection.target_daily_qty.toFixed(2)} und
                                        </span>
                                    </div>
                                </div>

                                <div className="h-40 mt-4">
                                    <Bar data={chartDataQty} options={chartOptions} />
                                </div>

                                <div className="pt-2 border-t text-center">
                                    <span className="text-sm text-gray-500">Meta Total da Campanha ({form.simulation_data.projection.days} dias):</span>
                                    <div className="text-xl font-bold text-blue-700">
                                        {form.simulation_data.projection.target_total_qty.toFixed(0)} unidades
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Obs & Confirm */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <Label className="mb-2 block font-semibold text-gray-700">Observações Estratégicas</Label>
                            <Textarea
                                placeholder="Registre aqui detalhes da negociação ou foco específico desta ação..."
                                value={form.cmp_observacao}
                                onChange={e => setForm({ ...form, cmp_observacao: e.target.value })}
                                className="min-h-[100px]"
                            />
                        </div>

                        <div className="flex justify-end gap-4 pb-10">
                            <Button variant="outline" size="lg" onClick={() => setStep(1)}>Voltar</Button>
                            <Button size="lg" onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 px-8">
                                <Save size={18} /> Confirmar e Criar Campanha
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </FormCadPadraoV2>
    );
};

export default CampaignForm;
