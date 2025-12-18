'use client';

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RegistroPeso, calculosFormSchema, CalculosFormValues } from "@/types"
import { supabase, hasSupabaseEnv } from "@/lib/supabase"
import { toast } from "sonner"
import { calcularResultados } from "@/lib/calculos"
import { useFiliais } from '@/hooks/use-filiais'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"

import { useState, useEffect } from "react"

interface EditRegistroDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    registro: RegistroPeso
}

export function EditRegistroDialog({ open, onOpenChange, registro }: EditRegistroDialogProps) {
    const [isSaving, setIsSaving] = useState(false)
    const { filiais: filiaisOpcoes, loading: loadingFiliais } = useFiliais();

    useEffect(() => {
        if (open) {
            console.log("EditRegistroDialog opened for:", registro.id);
            // Buscar observações do banco
            (async () => {
                if (hasSupabaseEnv) {
                    try {
                        const { data } = await supabase
                            .from('registros_peso')
                            .select('observacoes')
                            .eq('id', registro.id)
                            .limit(1)
                            .maybeSingle();
                        if (data?.observacoes) {
                            form.setValue('observacoes', data.observacoes);
                        }
                    } catch (e) {
                        console.warn('Erro ao buscar observações:', e);
                    }
                }
            })();
        }
    }, [open, registro.id]);

    const form = useForm<CalculosFormValues & { 
        quantidadeTabela?: number;
        pesoLiquidoProgramado?: number;
        pesoLiquidoAnalise?: number;
        pesoLiquidoReal?: number;
        perdaKg?: number;
        perdaCx?: number;
        perdaPercentual?: number;
        pesoLiquidoIdealAnalise?: number;
        pesoLiquidoRealAnalise?: number;
        mediaPesoBaixoPorCaixa?: number;
        percentualqtdcaixascombaixopeso?: number;
        mediaqtdcaixascombaixopeso?: number;
        mediabaixopesoporcaixa?: number;
        observacoes?: string;
    }>({
        resolver: zodResolver(calculosFormSchema) as any,
        defaultValues: {
            filial: registro.filial,
            dataRegistro: new Date(registro.dataRegistro),
            quantidadeRecebida: registro.quantidadeRecebida,
            pesoLiquidoPorCaixa: registro.pesoLiquidoPorCaixa,
            modeloTabela: registro.modeloTabela,
            pesoBrutoAnalise: registro.pesoBrutoAnalise,
            taraCaixa: registro.taraCaixa,
            quantidadebaixopeso: registro.quantidadebaixopeso,
            fornecedor: registro.fornecedor || '',
            notaFiscal: registro.notaFiscal || '',
            codigo: registro.codigo || '',
            produto: registro.produto || '',
            categoria: registro.categoria || '',
            familia: registro.familia || '',
            grupoProduto: registro.grupoProduto || '',
            observacoes: '',
            quantidadeTabela: registro.quantidadeTabela,
            pesoLiquidoProgramado: registro.pesoLiquidoProgramado,
            pesoLiquidoAnalise: registro.pesoLiquidoAnalise,
            pesoLiquidoReal: registro.pesoLiquidoReal,
            perdaKg: registro.perdaKg,
            perdaCx: registro.perdaCx,
            perdaPercentual: registro.perdaPercentual,
            pesoLiquidoIdealAnalise: registro.pesoLiquidoIdealAnalise,
            pesoLiquidoRealAnalise: registro.pesoLiquidoRealAnalise,
            mediaPesoBaixoPorCaixa: registro.mediaPesoBaixoPorCaixa,
            percentualqtdcaixascombaixopeso: registro.percentualqtdcaixascombaixopeso,
            mediaqtdcaixascombaixopeso: registro.mediaqtdcaixascombaixopeso,
            mediabaixopesoporcaixa: registro.mediabaixopesoporcaixa,
        }
    })

    const onSubmit = async (values: CalculosFormValues) => {
        setIsSaving(true)
        console.log("Submitting edit for:", registro.id, values);
        
        if (!hasSupabaseEnv) {
            toast.error("Supabase não está configurado");
            setIsSaving(false);
            return;
        }

        try {
            // Permite usar valores editados ou recalcular se necessário
            const resultados = calcularResultados(values as any);
            
            // Formata a data no formato YYYY-MM-DD para o banco de dados
            const dataRegistroStr = values.dataRegistro.toISOString().split('T')[0];
            
            const dbPayload: any = {
                filial: values.filial,
                data_registro: dataRegistroStr,
                fornecedor: values.fornecedor || null,
                nota_fiscal: values.notaFiscal || null,
                modelo_tabela: values.modeloTabela,
                quantidade_recebida: values.quantidadeRecebida,
                peso_liquido_por_caixa: values.pesoLiquidoPorCaixa,
                quantidade_tabela: (values as any).quantidadeTabela ?? resultados.quantidadeTabela,
                quantidade_baixo_peso: values.quantidadebaixopeso,
                peso_bruto_analise: values.pesoBrutoAnalise,
                tara_caixa: values.taraCaixa,
                peso_liquido_programado: (values as any).pesoLiquidoProgramado ?? resultados.pesoLiquidoProgramado,
                peso_liquido_analise: (values as any).pesoLiquidoAnalise ?? resultados.pesoLiquidoAnalise,
                peso_liquido_real: (values as any).pesoLiquidoReal ?? resultados.pesoLiquidoReal,
                perda_kg: (values as any).perdaKg ?? resultados.perdaKg,
                perda_cx: (values as any).perdaCx ?? resultados.perdaCx,
                perda_percentual: (values as any).perdaPercentual ?? resultados.perdaPercentual,
                peso_liquido_ideal_analise: (values as any).pesoLiquidoIdealAnalise ?? resultados.pesoLiquidoIdealAnalise,
                peso_liquido_real_analise: (values as any).pesoLiquidoRealAnalise ?? resultados.pesoLiquidoRealAnalise,
                media_baixo_peso_por_caixa: (values as any).mediaPesoBaixoPorCaixa ?? resultados.mediaPesoBaixoPorCaixa,
                percentual_qtd_caixas_com_baixo_peso: (values as any).percentualqtdcaixascombaixopeso ?? resultados.percentualqtdcaixascombaixopeso,
                media_qtd_caixas_com_baixo_peso: (values as any).mediaqtdcaixascombaixopeso ?? resultados.mediaqtdcaixascombaixopeso,
                media_baixo_peso_por_cx: (values as any).mediabaixopesoporcaixa ?? resultados.mediabaixopesoporcaixa,
                produto: values.produto || null,
                categoria: values.categoria || null,
                familia: values.familia || null,
                grupo_produto: values.grupoProduto || null,
                observacoes: values.observacoes ? values.observacoes.toUpperCase() : null,
            };

            // Usa cod_produto ao invés de codigo (campo correto no banco)
            if (values.codigo) {
                dbPayload.cod_produto = values.codigo;
            } else {
                dbPayload.cod_produto = null;
            }

            console.log("Updating registro with ID:", registro.id);
            console.log("Payload:", dbPayload);

            const { data, error } = await supabase
                .from('registros_peso')
                .update(dbPayload)
                .eq('id', registro.id)
                .select();

            if (error) {
                console.error("Supabase update error:", error);
                toast.error(`Erro ao atualizar: ${error.message}`);
                throw error;
            }

            if (!data || data.length === 0) {
                console.error("Nenhum registro foi atualizado");
                toast.error("Nenhum registro foi encontrado para atualizar");
                throw new Error("Nenhum registro atualizado");
            }

            console.log("Update success:", data);
            toast.success("Registro atualizado com sucesso");
            onOpenChange(false);
        } catch (error: any) {
            console.error("Submit error:", error);
            const errorMessage = error?.message || "Erro desconhecido ao atualizar registro";
            toast.error(errorMessage);
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
                <DialogHeader className="px-6 py-4 border-b">
                    <DialogTitle>Editar Registro</DialogTitle>
                    <DialogDescription>
                        Faça as alterações necessárias nos dados do registro.
                    </DialogDescription>
                </DialogHeader>
                
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
                        <ScrollArea className="flex-1 px-6 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-6">
                                <FormField control={form.control} name="filial" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Filial</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loadingFiliais}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione a filial" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {filiaisOpcoes.map((f) => (
                                                    <SelectItem key={f} value={f}>{f}</SelectItem>
                                                ))}
                                                {!filiaisOpcoes.some(f => f === field.value) && field.value && 
                                                  <SelectItem key={`custom-${field.value}`} value={field.value}>{field.value}</SelectItem>
                                                }
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                
                                <FormField control={form.control} name="fornecedor" render={({ field }) => (
                                    <FormItem><FormLabel>Fornecedor</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="produto" render={({ field }) => (
                                    <FormItem><FormLabel>Produto</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="categoria" render={({ field }) => (
                                    <FormItem><FormLabel>Categoria</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="quantidadeRecebida" render={({ field }) => (
                                    <FormItem><FormLabel>Qtd. Recebida</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="pesoLiquidoPorCaixa" render={({ field }) => (
                                    <FormItem><FormLabel>Peso Liq. Cx</FormLabel><FormControl><Input type="number" step="0.01" {...field} onChange={e => field.onChange(Number(e.target.value))} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="modeloTabela" render={({ field }) => (
                                    <FormItem><FormLabel>Modelo Tabela</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="pesoBrutoAnalise" render={({ field }) => (
                                    <FormItem><FormLabel>Peso Bruto Análise</FormLabel><FormControl><Input type="number" step="0.01" {...field} onChange={e => field.onChange(Number(e.target.value))} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="taraCaixa" render={({ field }) => (
                                    <FormItem><FormLabel>Tara Caixa</FormLabel><FormControl><Input type="number" step="0.001" {...field} onChange={e => field.onChange(Number(e.target.value))} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="quantidadebaixopeso" render={({ field }) => (
                                    <FormItem><FormLabel>Qtd. Baixo Peso</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="notaFiscal" render={({ field }) => (
                                    <FormItem><FormLabel>Nota Fiscal</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="codigo" render={({ field }) => (
                                    <FormItem><FormLabel>Código</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="familia" render={({ field }) => (
                                    <FormItem><FormLabel>Família</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="grupoProduto" render={({ field }) => (
                                    <FormItem><FormLabel>Grupo Produto</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="quantidadeTabela" render={({ field }) => (
                                    <FormItem><FormLabel>Qtd. Tabela</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ''} onChange={e => field.onChange(Number(e.target.value) || undefined)} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="pesoLiquidoProgramado" render={({ field }) => (
                                    <FormItem><FormLabel>Peso Líq. Programado (KG)</FormLabel><FormControl><Input type="number" step="0.01" {...field} value={field.value ?? ''} onChange={e => field.onChange(Number(e.target.value) || undefined)} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="pesoLiquidoAnalise" render={({ field }) => (
                                    <FormItem><FormLabel>Peso Líq. Análise (KG)</FormLabel><FormControl><Input type="number" step="0.01" {...field} value={field.value ?? ''} onChange={e => field.onChange(Number(e.target.value) || undefined)} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="pesoLiquidoReal" render={({ field }) => (
                                    <FormItem><FormLabel>Peso Líq. Real (KG)</FormLabel><FormControl><Input type="number" step="0.01" {...field} value={field.value ?? ''} onChange={e => field.onChange(Number(e.target.value) || undefined)} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="perdaKg" render={({ field }) => (
                                    <FormItem><FormLabel>Perda (KG)</FormLabel><FormControl><Input type="number" step="0.01" {...field} value={field.value ?? ''} onChange={e => field.onChange(Number(e.target.value) || undefined)} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="perdaCx" render={({ field }) => (
                                    <FormItem><FormLabel>Perda (CX)</FormLabel><FormControl><Input type="number" step="0.01" {...field} value={field.value ?? ''} onChange={e => field.onChange(Number(e.target.value) || undefined)} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="perdaPercentual" render={({ field }) => (
                                    <FormItem><FormLabel>Perda Percentual (%)</FormLabel><FormControl><Input type="number" step="0.01" {...field} value={field.value ?? ''} onChange={e => field.onChange(Number(e.target.value) || undefined)} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="pesoLiquidoIdealAnalise" render={({ field }) => (
                                    <FormItem><FormLabel>Peso Líq. Ideal Análise (KG)</FormLabel><FormControl><Input type="number" step="0.01" {...field} value={field.value ?? ''} onChange={e => field.onChange(Number(e.target.value) || undefined)} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="pesoLiquidoRealAnalise" render={({ field }) => (
                                    <FormItem><FormLabel>Peso Líq. Real Análise (KG)</FormLabel><FormControl><Input type="number" step="0.01" {...field} value={field.value ?? ''} onChange={e => field.onChange(Number(e.target.value) || undefined)} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="mediaPesoBaixoPorCaixa" render={({ field }) => (
                                    <FormItem><FormLabel>Média Peso Baixo/Caixa (KG)</FormLabel><FormControl><Input type="number" step="0.01" {...field} value={field.value ?? ''} onChange={e => field.onChange(Number(e.target.value) || undefined)} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="percentualqtdcaixascombaixopeso" render={({ field }) => (
                                    <FormItem><FormLabel>% Qtd. Caixas Baixo Peso</FormLabel><FormControl><Input type="number" step="0.01" {...field} value={field.value ?? ''} onChange={e => field.onChange(Number(e.target.value) || undefined)} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="mediaqtdcaixascombaixopeso" render={({ field }) => (
                                    <FormItem><FormLabel>Média Qtd. Caixas Baixo Peso</FormLabel><FormControl><Input type="number" step="0.01" {...field} value={field.value ?? ''} onChange={e => field.onChange(Number(e.target.value) || undefined)} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="mediabaixopesoporcaixa" render={({ field }) => (
                                    <FormItem><FormLabel>Média Baixo Peso/Caixa</FormLabel><FormControl><Input type="number" step="0.01" {...field} value={field.value ?? ''} onChange={e => field.onChange(Number(e.target.value) || undefined)} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="observacoes" render={({ field }) => (
                                    <FormItem className="md:col-span-2 lg:col-span-3"><FormLabel>Observações</FormLabel><FormControl><Textarea {...field} className="uppercase" rows={3} /></FormControl><FormMessage /></FormItem>
                                )} />
                            </div>
                        </ScrollArea>
                        <DialogFooter className="px-6 py-4 border-t bg-muted/50">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>Cancelar</Button>
                            <Button type="submit" disabled={isSaving}>{isSaving ? "Salvando..." : "Salvar Alterações"}</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
