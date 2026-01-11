import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, X } from "lucide-react";
import { toast } from "sonner";

export function ContactDialog({ open, onOpenChange, contact, supplierId, onSave }) {
    const [formData, setFormData] = useState({
        con_nome: '',
        con_cargo: '',
        con_telefone: '',
        con_celular: '',
        con_email: '',
        con_dtnasc: '',
        con_timequetorce: '',
        con_esportepreferido: '',
        con_hobby: ''
    });

    // Update formData when contact changes
    useEffect(() => {
        if (contact) {
            // Convert date from YYYY-MM-DD to DD/MM for display
            let displayDate = '';
            if (contact.con_dtnasc) {
                const date = new Date(contact.con_dtnasc);
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                displayDate = `${day}/${month}`;
            }

            setFormData({
                con_nome: contact.con_nome || '',
                con_cargo: contact.con_cargo || '',
                con_telefone: contact.con_telefone || '',
                con_celular: contact.con_celular || '',
                con_email: contact.con_email || '',
                con_dtnasc: displayDate,
                con_timequetorce: contact.con_timequetorce || '',
                con_esportepreferido: contact.con_esportepreferido || '',
                con_hobby: contact.con_hobby || ''
            });
        } else {
            // Reset for new contact
            setFormData({
                con_nome: '',
                con_cargo: '',
                con_telefone: '',
                con_celular: '',
                con_email: '',
                con_dtnasc: '',
                con_timequetorce: '',
                con_esportepreferido: '',
                con_hobby: ''
            });
        }
    }, [contact]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleDateChange = (value) => {
        // User enters DD/MM, we complete with /2001
        if (value.length <= 5) {
            handleChange('con_dtnasc', value);
        }
    };

    const handleSave = async () => {
        if (!formData.con_nome) {
            toast.error("Nome é obrigatório");
            return;
        }

        try {
            // Convert DD/MM to YYYY-MM-DD with year 2001
            let birthDate = null;
            if (formData.con_dtnasc && formData.con_dtnasc.includes('/')) {
                const [day, month] = formData.con_dtnasc.split('/');
                if (day && month) {
                    birthDate = `2001-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                }
            }

            const payload = {
                ...formData,
                con_dtnasc: birthDate
            };

            const isNew = !contact?.con_codigo;
            const url = isNew
                ? `https://salesmasters.softham.com.br/api/suppliers/${supplierId}/contacts`
                : `https://salesmasters.softham.com.br/api/suppliers/${supplierId}/contacts/${contact.con_codigo}`;

            const method = isNew ? 'POST' : 'PUT';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error("Erro ao salvar contato");

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
            <DialogContent className="max-w-2xl z-[9999]">
                <DialogHeader>
                    <DialogTitle>{contact ? 'Editar Contato' : 'Novo Contato'}</DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {/* Nome e Cargo */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label className="text-xs text-muted-foreground">Nome *</Label>
                            <Input
                                className="bg-green-50/50 border-green-200"
                                value={formData.con_nome}
                                onChange={(e) => handleChange('con_nome', e.target.value.toUpperCase())}
                                placeholder="NOME DO CONTATO"
                            />
                        </div>
                        <div>
                            <Label className="text-xs text-muted-foreground">Cargo</Label>
                            <Input
                                value={formData.con_cargo}
                                onChange={(e) => handleChange('con_cargo', e.target.value.toUpperCase())}
                                placeholder="CARGO"
                            />
                        </div>
                    </div>

                    {/* Telefone e Celular */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label className="text-xs text-muted-foreground">Telefone</Label>
                            <Input
                                value={formData.con_telefone}
                                onChange={(e) => handleChange('con_telefone', e.target.value)}
                                placeholder="(19) 3849-1967"
                            />
                        </div>
                        <div>
                            <Label className="text-xs text-muted-foreground">Celular</Label>
                            <Input
                                value={formData.con_celular}
                                onChange={(e) => handleChange('con_celular', e.target.value)}
                                placeholder="(19) 99719-5849"
                            />
                        </div>
                    </div>

                    {/* Email */}
                    <div>
                        <Label className="text-xs text-muted-foreground">E-mail</Label>
                        <Input
                            value={formData.con_email}
                            onChange={(e) => handleChange('con_email', e.target.value.toLowerCase())}
                            placeholder="contato@empresa.com.br"
                        />
                    </div>

                    {/* Dia/Mês aniversário */}
                    <div>
                        <Label className="text-xs text-muted-foreground">Dia/Mês aniversário</Label>
                        <Input
                            value={formData.con_dtnasc}
                            onChange={(e) => handleDateChange(e.target.value)}
                            placeholder="03/04"
                            maxLength={5}
                            className="w-32"
                        />
                    </div>

                    {/* Novos campos */}
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <Label className="text-xs text-muted-foreground">Time que Torce</Label>
                            <Input
                                value={formData.con_timequetorce}
                                onChange={(e) => handleChange('con_timequetorce', e.target.value.toUpperCase())}
                                placeholder="TIME"
                            />
                        </div>
                        <div>
                            <Label className="text-xs text-muted-foreground">Esporte Preferido</Label>
                            <Input
                                value={formData.con_esportepreferido}
                                onChange={(e) => handleChange('con_esportepreferido', e.target.value.toUpperCase())}
                                placeholder="ESPORTE"
                            />
                        </div>
                        <div>
                            <Label className="text-xs text-muted-foreground">Hobby</Label>
                            <Input
                                value={formData.con_hobby}
                                onChange={(e) => handleChange('con_hobby', e.target.value.toUpperCase())}
                                placeholder="HOBBY"
                            />
                        </div>
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
