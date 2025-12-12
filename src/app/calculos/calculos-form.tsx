import { useForm } from 'react-hook-form';
import { useEffect, useState } from 'react';
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
import { CalendarIcon, HelpCircle, Save, Trash2, Camera } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';

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
            // Novos campos opcionais
            codigo: '',
            produto: '',
            categoria: '',
            familia: '',
            grupoProduto: '',
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

    // Overrides e modal de edição de quantidade da tabela
    const [qtdTabelaOverride, setQtdTabelaOverride] = useState<number | null>(null);
    const [qtdTabelaOpen, setQtdTabelaOpen] = useState(false);
    const [qtdTabelaRaw, setQtdTabelaRaw] = useState('');

    // DERIVED STATE: Calculate directly on each render
    const quantidadeTabela = getQuantidadeDaTabela(watchedValues.quantidadeRecebida || 0);
    const quantidadeTabelaFinal = qtdTabelaOverride ?? quantidadeTabela;
    const tabelaInfo = getTabelaSRangeInfo(watchedValues.quantidadeRecebida || 0);
    const resultados = calcularResultados({ ...(watchedValues as any), quantidadeTabelaOverride: quantidadeTabelaFinal } as any);

    const [isPesagemOpen, setPesagemOpen] = useState(false);
    const makeItems = () => Array.from({ length: 20 }, () => ({ raw: '', value: 0, baixoPeso: false }));
    const [currentItems, setCurrentItems] = useState<{ raw: string; value: number; baixoPeso: boolean }[]>(makeItems());
    const [cycles, setCycles] = useState<{ raw: string; value: number; baixoPeso: boolean }[][]>([]);
    const [confirmOpen, setConfirmOpen] = useState(false);

    const parseNumber = (s: string): number => {
        const raw = s.trim();
        if (!raw) return 0;
        if (raw.includes(',')) {
            const normalized = raw.replace(/\./g, '').replace(/,/g, '.');
            const n = Number(normalized);
            return Number.isFinite(n) ? n : 0;
        }
        const pointCount = (raw.match(/\./g) || []).length;
        const normalized = pointCount > 1 ? raw.replace(/\./g, '') : raw;
        const n = Number(normalized);
        return Number.isFinite(n) ? n : 0;
    };

    const sumAllCurrent = currentItems.reduce((acc, it) => acc + (it.value || 0), 0);
    const sumMarkedCurrent = currentItems.reduce((acc, it) => acc + (it.baixoPeso ? (it.value || 0) : 0), 0);
    const countMarkedCurrent = currentItems.reduce((acc, it) => acc + (it.baixoPeso ? 1 : 0), 0);

    const sumMarkedCycles = cycles.reduce((acc, cy) => acc + cy.reduce((a, it) => a + (it.baixoPeso ? (it.value || 0) : 0), 0), 0);
    const countMarkedCycles = cycles.reduce((acc, cy) => acc + cy.reduce((a, it) => a + (it.baixoPeso ? 1 : 0), 0), 0);

    const allPesagemItemsDisplay = [...cycles.flat(), ...currentItems].filter((it) => Number(it.value || 0) > 0);

    const finalizePesagem = () => {
        const totalSum = sumMarkedCycles + sumMarkedCurrent;
        const totalCount = countMarkedCycles + countMarkedCurrent;
        form.setValue('pesoBrutoAnalise', totalSum, { shouldDirty: true });
        form.setValue('quantidadebaixopeso', totalCount, { shouldDirty: true });
        setRawInputs((s) => ({ ...s, pesoBrutoAnalise: String(totalSum).replace('.', ',') }));
        setConfirmOpen(false);
        setPesagemOpen(false);
    };

    // Busca produto por código no Supabase e preenche campos relacionados
    async function lookupProdutoPorCodigo(codigo: string) {
        const code = codigo?.trim();
        if (!code) return;
        try {
            const { supabase, hasSupabaseEnv } = await import('../../lib/supabase');
            if (!hasSupabaseEnv) {
                toast.warning('Supabase não configurado.', { description: 'Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env.' });
                return;
            }

            // Tenta buscar por igualdade exata e, se falhar, por aproximação
            const { data, error } = await supabase
                .from('produtos')
                .select('cod_produto, descricao, unid, categoria, familia, grupo_produto')
                .eq('cod_produto', code)
                .limit(1)
                .maybeSingle();

            if (error) {
                console.warn('Lookup produto erro:', error);
                toast.error('Erro ao consultar produto.', { description: 'Verifique as políticas RLS ou a conexão.' });
                return;
            }

            if (!data) {
                // Limpa campos para digitação manual quando não encontrado
                form.setValue('produto', '', { shouldDirty: true });
                form.setValue('categoria', '', { shouldDirty: true });
                form.setValue('familia', '', { shouldDirty: true });
                form.setValue('grupoProduto', '', { shouldDirty: true });
                return;
            }

            // Preenche campos básicos
            form.setValue('produto', data.descricao || '', { shouldDirty: true });
            form.setValue('categoria', data.categoria || '', { shouldDirty: true });
            form.setValue('familia', data.familia || '', { shouldDirty: true });
            form.setValue('grupoProduto', data.grupo_produto || '', { shouldDirty: true });

            // Auto-fill Peso Líq. por Caixa (KG) a partir de unid (aceita string com vírgula)
            const normalizeDecimal = (val: unknown): number => {
                if (val == null) return 0;
                const s = String(val).trim();
                if (s === '') return 0;
                const normalized = s.includes(',') ? s.replace(/\./g, '').replace(/,/g, '.') : s;
                const n = Number(normalized);
                return Number.isFinite(n) ? n : 0;
            };
            const unid = normalizeDecimal((data as any).unid);
            if (unid > 0) {
                const raw = String(unid).replace('.', ',');
                setRawInputs((s) => ({ ...s, pesoLiquidoPorCaixa: raw }));
                form.setValue('pesoLiquidoPorCaixa', unid, { shouldDirty: true });
            }
        } catch (e) {
            console.warn('Falha ao buscar produto:', e);
            toast.error('Falha ao buscar produto no Supabase.');
        }
    }

    // Aciona lookup sempre que o campo código muda (debounce leve)
    // Isso garante o preenchimento mesmo que o usuário não saia do campo.
    useEffect(() => {
        const codigoAtual = watchedValues.codigo ?? '';
        if (!codigoAtual || codigoAtual.length < 3) return;
        const timer = setTimeout(() => lookupProdutoPorCodigo(codigoAtual), 300);
        return () => clearTimeout(timer);
    }, [watchedValues.codigo]);

    async function onSubmit(data: CalculosFormValues) {
        // Persistência no Supabase
        try {
            const { supabase, hasSupabaseEnv } = await import('../../lib/supabase');
                const observacoesUpper = (data.observacoes || '').toUpperCase();
                // Consolidar todos os itens digitados para uso em persistência e mensagem
                const allItems = [...cycles.flat(), ...currentItems.filter(it => it.value > 0 || it.raw.trim() !== '')];
                const payload = {
                    data_registro: format(data.dataRegistro, 'yyyy-MM-dd'),
                    filial: data.filial,
                    fornecedor: data.fornecedor || null,
                    nota_fiscal: data.notaFiscal || null,
                    modelo_tabela: data.modeloTabela,
                    quantidade_recebida: data.quantidadeRecebida,
                    peso_liquido_por_caixa: data.pesoLiquidoPorCaixa,
                    quantidade_tabela: quantidadeTabelaFinal,
                    quantidade_baixo_peso: data.quantidadebaixopeso,
                    peso_bruto_analise: data.pesoBrutoAnalise,
                    tara_caixa: data.taraCaixa,
                    peso_liquido_programado: resultados.pesoLiquidoProgramado,
                    peso_liquido_analise: resultados.pesoLiquidoAnalise,
                    peso_liquido_real: resultados.pesoLiquidoReal,
                    perda_kg: resultados.perdaKg,
                    perda_cx: resultados.perdaCx,
                    perda_percentual: resultados.perdaPercentual,
                    peso_liquido_ideal_analise: resultados.pesoLiquidoIdealAnalise,
                    peso_liquido_real_analise: resultados.pesoLiquidoRealAnalise,
                    media_baixo_peso_por_caixa: resultados.mediaPesoBaixoPorCaixa,
                    percentual_qtd_caixas_com_baixo_peso: resultados.percentualqtdcaixascombaixopeso,
                    media_qtd_caixas_com_baixo_peso: resultados.mediaqtdcaixascombaixopeso,
                    media_baixo_peso_por_cx: resultados.mediabaixopesoporcaixa,
                    observacoes: observacoesUpper || null,
                    // Novos campos opcionais para filtros e relatórios
                    cod_produto: data.codigo || null,
                    produto: data.produto || null,
                    categoria: data.categoria || null,
                    familia: data.familia || null,
                    grupo_produto: data.grupoProduto || null,
                };

            if (!hasSupabaseEnv) {
                toast.warning('Supabase não configurado.', { description: 'Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env.' });
            } else {
                const { data: inserted, error } = await supabase
                    .from('registros_peso')
                    .insert(payload)
                    .select('id')
                    .single();
                if (error) throw error;

                const recordId = String(inserted?.id ?? '');

                if (allItems.length > 0 && recordId) {
                    const values = allItems.map(it => Number(it.value || 0));
                    const marcado = allItems.filter(it => it.baixoPeso).map(it => Number(it.value || 0));
                    const totalDigitado = values.reduce((a, b) => a + b, 0);
                    const totalBaixoPeso = marcado.reduce((a, b) => a + b, 0);
                    const qtdBaixoPeso = allItems.reduce((a, it) => a + (it.baixoPeso ? 1 : 0), 0);
                    
                    // Avisar se houver mais de 50 itens (limite da tabela)
                    if (allItems.length > 50) {
                        toast.warning('Atenção: Apenas os primeiros 50 itens serão salvos.', {
                            description: `Foram digitados ${allItems.length} itens, mas a tabela suporta apenas 50 campos.`,
                        });
                    }
                    
                    const campos: Record<string, number | null> = {};
                    for (let i = 1; i <= 50; i++) {
                        campos[`campo_${i}`] = values[i - 1] ?? null;
                    }
                    try {
                        const { error: pesagemError } = await supabase
                            .from('pesagem')
                            .insert({
                                record_id: recordId,
                                ...campos,
                                total_digitado: totalDigitado,
                                total_baixo_peso: totalBaixoPeso,
                                qtd_baixo_peso: qtdBaixoPeso,
                            });
                        if (pesagemError) {
                            console.error('Erro ao salvar pesagem:', pesagemError);
                            throw pesagemError;
                        }
                        console.log('Dados de pesagem salvos com sucesso:', { recordId, totalDigitado, totalBaixoPeso, qtdBaixoPeso });
                    } catch (e) {
                        console.error('Falha ao salvar dados de pesagem:', e);
                        toast.error('Erro ao salvar dados de pesagem.', {
                            description: 'Os dados principais foram salvos, mas a pesagem não foi registrada.',
                        });
                    }
                } else if (allItems.length === 0 && recordId) {
                    console.log('Nenhum dado de pesagem para salvar.');
                }
            }

            // Google Sheets: tentar via Edge Function (SDK) e, se falhar, usar fallback Apps Script
            try {
                const { config } = await import('../../lib/config');
                const body = {
                    spreadsheetId: config.sheets.spreadsheetId,
                    range: config.sheets.range,
                    action: 'append' as const,
                    record: {
                        ...payload,
                        // Sheets: gravar data como string dia/mês/ano
                        data_registro: format(data.dataRegistro, 'dd/MM/yyyy'),
                    },
                };
                let sent = false;
                if (config.sheets.spreadsheetId && config.sheets.range && hasSupabaseEnv) {
                    const { data: fnData, error: fnError } = await supabase.functions.invoke('append-sheet', { body });
                    if (fnError) {
                        console.warn('Edge Function append-sheet erro:', fnError);
                    } else {
                        console.debug('append-sheet resposta:', fnData);
                        // Considere sucesso com ok:true mesmo sem flags adicionais (alguns deployments retornam apenas ok)
                        if (fnData && fnData.ok === true) {
                            sent = true;
                        } else if (fnData && (fnData.appended || fnData.synced)) {
                            sent = true;
                        } else {
                            console.warn('Edge Function retornou corpo inesperado:', fnData);
                        }
                    }
                }

                // Fallback Apps Script: tenta enviar direto para a URL publicada
                if (!sent && config.sheets.appsScriptUrl && config.sheets.spreadsheetId && config.sheets.range) {
                    try {
                        const resp = await fetch(config.sheets.appsScriptUrl, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(body),
                    });
                        const text = await resp.text();
                        console.debug('[AppsScript] Status', resp.status, 'Body', text);
                        if (resp.ok) sent = true;
                    } catch (e) {
                        console.warn('[AppsScript] Falha no fallback:', (e as any)?.message || e);
                    }
                }
                
                if (!sent) {
                    toast.warning('Registro salvo, mas envio ao Google Sheets falhou.', {
                        description: 'Verifique as secrets da função append-sheet (Google).',
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

        // Montar mensagem linha por linha
        let message = "";

    message += "📟🍍*RELATÓRIO DO RECEBIMENTO*🍍📟\n\n";

    message += `🗓️ *DATA:* ${format(data.dataRegistro, 'dd/MM/yyyy')}\n`;
    message += `🏢 *FILIAL:* ${data.filial || 'SEM INFORMAÇÃO'}\n`;
    message += `🪪 *FORNECEDOR:* ${data.fornecedor || 'SEM INFORMAÇÃO'}\n`;
    message += `📄 *NOTA FISCAL:* ${data.notaFiscal || 'SEM INFORMAÇÃO'}\n`;
    message += ` *PRODUTO:* ${data.produto || 'SEM INFORMAÇÃO'}\n`;
    message += "-----\n";

    message += `*-- DADOS DA PESAGEM --*\n`;
    message += `🔄️ *QTD. TOTAL RECEBIDA:* ${data.quantidadeRecebida || 'SEM INFORMAÇÃO'} CX\n`;
    message += `🔄️ *PESO LÍQUIDO TOTAL PROGRAMADO:* ${resultados.pesoLiquidoProgramado?.toFixed(2) || 'SEM INFORMAÇÃO'} KG\n`;
    message += `🔄️ *PESO LÍQUIDO POR CX:* ${data.pesoLiquidoPorCaixa?.toFixed(2) || 'SEM INFORMAÇÃO'} KG\n`;
    message += `🔄️ *TARA DA CAIXA:* ${data.taraCaixa?.toFixed(2) || 'SEM INFORMAÇÃO'} KG\n`;
    message += `🔄️ *QTD. ANALISADA:* ${quantidadeTabelaFinal || 'SEM INFORMAÇÃO'}\n`;
    message += `🔄️ *QTD. BAIXO PESO:* ${data.quantidadebaixopeso || 'SEM INFORMAÇÃO'}\n`;
    message += `🔄️ *PESO BRUTO DA ANÁLISE:* ${data.pesoBrutoAnalise?.toFixed(2) || 'SEM INFORMAÇÃO'} KG\n`;
    message += `🔄️ *PESO LÍQUIDO DA ANÁLISE:* ${resultados.pesoLiquidoAnalise?.toFixed(2) || 'SEM INFORMAÇÃO'} KG\n`;
    message += "-----\n";
    // Resumo da Pesagem
    const allItemsForMessage = [...cycles.flat(), ...currentItems].filter(it => Number(it.value || 0) > 0);
    message += `*-- RESUMO DA PESAGEM --*\n`;
    if (allItemsForMessage.length > 0) {
        const threshold = (Number(data.pesoLiquidoPorCaixa) || 0) + (Number(data.taraCaixa) || 0);
        for (const it of allItemsForMessage) {
            const kg = Number(it.value || 0);
            const kgStr = Number.isFinite(kg) ? kg.toFixed(2) : '0.00';
            if (it.baixoPeso) {
                const diff = Math.max(0, threshold - kg);
                const diffStr = diff.toFixed(3).replace('.', ',');
                message += `⚖️ ${kgStr} KG = BAIXO PESO 🚩- ${diffStr} KG\n`;
            } else {
                message += `⚖️ ${kgStr} KG ✅\n`;
            }
        }
    } else {
        message += `Sem campos de pesagem.\n`;
    }
    message += "-----\n";

    message += `*-- RESULTADOS --*\n`;
    const percentualAnaliseBaixoPeso = quantidadeTabelaFinal > 0 ? (((Number(data.quantidadebaixopeso) || 0) / quantidadeTabelaFinal) * 100) : 0;
    message += `📈 *% DA ANÁLISE DE BAIXO PESO:* ${percentualAnaliseBaixoPeso.toFixed(2)} %\n`;
    message += `📟 *PESO LÍQUIDO REAL DA CARGA:* ${resultados.pesoLiquidoReal?.toFixed(2) || 'SEM INFORMAÇÃO'} KG\n`;
    message += `🔴 *PERDA EM KG:* ${resultados.perdaKg?.toFixed(2) || 'SEM INFORMAÇÃO'} KG\n`;
    message += `🔴 *PERDA EM CX:* ${resultados.perdaCx?.toFixed(2) || 'SEM INFORMAÇÃO'} CX\n`;
    message += `💲 *% PERDA DA CARGA:* ${resultados.perdaPercentual.toFixed(2) || 'SEM INFORMAÇÃO'} %\n`;
    message += "-----\n";

        message += `💬 *OBSERVAÇÕES:* ${(data.observacoes || '').toUpperCase() || 'SEM INFORMAÇÃO'}\n\n`;

        message += "📟🥝APP CHECKPESO - GDM🍎📟";


// Codificar a mensagem para WhatsApp
const mensagemCodificada = encodeURIComponent(message);

// Gerar link WhatsApp
const link = `https://api.whatsapp.com/send?text=${mensagemCodificada}`;

    // Abre o WhatsApp
    window.open(link, "_blank");

    // Limpa dados para evitar duplicidade após salvar
    form.reset();
    setRawInputs({ pesoLiquidoPorCaixa: '', pesoBrutoAnalise: '', taraCaixa: '' });
    setQtdTabelaOverride(null);
    setQtdTabelaOpen(false);
    setQtdTabelaRaw('');
    setCurrentItems(makeItems());
    setCycles([]);
        }
    
    const getSeverity = (perda: number): 'ok' | 'attention' | 'critical' => {
        if (isNaN(perda) || perda < 3) return 'ok';
        if (perda >= 3 && perda <= 5) return 'attention';
        return 'critical';
    };

    return (
        <>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-6 w-full overflow-x-hidden px-2 sm:px-4 md:px-6 mx-auto lg:mx-0">
                <div className="grid gap-4 sm:gap-6 lg:grid-cols-3 w-full">
                    <div className="lg:col-span-2 space-y-6 md:space-y-8">
                        <Card>
                            <CardHeader className="p-3 sm:p-4">
                                <CardTitle className="text-sm sm:text-base">1. Informações da Carga</CardTitle>
                                <CardDescription>Dados de produto e documento.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-3 pt-0 grid gap-3 sm:gap-4 sm:grid-cols-2">
                                <FormField
                                  control={form.control}
                                  name="fornecedor"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-[11px] sm:text-xs">Fornecedor (opcional)</FormLabel>
                                      <FormControl>
                                        <Input
                                          className="uppercase text-xs h-8"
                                          value={(field.value ?? '').toUpperCase()}
                                          onChange={(e) => field.onChange(e.currentTarget.value.toUpperCase())}
                                        />
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />
                                <FormField control={form.control} name="notaFiscal" render={({ field }) => (<FormItem><FormLabel className="text-[11px] sm:text-xs">Nº da Nota Fiscal (opcional)</FormLabel><FormControl><Input {...field} className="text-xs h-8" placeholder="Preencha manualmente se não encontrado" /></FormControl></FormItem>)} />
                                <FormField control={form.control} name="codigo" render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-[11px] sm:text-xs">Código do Produto (opcional)</FormLabel>
                                    <FormControl>
                                      <Input
                                        {...field}
                                        className="text-xs h-8"
                                        placeholder="Preencha manualmente se não encontrado"
                                        onChange={(e) => { const val = e.currentTarget.value; field.onChange(val); lookupProdutoPorCodigo(val); }}
                                        onBlur={() => { const codigo = (form.getValues('codigo') || '').trim(); if (codigo) lookupProdutoPorCodigo(codigo); }}
                                      />
                                    </FormControl>
                                  </FormItem>
                                )} />
                                <FormField control={form.control} name="produto" render={({ field }) => (<FormItem><FormLabel className="text-[11px] sm:text-xs">Descrição do Produto (opcional)</FormLabel><FormControl><Input {...field} className="text-xs h-8" placeholder="Preencha manualmente se não encontrado" /></FormControl></FormItem>)} />
                                <FormField control={form.control} name="categoria" render={({ field }) => (<FormItem><FormLabel className="text-[11px] sm:text-xs">Categoria do Produto (opcional)</FormLabel><FormControl><Input {...field} className="text-xs h-8" placeholder="Preencha manualmente se não encontrado" /></FormControl></FormItem>)} />
                                <FormField control={form.control} name="familia" render={({ field }) => (<FormItem><FormLabel className="text-[11px] sm:text-xs">Família do Produto (opcional)</FormLabel><FormControl><Input {...field} className="text-xs h-8" placeholder="Preencha manualmente se não encontrado" /></FormControl></FormItem>)} />
                                <FormField control={form.control} name="grupoProduto" render={({ field }) => (<FormItem><FormLabel className="text-[11px] sm:text-xs">Grupo Produto (opcional)</FormLabel><FormControl><Input {...field} className="text-xs h-8" placeholder="Preencha manualmente se não encontrado" /></FormControl></FormItem>)} />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="p-3 sm:p-4">
                                <CardTitle className="text-sm sm:text-base">2. Dados da Pesagem</CardTitle>
                                <CardDescription>Preencha os campos principais para o cálculo.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-3 pt-0 grid gap-3 sm:gap-4 sm:grid-cols-2">
                                <FormField
                                    control={form.control}
                                    name="filial"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[11px] sm:text-xs">Filial</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="h-8 text-xs">
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
                                            <FormLabel className="text-[11px] sm:text-xs">Data do Registro</FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant={"outline"}
                                                            size="sm"
                                                            className={cn(
                                                                "w-full h-8 px-2 pl-2 text-xs text-left font-normal",
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
                                        <FormLabel className="text-[11px] sm:text-xs">Qtd. Total de Caixas Recebidas</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="text"
                                                inputMode="decimal"
                                                placeholder=""
                                                className="text-xs h-8"
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
                                        <FormLabel className="text-[11px] sm:text-xs">Peso Líq. do Produto (em 1 CX)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="text"
                                                inputMode="decimal"
                                                placeholder=""
                                                className="text-xs h-8"
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
                                <FormField control={form.control} name="taraCaixa" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[11px] sm:text-xs">Tara Da Caixa (KG)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="text"
                                                inputMode="decimal"
                                                placeholder=""
                                                className="text-xs h-8"
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

                                <FormField
                                    control={form.control}
                                    name="modeloTabela"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[11px] sm:text-xs">Modelo da Tabela</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl><SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    <SelectItem value="S4">S4</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </FormItem>
                                    )}
                                />
                                <FormItem>
                                    <Label className="flex items-center gap-2 text-[11px] sm:text-xs">
                                        Qtd. da Tabela (amostra)
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild><HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" /></TooltipTrigger>
                                                <TooltipContent><p>{tabelaInfo}</p></TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </Label>
                                    <Input type="number" value={quantidadeTabelaFinal} readOnly className="font-bold cursor-pointer h-8 text-xs" onClick={() => { setQtdTabelaRaw(String(quantidadeTabelaFinal)); setQtdTabelaOpen(true); }} />
                                    <div className="mt-3">
                                        <Button type="button" variant="secondary" size="sm" className="h-8 px-2 text-xs" onClick={() => setPesagemOpen(true)}>
                                            Pesagem das Caixas
                                        </Button>
                                    </div>
                                </FormItem>
                                <FormField control={form.control} name="quantidadebaixopeso" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[11px] sm:text-xs">Qtd. de Caixas com Baixo Peso (automático)</FormLabel>
                                        <FormControl>
                                            <Input type="text" value={String(field.value ?? '')} readOnly disabled className="h-8 text-xs" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="pesoBrutoAnalise" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[11px] sm:text-xs">Peso Bruto Total das Amostras com Baixo Peso (automático)</FormLabel>
                                        <FormControl>
                                            <Input type="text" value={String(field.value ?? '')} readOnly disabled className="h-8 text-xs" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />

                                <FormField
                                  control={form.control}
                                  name="observacoes"
                                  render={({ field }) => (
                                    <FormItem className="sm:col-span-2">
                                      <FormLabel className="text-[11px] sm:text-xs">Observações (opcional)</FormLabel>
                                      <FormControl>
                                        <Textarea
                                          className="uppercase text-xs"
                                          placeholder="Detalhes sobre a carga, pesagem, etc."
                                          value={(field.value ?? '').toUpperCase()}
                                          onChange={(e) => field.onChange(e.currentTarget.value.toUpperCase())}
                                        />
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />
                            </CardContent>
                            <CardFooter className="p-3 pt-0 flex flex-col sm:flex-row justify-end gap-2 sm:gap-1.5">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-9 px-2 text-xs w-full sm:w-auto"
                                    onClick={() => {
                                        form.reset();
                                        setRawInputs({ pesoLiquidoPorCaixa: '', pesoBrutoAnalise: '', taraCaixa: '' });
                                    }}
                                >
                                    <Trash2 /> Limpar Dados
                                </Button>
                                <Button type="submit" size="sm" className="h-9 px-2 text-xs w-full sm:w-auto"><Save /> Salvar Registro</Button>
                                <Button type="button" size="sm" className="h-9 px-2 text-xs bg-orange-500 hover:bg-orange-600 text-white w-full sm:w-auto"><Camera className="mr-2 h-4 w-4" /> Anexar Evidências</Button>
                            </CardFooter>
                        </Card>
                    </div>

                    {/* PARTE 4 */}
                    <div className="space-y-6 md:space-y-8">
                        <Card>
                            <CardHeader className="p-3 sm:p-4">
                                <CardTitle className="text-sm sm:text-base">3. Resultados Automáticos</CardTitle>
                                <CardDescription>Cálculos baseados nos dados inseridos.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-3 pt-0 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 md:gap-4">
                                <ResultCard title="% Total de Perda" value={resultados.perdaPercentual.toFixed(2)} unit="%" severity={getSeverity(resultados.perdaPercentual)} className="col-span-1 sm:col-span-2"/>
      <ResultCard title="Perda Total (KG)" value={resultados.perdaKg.toFixed(2)} unit="KG" />
                                <ResultCard title="Perda Total (CX)" value={resultados.perdaCx.toFixed(2)} unit="CX" />
      <ResultCard title="Peso Total Previsto" value={resultados.pesoLiquidoProgramado.toFixed(2)} unit="KG" />
      <ResultCard title="Peso Total Confirmado" value={resultados.pesoLiquidoReal.toFixed(2)} unit="KG" />
      <ResultCard title="Peso Líquido da Análise" value={resultados.pesoLiquidoAnalise.toFixed(2)} unit="KG" />
                                <ResultCard title="Qtd. Cxs Analisadas" value={quantidadeTabelaFinal} unit="CX" />
                                <ResultCard title="Peso Ideal (Análise)" value={resultados.pesoLiquidoIdealAnalise.toFixed(2)} unit="KG" />
                                <ResultCard
                                    title="Falta de Peso (Análise)"
                                    value={resultados.pesoLiquidoRealAnalise.toFixed(2)}
                                    unit="KG"
                                    severity={resultados.pesoLiquidoRealAnalise >= 0 ? 'ok' : 'critical'}
                                />
                                <ResultCard title="Qtd. Cxs Baixo Peso Analisada" value={resultados.mediaPesoBaixoPorCaixa.toFixed(2)} unit="CX" />
                                <ResultCard title="% de Cxs Carga com Baixo Peso" value={(resultados.percentualqtdcaixascombaixopeso * 100).toFixed(2)} unit="%" />
                                <ResultCard title="Qtd. Cxs Baixo Peso na Carga" value={resultados.mediaqtdcaixascombaixopeso.toFixed(2)} unit="CX" />
                                <ResultCard title="Média Baixo Peso por CX" value={resultados.mediabaixopesoporcaixa.toFixed(3)} unit="KG" />
                            </CardContent>
                        </Card>
                        {allPesagemItemsDisplay.length > 0 && (
                            <Card>
                                <CardHeader className="p-2 sm:p-3">
                                    <CardTitle className="text-xs sm:text-sm">Valores Digitados (Caixas)</CardTitle>
                                </CardHeader>
                                <CardContent className="p-2">
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5">
                                        {allPesagemItemsDisplay.map((it, idx) => (
                                            <div
                                                key={idx}
                                                className={cn(
                                                    "min-w-0 px-2 py-1 rounded border text-[11px] flex items-center justify-between",
                                                    it.baixoPeso
                                                        ? "bg-red-500/10 border-red-400/60 text-red-600 dark:text-red-400"
                                                        : "bg-muted/30 border-border"
                                                )}
                                            >
                                                <span className="truncate">#{idx + 1}</span>
                                                <span className="font-medium">{Number(it.value || 0).toFixed(2)} KG</span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </form>
        </Form>

        <Dialog open={isPesagemOpen} onOpenChange={setPesagemOpen}>
            <DialogContent className="w-full max-w-[95vw] sm:max-w-3xl max-h-[80vh] sm:max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-base sm:text-lg">Pesagem das Caixas</DialogTitle>
                    <DialogDescription>Digite os valores e marque as caixas com baixo peso.</DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
                    {currentItems.map((it, idx) => (
                        <div key={idx} className={cn("p-2 border rounded-md flex items-center gap-2", it.baixoPeso ? "bg-red-50 dark:bg-red-900/20 border-red-300" : "")}>
                            <Input
                                type="text"
                                inputMode="decimal"
                                className="h-8 text-xs"
                                value={it.raw}
                                onChange={(e) => {
                                    const raw = e.currentTarget.value;
                                    const val = parseNumber(raw);
                                    setCurrentItems((prev) => {
                                        const next = [...prev];
                                        const pesoLiq = Number(form.getValues('pesoLiquidoPorCaixa') || 0);
                                        const tara = Number(form.getValues('taraCaixa') || 0);
                                        const threshold = pesoLiq + tara;
                                        const autoMark = Number.isFinite(threshold) && threshold > 0 ? (val < threshold) : false;
                                        next[idx] = { ...next[idx], raw, value: val, baixoPeso: autoMark };
                                        return next;
                                    });
                                }}
                                placeholder={`#${idx + 1}`}
                            />
                            <div className="flex items-center gap-1">
                                <Checkbox
                                    checked={it.baixoPeso}
                                    onCheckedChange={(checked) => {
                                        const b = Boolean(checked);
                                        setCurrentItems((prev) => {
                                            const next = [...prev];
                                            next[idx] = { ...next[idx], baixoPeso: b };
                                            return next;
                                        });
                                    }}
                                />
                                <Label className="text-xs">Baixo Peso?</Label>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 mt-4">
                    <Card>
                        <CardHeader className="p-3 sm:p-4">
                            <CardTitle className="text-sm sm:text-base">Total digitado</CardTitle>
                            <CardDescription>Soma dos 20 campos</CardDescription>
                        </CardHeader>
                        <CardContent className="text-lg sm:text-xl font-bold">{sumAllCurrent.toFixed(2)} KG</CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="p-3 sm:p-4">
                            <CardTitle className="text-sm sm:text-base">Total marcado "Baixo Peso"</CardTitle>
                            <CardDescription>Somente campos marcados</CardDescription>
                        </CardHeader>
                        <CardContent className="text-lg sm:text-xl font-bold">{sumMarkedCurrent.toFixed(2)} KG</CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="p-3 sm:p-4">
                            <CardTitle className="text-sm sm:text-base">Qtd. "Baixo Peso"</CardTitle>
                            <CardDescription>Campos marcados</CardDescription>
                        </CardHeader>
                        <CardContent className="text-lg sm:text-xl font-bold">{countMarkedCurrent}</CardContent>
                    </Card>
                </div>
                {cycles.length > 0 && (
                    <div className="mt-4 space-y-2">
                        {cycles.map((c, i) => {
                            const sum = c.reduce((a, it) => a + (it.baixoPeso ? (it.value || 0) : 0), 0);
                            const cnt = c.reduce((a, it) => a + (it.baixoPeso ? 1 : 0), 0);
                            return (
                                <div key={i} className="text-sm text-muted-foreground">
                                    Ciclo {i + 1}: {cnt} marcados • {sum.toFixed(2)} KG
                                </div>
                            );
                        })}
                    </div>
                )}
                <DialogFooter>
                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="h-8 px-2 text-xs"
                        onClick={() => setPesagemOpen(false)}
                    >
                        Fechar
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        className="h-8 px-2 text-xs"
                        onClick={() => setConfirmOpen(true)}
                    >
                        Salvar
                    </Button>
                </DialogFooter>
                <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-base sm:text-lg">Você deseja finalizar as anotações de pesagem ou adicionar mais anotações de pesagem?</AlertDialogTitle>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel className="h-8 px-3 text-xs" onClick={() => {
                                setCycles((prev) => [...prev, currentItems]);
                                setCurrentItems(makeItems());
                                setConfirmOpen(false);
                            }}>Sim</AlertDialogCancel>
                            <AlertDialogAction className="h-8 px-3 text-xs" onClick={() => {
                                setCycles((prev) => [...prev, currentItems]);
                                finalizePesagem();
                                setCurrentItems(makeItems());
                            }}>Não</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </DialogContent>
        </Dialog>
        <Dialog open={qtdTabelaOpen} onOpenChange={setQtdTabelaOpen}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>Editar Qtd. da Tabela</DialogTitle>
                    <DialogDescription>Aplica apenas neste registro.</DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                    <Input type="number" value={qtdTabelaRaw} onChange={(e) => setQtdTabelaRaw(e.currentTarget.value)} />
                </div>
                <DialogFooter>
                    <Button type="button" variant="secondary" onClick={() => setQtdTabelaOpen(false)}>Cancelar</Button>
                    <Button type="button" onClick={() => {
                        const n = Number(qtdTabelaRaw);
                        const v = Number.isFinite(n) && n > 0 ? Math.round(n) : quantidadeTabela;
                        setQtdTabelaOverride(v);
                        setQtdTabelaOpen(false);
                    }}>Salvar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        </>
    );
}
