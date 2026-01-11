import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronsUpDown, Check, X, Save } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

const ClientIndustryDialog = ({ open, onOpenChange, industry, clientId, onSave }) => {
    const [formData, setFormData] = useState({
        cli_forcodigo: '',
        cli_transportadora: '',
        cli_prazopg: '',
        cli_comprador: '',
        cli_emailcomprador: '',
        cli_obsparticular: '',
        cli_codcliind: '',
        cli_frete: '',
        cli_tabela: '',
        cli_desc10: '', // % add
        cli_desc11: '', // % especial
        cli_desc1: '',
        cli_desc2: '',
        cli_desc3: '',
        cli_desc4: '',
        cli_desc5: '',
        cli_desc6: '',
        cli_desc7: '',
        cli_desc8: '',
        cli_desc9: '',
    });

    const [suppliers, setSuppliers] = useState([]);
    const [carriers, setCarriers] = useState([]);
    const [loadingSuppliers, setLoadingSuppliers] = useState(false);
    const [loadingCarriers, setLoadingCarriers] = useState(false);

    // Combobox open states
    const [openIndustry, setOpenIndustry] = useState(false);
    const [openCarrier, setOpenCarrier] = useState(false);

    useEffect(() => {
        if (open) {
            fetchSuppliers();
            fetchCarriers();
            if (industry) {
                setFormData({
                    cli_forcodigo: industry.cli_forcodigo ? String(industry.cli_forcodigo) : '',
                    cli_transportadora: industry.cli_transportadora ? String(industry.cli_transportadora) : '',
                    cli_prazopg: industry.cli_prazopg || '',
                    cli_comprador: industry.cli_comprador || '',
                    cli_emailcomprador: industry.cli_emailcomprador || '',
                    cli_obsparticular: industry.cli_obsparticular || '',
                    cli_codcliind: industry.cli_codcliind || '',
                    cli_frete: industry.cli_frete || '',
                    cli_tabela: industry.cli_tabela || '',
                    cli_desc10: industry.cli_desc10 || '',
                    cli_desc11: industry.cli_desc11 || '',
                    cli_desc1: industry.cli_desc1 || '',
                    cli_desc2: industry.cli_desc2 || '',
                    cli_desc3: industry.cli_desc3 || '',
                    cli_desc4: industry.cli_desc4 || '',
                    cli_desc5: industry.cli_desc5 || '',
                    cli_desc6: industry.cli_desc6 || '',
                    cli_desc7: industry.cli_desc7 || '',
                    cli_desc8: industry.cli_desc8 || '',
                    cli_desc9: industry.cli_desc9 || '',
                });
            } else {
                setFormData({
                    cli_forcodigo: '',
                    cli_transportadora: '',
                    cli_prazopg: '',
                    cli_comprador: '',
                    cli_emailcomprador: '',
                    cli_obsparticular: '',
                    cli_codcliind: '',
                    cli_frete: '',
                    cli_tabela: '',
                    cli_desc10: '',
                    cli_desc11: '',
                    cli_desc1: '',
                    cli_desc2: '',
                    cli_desc3: '',
                    cli_desc4: '',
                    cli_desc5: '',
                    cli_desc6: '',
                    cli_desc7: '',
                    cli_desc8: '',
                    cli_desc9: '',
                });
            }
        }
    }, [open, industry]);

    const fetchSuppliers = async () => {
        setLoadingSuppliers(true);
        try {
            const response = await fetch('https://salesmasters.softham.com.br/api/suppliers');
            if (response.ok) {
                const data = await response.json();
                const list = Array.isArray(data) ? data : (data.data || []);
                setSuppliers(list);
            } else {
                toast.error('Erro ao buscar fornecedores');
            }
        } catch (error) {
            console.error('Error fetching suppliers:', error);
            toast.error('Erro ao conectar com o servidor');
        } finally {
            setLoadingSuppliers(false);
        }
    };

    const fetchCarriers = async () => {
        setLoadingCarriers(true);
        try {
            const response = await fetch('https://salesmasters.softham.com.br/api/transportadoras');
            if (response.ok) {
                const data = await response.json();
                const list = Array.isArray(data) ? data : (data.data || []);
                setCarriers(list);
            }
        } catch (error) {
            console.error('Error fetching carriers:', error);
        } finally {
            setLoadingCarriers(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSelectChange = (name, value) => {
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = industry
                ? `https://salesmasters.softham.com.br/api/clients/${clientId}/industries/${industry.cli_lancamento}`
                : `https://salesmasters.softham.com.br/api/clients/${clientId}/industries`;

            const method = industry ? 'PUT' : 'POST';

            const payload = {
                ...formData,
                cli_forcodigo: formData.cli_forcodigo ? parseInt(formData.cli_forcodigo) : null,
                cli_transportadora: formData.cli_transportadora ? parseInt(formData.cli_transportadora) : null
            };

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                const savedIndustry = await response.json();
                onSave(savedIndustry.data);
                onOpenChange(false);
                toast.success('Informações salvas com sucesso!');
            } else {
                const errorData = await response.json();
                toast.error(errorData.message || 'Erro ao salvar informações');
            }
        } catch (error) {
            console.error('Error saving industry:', error);
            toast.error('Erro ao salvar informações');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {/* MATCHING STYLE: Standard white, clean dialog */}
            <DialogContent className="max-w-4xl z-[9999]">
                <DialogHeader>
                    <DialogTitle>{industry ? 'Editar Informações na Indústria' : 'Nova Informação na Indústria'}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="grid gap-4 py-4">

                    {/* Top Section: Industry & Carrier in one row if possible, or stacked */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Indústria - Combobox */}
                        <div className="flex flex-col gap-1">
                            <Label className="text-xs text-muted-foreground">Indústria</Label>
                            <Popover open={openIndustry} onOpenChange={setOpenIndustry}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={openIndustry}
                                        className={cn(
                                            "w-full justify-between h-9",
                                            !formData.cli_forcodigo && "text-muted-foreground"
                                        )}
                                    >
                                        {formData.cli_forcodigo
                                            ? suppliers.find((sup) => String(sup.for_codigo) === formData.cli_forcodigo)
                                                ? (suppliers.find((sup) => String(sup.for_codigo) === formData.cli_forcodigo).for_nomered || suppliers.find((sup) => String(sup.for_codigo) === formData.cli_forcodigo).for_nome)
                                                : "Selecione..."
                                            : "Selecione..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[400px] p-0 z-[10000]">
                                    <Command>
                                        <CommandInput placeholder="Buscar indústria..." />
                                        <CommandList>
                                            <CommandEmpty>Nenhuma indústria encontrada.</CommandEmpty>
                                            <CommandGroup>
                                                {suppliers.map((sup) => (
                                                    <CommandItem
                                                        value={`${sup.for_nomered || ''} ${sup.for_nome}`}
                                                        key={sup.for_codigo}
                                                        onSelect={() => {
                                                            handleSelectChange('cli_forcodigo', String(sup.for_codigo));
                                                            setOpenIndustry(false);
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                formData.cli_forcodigo === String(sup.for_codigo)
                                                                    ? "opacity-100"
                                                                    : "opacity-0"
                                                            )}
                                                        />
                                                        <span className="font-bold">{sup.for_nomered || sup.for_nome}</span>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Transportadora - Combobox */}
                        <div className="flex flex-col gap-1">
                            <Label className="text-xs text-muted-foreground">Transportadora</Label>
                            <Popover open={openCarrier} onOpenChange={setOpenCarrier}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={openCarrier}
                                        className={cn(
                                            "w-full justify-between h-9",
                                            !formData.cli_transportadora && "text-muted-foreground"
                                        )}
                                    >
                                        {formData.cli_transportadora
                                            ? carriers.find((car) => String(car.tra_codigo) === formData.cli_transportadora)?.tra_nome || "Selecione..."
                                            : "Selecione..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[400px] p-0 z-[10000]">
                                    <Command>
                                        <CommandInput placeholder="Buscar transportadora..." />
                                        <CommandList>
                                            <CommandEmpty>Nenhuma transportadora encontrada.</CommandEmpty>
                                            <CommandGroup>
                                                {carriers.map((car) => (
                                                    <CommandItem
                                                        value={car.tra_nome}
                                                        key={car.tra_codigo}
                                                        onSelect={() => {
                                                            handleSelectChange('cli_transportadora', String(car.tra_codigo));
                                                            setOpenCarrier(false);
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                formData.cli_transportadora === String(car.tra_codigo)
                                                                    ? "opacity-100"
                                                                    : "opacity-0"
                                                            )}
                                                        />
                                                        {car.tra_nome}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    {/* Row 2: Cond Pagto, Resp Compras, Email Compras */}
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <Label className="text-xs text-muted-foreground">Condições pagto</Label>
                            <Input
                                name="cli_prazopg"
                                value={formData.cli_prazopg}
                                onChange={handleChange}
                                className="bg-blue-50/20"
                            />
                        </div>
                        <div>
                            <Label className="text-xs text-muted-foreground">Resp. compras</Label>
                            <Input
                                name="cli_comprador"
                                value={formData.cli_comprador}
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            <Label className="text-xs text-muted-foreground">E-mail compras</Label>
                            <Input
                                name="cli_emailcomprador"
                                value={formData.cli_emailcomprador}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {/* Row 3: Cód Industria, Frete, %Add, %Especial */}
                    <div className="grid grid-cols-4 gap-4">
                        <div>
                            <Label className="text-xs font-bold text-red-500">Cód. na Indústria</Label>
                            <Input
                                name="cli_codcliind"
                                value={formData.cli_codcliind}
                                onChange={handleChange}
                                className="bg-yellow-50/50"
                            />
                        </div>
                        <div>
                            <Label className="text-xs text-gray-500">FRETE</Label>
                            <Select
                                value={formData.cli_frete}
                                onValueChange={(val) => handleSelectChange('cli_frete', val)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent className="z-[10000]">
                                    <SelectItem value="C">CIF</SelectItem>
                                    <SelectItem value="F">FOB</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label className="text-xs font-bold whitespace-nowrap">% add</Label>
                            <Input
                                name="cli_desc10"
                                value={formData.cli_desc10}
                                onChange={handleChange}
                                className="text-center"
                                placeholder="0,00%"
                            />
                        </div>
                        <div>
                            <Label className="text-xs font-bold whitespace-nowrap">% especial</Label>
                            <Input
                                name="cli_desc11"
                                value={formData.cli_desc11}
                                onChange={handleChange}
                                className="text-center"
                                placeholder="0,00%"
                            />
                        </div>
                    </div>

                    {/* Observações */}
                    <div>
                        <Label className="text-xs text-muted-foreground">Observações (Sairá nos pedidos)</Label>
                        <textarea
                            name="cli_obsparticular"
                            value={formData.cli_obsparticular}
                            onChange={handleChange}
                            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 min-h-[60px]"
                        />
                    </div>

                    {/* Descontos Section */}
                    <div>
                        <Label className="text-xs font-bold">Descontos</Label>
                        <div className="flex gap-2 justify-between mt-1 overflow-x-auto p-1 border rounded-lg bg-gray-50/50">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                                <div key={num} className="flex flex-col items-center min-w-[60px]">
                                    <Label className="text-[10px] mb-1">{num}º</Label>
                                    <Input
                                        name={`cli_desc${num}`}
                                        value={formData[`cli_desc${num}`]}
                                        onChange={handleChange}
                                        className="h-8 text-center text-xs"
                                        placeholder="0,00"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    <DialogFooter className="mt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="gap-2">
                            <X className="h-4 w-4" /> Cancelar
                        </Button>
                        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                            <Save className="h-4 w-4" /> Salvar
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default ClientIndustryDialog;
