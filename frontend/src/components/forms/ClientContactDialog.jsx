import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, X } from "lucide-react";
import { toast } from "sonner";
import { NODE_API_URL } from "../../utils/apiConfig";

export function ClientContactDialog({ open, onOpenChange, contact, clientId, onSave }) {
    const [formData, setFormData] = useState({
        ani_nome: '',
        ani_funcao: '',
        ani_fone: '',
        ani_email: '',
        ani_diaaniv: '',
        ani_mes: '',
        ani_timequetorce: '',
        ani_esportepreferido: '',
        ani_hobby: '',
        ani_obs: '',
        gid: ''
    });

    useEffect(() => {
        if (contact) {
            setFormData({
                ani_nome: contact.ani_nome || '',
                ani_funcao: contact.ani_funcao || '',
                ani_fone: contact.ani_fone || '',
                ani_email: contact.ani_email || '',
                ani_diaaniv: contact.ani_diaaniv || '',
                ani_mes: contact.ani_mes || '',
                ani_timequetorce: contact.ani_timequetorce || '',
                ani_esportepreferido: contact.ani_esportepreferido || '',
                ani_hobby: contact.ani_hobby || '',
                ani_obs: contact.ani_obs || '',
                gid: contact.gid || ''
            });
        } else {
            setFormData({
                ani_nome: '',
                ani_funcao: '',
                ani_fone: '',
                ani_email: '',
                ani_diaaniv: '',
                ani_mes: '',
                ani_timequetorce: '',
                ani_esportepreferido: '',
                ani_hobby: '',
                ani_obs: '',
                gid: ''
            });
        }
    }, [contact]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        if (!formData.ani_nome) {
            toast.error("Nome é obrigatório");
            return;
        }

        try {
            const isNew = !contact?.ani_lancto;
            const url = isNew
                ? `${NODE_API_URL}/api/clients/${clientId}/contacts`
                : `${NODE_API_URL}/api/clients/${clientId}/contacts/${contact.ani_lancto}`;

            const method = isNew ? 'POST' : 'PUT';

            const payload = {
                ...formData,
                // Ensure numbers for date fields
                ani_diaaniv: formData.ani_diaaniv ? parseInt(formData.ani_diaaniv) : null,
                ani_mes: formData.ani_mes ? parseInt(formData.ani_mes) : null
            };

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || "Erro ao salvar contato");
            }

            const result = await response.json();
            toast.success(result.message);
            onSave(result.data);
            onOpenChange(false);
        } catch (error) {
            toast.error("Erro ao salvar contato: " + error.message);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl z-[9999]">
                <DialogHeader>
                    <DialogTitle>{contact ? 'Editar Contato (Cliente)' : 'Novo Contato (Cliente)'}</DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {/* Nome e Função */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label className="text-xs text-muted-foreground">Nome *</Label>
                            <Input
                                className="bg-green-50/50 border-green-200"
                                value={formData.ani_nome}
                                onChange={(e) => handleChange('ani_nome', e.target.value.toUpperCase())}
                                placeholder="NOME DO CONTATO"
                            />
                        </div>
                        <div>
                            <Label className="text-xs text-muted-foreground">Função/Cargo</Label>
                            <Input
                                value={formData.ani_funcao}
                                onChange={(e) => handleChange('ani_funcao', e.target.value.toUpperCase())}
                                placeholder="CARGO"
                            />
                        </div>
                    </div>

                    {/* Fone e Email */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label className="text-xs text-muted-foreground">Telefone/Celular</Label>
                            <Input
                                value={formData.ani_fone}
                                onChange={(e) => handleChange('ani_fone', e.target.value)}
                                placeholder="(00) 0000-0000"
                            />
                        </div>
                        <div>
                            <Label className="text-xs text-muted-foreground">E-mail</Label>
                            <Input
                                value={formData.ani_email}
                                onChange={(e) => handleChange('ani_email', e.target.value.toLowerCase())}
                                placeholder="email@exemplo.com"
                            />
                        </div>
                    </div>

                    {/* Aniversário */}
                    <div className="flex gap-4">
                        <div className="w-24">
                            <Label className="text-xs text-muted-foreground">Dia Aniv.</Label>
                            <Input
                                type="number"
                                min="1" max="31"
                                value={formData.ani_diaaniv}
                                onChange={(e) => handleChange('ani_diaaniv', e.target.value)}
                            />
                        </div>
                        <div className="w-24">
                            <Label className="text-xs text-muted-foreground">Mês Aniv.</Label>
                            <Input
                                type="number"
                                min="1" max="12"
                                value={formData.ani_mes}
                                onChange={(e) => handleChange('ani_mes', e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Hobby, Time, Esporte */}
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <Label className="text-xs text-muted-foreground">Time que torce</Label>
                            <Input
                                value={formData.ani_timequetorce}
                                onChange={(e) => handleChange('ani_timequetorce', e.target.value)}
                                placeholder="Time"
                            />
                        </div>
                        <div>
                            <Label className="text-xs text-muted-foreground">Esporte Preferido</Label>
                            <Input
                                value={formData.ani_esportepreferido}
                                onChange={(e) => handleChange('ani_esportepreferido', e.target.value)}
                                placeholder="Esporte"
                            />
                        </div>
                        <div>
                            <Label className="text-xs text-muted-foreground">Hobby</Label>
                            <Input
                                value={formData.ani_hobby}
                                onChange={(e) => handleChange('ani_hobby', e.target.value)}
                                placeholder="Hobby"
                            />
                        </div>
                    </div>

                    {/* Obs */}
                    <div>
                        <Label className="text-xs text-muted-foreground">Observações</Label>
                        <Input
                            value={formData.ani_obs}
                            onChange={(e) => handleChange('ani_obs', e.target.value)}
                            placeholder="Observações adicionais"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="gap-2">
                        <X className="h-4 w-4" /> Cancelar
                    </Button>
                    <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                        <Save className="h-4 w-4" /> Salvar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
