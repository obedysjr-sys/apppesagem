import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { calculosFormSchema, CalculosFormValues } from '@/types';
import { getQuantidadeDaTabela, getTabelaSRangeInfo } from '@/lib/tabelaS4';
import { calcularResultados } from '@/lib/calculos';
import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ResultCard } from '@/components/calculos/result-card';
import { CalendarIcon, HelpCircle, Save, Trash2 } from 'lucide-react';

export function CalculosForm() {
    // Data atual com fuso de Salvador (Bahia)
    const getBahiaTodayDate = () => {
        const now = new Date();
        const parts = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Bahia', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
        const year = parseInt(parts.find(p => p.type === 'year')?.value || String(now.getFullYear()));
        const month = parseInt(parts.find(p => p.type === 'month')?.value || String(now.getMonth() + 1)) - 1;
        const day = parseInt(parts.find(p => p.type === 'day')?.value || String(now.getDate()));
        return new Date(year, month, day);
    };
  const form = useForm<CalculosFormValues>({
    resolver: zodResolver(calculosFormSchema) as any,
        defaultValues: {
            filial: 'TRIELO CD SIMÕES FILHO BA',
            dataRegistro: getBahiaTodayDate(),
            quantidadeRecebida: 0,
            pesoLiquidoPorCaixa: 0,
            modeloTabela: 'S4',
            pesoBrutoAnalise: 0,
            taraCaixa: 0,
            quantidadebaixopeso: 0,
            fornecedor: '',
            notaFiscal: '',
            observacoes: '',
        },
    });

    // Estados locais para manter a digitação com vírgula nos campos decimais
    const [rawInputs, setRawInputs] = useState({
        pesoLiquidoPorCaixa: '',
        pesoBrutoAnalise: '',
        taraCaixa: '',
    });

    const watchedValues = form.watch();

    // DERIVED STATE: Calculate directly on each render instead of using useEffect and useState
    // This is the fix for the infinite loop.
    const quantidadeTabela = getQuantidadeDaTabela(watchedValues.quantidadeRecebida || 0);
    const tabelaInfo = getTabelaSRangeInfo(watchedValues.quantidadeRecebida || 0);
    const resultados = calcularResultados(watchedValues);

    async function onSubmit(data: CalculosFormValues) {
        // Persistência no Supabase
        try {
            const { supabase, hasSupabaseEnv } = await import('../../lib/supabase');
            const payload = {
                data_registro: format(data.dataRegistro, 'yyyy-MM-dd'),
                filial: data.filial,
                fornecedor: data.fornecedor || null,
                nota_fiscal: data.notaFiscal || null,
                modelo_tabela: data.modeloTabela,
                quantidade_recebida: data.quantidadeRecebida,
                peso_liquido_por_caixa: data.pesoLiquidoPorCaixa,
                quantidade_tabela: quantidadeTabela,
                quantidade_baixo_peso: data.quantidadebaixopeso,
                peso_bruto_analise: data.pesoBrutoAnalise,
                tara_caixa: data.taraCaixa,
                peso_liquido_programado: resultados.pesoLiquidoProgramado,
                peso_liquido_analise: resultados.pesoLiquidoAnalise,
                peso_liquido_real: resultados.pesoLiquidoReal,
                perda_kg: resultados.perdaKg,
                perda_cx: resultados.perdaCx,
                perda_percentual: resultados.perdaPercentual,
                observacoes: data.observacoes || null,
            };

            if (!hasSupabaseEnv) {
                toast.warning('Supabase não configurado.', { description: 'Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env.' });
            } else {
                const { error } = await supabase
                    .from('registros_peso')
                    .insert(payload);
                if (error) throw error;
            }

            // Google Sheets: tentar via Edge Function (SDK) e, se falhar, usar fallback Apps Script
            try {
                const { config } = await import('../../lib/config');
                const body = {
                    spreadsheetId: config.sheets.spreadsheetId,
                    range: config.sheets.range,
                    record: {
                        ...payload,
                        data_registro: format(data.dataRegistro, 'dd/MM/yyyy'),
                    },
                };
                let sent = false;
                if (config.sheets.spreadsheetId && config.sheets.range && hasSupabaseEnv) {
                    const { data: fnData, error: fnError } = await supabase.functions.invoke('append-sheet', { body });
                    if (fnError) {
                        console.warn('Edge Function append-sheet erro:', fnError);
                    } else if (fnData && (fnData.ok === false || fnData.success === false)) {
                        console.warn('Edge Function retornou falha lógica:', fnData);
                    } else {
                        sent = true;
                    }
                }

                if (!sent && config.sheets.appsScriptUrl) {
                    try {
                        const resp = await fetch(config.sheets.appsScriptUrl, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(body),
                        });
                        if (!resp.ok) {
                            const text = await resp.text();
                            console.warn('Apps Script respondeu com erro:', text);
                        } else {
                            sent = true;
                        }
                    } catch (appsErr) {
                        console.warn('Falha no fallback Apps Script:', appsErr);
                    }
                }

                if (!sent) {
                    toast.warning('Registro salvo, mas envio ao Google Sheets falhou.', {
                        description: 'Verifique a função append-sheet ou configure VITE_APPS_SCRIPT_URL para fallback.',
                    });
                }
            } catch (err) {
                console.warn('Falha ao enviar para Google Sheets:', err);
                toast.warning('Registro salvo, mas houve erro ao enviar para o Google Sheets.');
            }

            toast.success('Registro salvo com sucesso!', {
                description: 'Os dados foram enviados para o banco de dados.',
            });
        } catch (err) {
            console.error(err);
            toast.error('Falha ao salvar o registro.', {
                description: 'Verifique a conexão e tente novamente.',
            });
        }

        // Gerar link do WhatsApp
        const mensagem = `*CHECKPESO - RESUMO DA ANÁLISE*%0A%0A*Filial:* ${data.filial}%0A*Data:* ${format(data.dataRegistro, 'dd/MM/yyyy')}%0A*Fornecedor:* ${data.fornecedor || 'N/A'}%0A*NF:* ${data.notaFiscal || 'N/A'}%0A%0A*-- DADOS DA PESAGEM --*%0A*Qtd. Recebida:* ${data.quantidadeRecebida} CX%0A*Peso Líq. p/ Caixa:* ${data.pesoLiquidoPorCaixa.toFixed(3)} KG%0A*Peso Bruto Análise:* ${data.pesoBrutoAnalise.toFixed(3)} KG%0A*Tara p/ Caixa:* ${data.taraCaixa.toFixed(3)} KG%0A%0A*-- RESULTADOS --*%0A*Peso Líq. Programado:* ${resultados.pesoLiquidoProgramado.toFixed(3)} KG%0A*Peso Líq. Real:* ${resultados.pesoLiquidoReal.toFixed(3)} KG%0A*Perda Total:* ${resultados.perdaKg.toFixed(3)} KG (${resultados.perdaPercentual.toFixed(2)}%)%0A*Perda em Caixas:* ${resultados.perdaCx.toFixed(2)} CX%0A%0A*Observações:* ${data.observacoes || 'Nenhuma'}`;
        const link = `https://api.whatsapp.com/send?text=${mensagem}`;
        
        // Abre o link em uma nova aba
        window.open(link, '_blank');
    }
    
    const getSeverity = (perda: number): 'ok' | 'attention' | 'critical' => {
        if (isNaN(perda) || perda < 3) return 'ok';
        if (perda >= 3 && perda <= 5) return 'attention';
        return 'critical';
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-8">
                <div className="grid gap-8 lg:grid-cols-3">
                    <div className="lg:col-span-2 space-y-8">
                        {/* PARTE 1 & 2 */}
                        <Card>
                            <CardHeader>
                                <CardTitle>1. Dados da Pesagem</CardTitle>
                                <CardDescription>Preencha os campos principais para o cálculo.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-6 sm:grid-cols-2">
                                <FormField
                                    control={form.control}
                                    name="filial"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Filial</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Selecione a filial" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="TRIELO CD SIMÕES FILHO BA">TRIELO CD SIMÕES FILHO BA</SelectItem>
                                                    <SelectItem value="TRIELO ITAITINGA CE">TRIELO ITAITINGA CE</SelectItem>
                                                    <SelectItem value="TRIELO RECIFE PE">TRIELO RECIFE PE</SelectItem>
                                                    <SelectItem value="TRIELO CD PAULISTA PE">TRIELO CD PAULISTA PE</SelectItem>
                                                    <SelectItem value="TRIELO CEASA BA">TRIELO CEASA BA</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="dataRegistro"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Data do Registro</FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant={"outline"}
                                                            className={cn(
                                                                "w-full pl-3 text-left font-normal",
                                                                !field.value && "text-muted-foreground"
                                                            )}
                                                        >
                                                            {field.value ? (
                                                                format(field.value, "PPP", { locale: ptBR })
                                                            ) : (
                                                                <span>Escolha uma data</span>
                                                            )}
                                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        selected={field.value}
                                                        onSelect={field.onChange}
                                                        disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                                                        initialFocus
                                                        locale={ptBR}
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField control={form.control} name="quantidadeRecebida" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Qtd. Recebida (CX)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="text"
                                                inputMode="decimal"
                                                placeholder=""
                                                value={field.value === 0 ? '' : String(field.value ?? '')}
                                                onChange={(e) => {
                                                    const raw = e.currentTarget.value.trim();
                                                    let normalized = raw;
                                                    if (raw.includes(',')) {
                                                        normalized = raw.replace(/\./g, '').replace(/,/g, '.');
                                                    } else {
                                                        const pointCount = (raw.match(/\./g) || []).length;
                                                        if (pointCount > 1) normalized = raw.replace(/\./g, '');
                                                    }
                                                    const num = normalized === '' ? undefined : Number(normalized);
                                                    field.onChange(Number.isFinite(num as number) ? num : undefined);
                                                }}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="pesoLiquidoPorCaixa" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Peso Líq. por Caixa (KG)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="text"
                                                inputMode="decimal"
                                                placeholder=""
                                                value={rawInputs.pesoLiquidoPorCaixa}
                                                onChange={(e) => {
                                                    const raw = e.currentTarget.value;
                                                    setRawInputs((s) => ({ ...s, pesoLiquidoPorCaixa: raw }));
                                                    let normalized = raw;
                                                    if (raw.includes(',')) {
                                                        normalized = raw.replace(/\./g, '').replace(/,/g, '.');
                                                    } else {
                                                        const pointCount = (raw.match(/\./g) || []).length;
                                                        if (pointCount > 1) normalized = raw.replace(/\./g, '');
                                                    }
                                                    const num = normalized === '' ? 0 : Number(normalized);
                                                    form.setValue('pesoLiquidoPorCaixa', Number.isFinite(num) ? num : 0, { shouldDirty: true });
                                                }}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField
                                    control={form.control}
                                    name="modeloTabela"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Modelo da Tabela</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    <SelectItem value="S4">S4</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </FormItem>
                                    )}
                                />
                                <FormItem>
                                    <Label className="flex items-center gap-2">
                                        Qtd. da Tabela (amostra)
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild><HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" /></TooltipTrigger>
                                                <TooltipContent><p>{tabelaInfo}</p></TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </Label>
                                    <Input type="number" value={quantidadeTabela} readOnly disabled className="font-bold" />
                                </FormItem>
                                <FormField control={form.control} name="quantidadebaixopeso" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Qtd. Baixo Peso</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="text"
                                                inputMode="decimal"
                                                placeholder=""
                                                value={field.value === 0 ? '' : String(field.value ?? '')}
                                                onChange={(e) => {
                                                    const raw = e.currentTarget.value.trim();
                                                    let normalized = raw;
                                                    if (raw.includes(',')) {
                                                        normalized = raw.replace(/\./g, '').replace(/,/g, '.');
                                                    } else {
                                                        const pointCount = (raw.match(/\./g) || []).length;
                                                        if (pointCount > 1) normalized = raw.replace(/\./g, '');
                                                    }
                                                    const num = normalized === '' ? undefined : Number(normalized);
                                                    field.onChange(Number.isFinite(num as number) ? num : undefined);
                                                }}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="pesoBrutoAnalise" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Peso Bruto da Análise (KG)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="text"
                                                inputMode="decimal"
                                                placeholder=""
                                                value={rawInputs.pesoBrutoAnalise}
                                                onChange={(e) => {
                                                    const raw = e.currentTarget.value;
                                                    setRawInputs((s) => ({ ...s, pesoBrutoAnalise: raw }));
                                                    let normalized = raw;
                                                    if (raw.includes(',')) {
                                                        normalized = raw.replace(/\./g, '').replace(/,/g, '.');
                                                    } else {
                                                        const pointCount = (raw.match(/\./g) || []).length;
                                                        if (pointCount > 1) normalized = raw.replace(/\./g, '');
                                                    }
                                                    const num = normalized === '' ? 0 : Number(normalized);
                                                    form.setValue('pesoBrutoAnalise', Number.isFinite(num) ? num : 0, { shouldDirty: true });
                                                }}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="taraCaixa" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tara por Caixa (KG)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="text"
                                                inputMode="decimal"
                                                placeholder=""
                                                value={rawInputs.taraCaixa}
                                                onChange={(e) => {
                                                    const raw = e.currentTarget.value;
                                                    setRawInputs((s) => ({ ...s, taraCaixa: raw }));
                                                    let normalized = raw;
                                                    if (raw.includes(',')) {
                                                        normalized = raw.replace(/\./g, '').replace(/,/g, '.');
                                                    } else {
                                                        const pointCount = (raw.match(/\./g) || []).length;
                                                        if (pointCount > 1) normalized = raw.replace(/\./g, '');
                                                    }
                                                    const num = normalized === '' ? 0 : Number(normalized);
                                                    form.setValue('taraCaixa', Number.isFinite(num) ? num : 0, { shouldDirty: true });
                                                }}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </CardContent>
                        </Card>

                        {/* PARTE 3 */}
                        <Card>
                            <CardHeader>
                                <CardTitle>2. Dados Complementares</CardTitle>
                                <CardDescription>Informações opcionais para enriquecer o registro.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-6 sm:grid-cols-2">
                                <FormField control={form.control} name="fornecedor" render={({ field }) => (<FormItem><FormLabel>Fornecedor</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                <FormField control={form.control} name="notaFiscal" render={({ field }) => (<FormItem><FormLabel>Nota Fiscal</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                <FormField control={form.control} name="observacoes" render={({ field }) => (<FormItem className="sm:col-span-2"><FormLabel>Observações</FormLabel><FormControl><Textarea placeholder="Detalhes sobre a carga, avarias, etc." {...field} /></FormControl></FormItem>)} />
                            </CardContent>
                            <CardFooter className="flex justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        form.reset();
                                        setRawInputs({ pesoLiquidoPorCaixa: '', pesoBrutoAnalise: '', taraCaixa: '' });
                                    }}
                                >
                                    <Trash2 /> Limpar Dados
                                </Button>
                                <Button type="submit"><Save /> Salvar Registro</Button>
                            </CardFooter>
                        </Card>
                    </div>

                    {/* PARTE 4 */}
                    <div className="space-y-8">
                        <Card>
                            <CardHeader>
                                <CardTitle>3. Resultados Automáticos</CardTitle>
                                <CardDescription>Cálculos baseados nos dados inseridos.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid grid-cols-2 gap-4">
                                <ResultCard title="Perda (%)" value={resultados.perdaPercentual.toFixed(2)} unit="%" severity={getSeverity(resultados.perdaPercentual)} className="col-span-2"/>
                                <ResultCard title="Perda (KG)" value={resultados.perdaKg.toFixed(3)} unit="KG" />
                                <ResultCard title="Perda (CX)" value={resultados.perdaCx.toFixed(2)} unit="CX" />
                                <ResultCard title="Peso Prg." value={resultados.pesoLiquidoProgramado.toFixed(3)} unit="KG" />
                                <ResultCard title="Peso Real" value={resultados.pesoLiquidoReal.toFixed(3)} unit="KG" />
                                <ResultCard title="Peso Análise" value={resultados.pesoLiquidoAnalise.toFixed(3)} unit="KG" />
                                <ResultCard title="Qtd. Análise" value={quantidadeTabela} unit="CX" />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </form>
        </Form>
    );
}
