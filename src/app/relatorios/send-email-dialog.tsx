'use client';

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RegistroPeso } from "@/types"
import { generateRegistroPDF } from "@/lib/pdf-generator"
import { supabase, hasSupabaseEnv } from "@/lib/supabase"
import { toast } from "sonner"
import { X } from "lucide-react"
import { format } from "date-fns"

interface SendEmailDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    registro: RegistroPeso
}

export function SendEmailDialog({ open, onOpenChange, registro }: SendEmailDialogProps) {
    const [emails, setEmails] = useState<string[]>([''])
    const [loading, setLoading] = useState(false)
    const [pesagemData, setPesagemData] = useState<any>(null)

    // Buscar dados de pesagem ao abrir
    useEffect(() => {
        if (open && hasSupabaseEnv) {
            supabase
                .from('pesagem')
                .select('*')
                .eq('record_id', registro.id)
                .limit(1)
                .maybeSingle()
                .then(({ data }) => {
                    if (data) setPesagemData(data);
                });
        }
    }, [open, registro.id]);

    const addEmail = () => {
        setEmails([...emails, ''])
    }

    const removeEmail = (index: number) => {
        setEmails(emails.filter((_, i) => i !== index))
    }

    const updateEmail = (index: number, value: string) => {
        const newEmails = [...emails]
        newEmails[index] = value
        setEmails(newEmails)
    }

    const validateEmail = (email: string): boolean => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    }

    const handleSend = async () => {
        const validEmails = emails.filter(e => e.trim() && validateEmail(e.trim()))
        
        if (validEmails.length === 0) {
            toast.error("Adicione pelo menos um email válido")
            return
        }

        setLoading(true)
        try {
            // Buscar evidências
            let evidencias: any[] = [];
            if (hasSupabaseEnv) {
                const { data: evidenciasData } = await supabase
                    .from('evidencias')
                    .select('*')
                    .eq('registro_id', registro.id);
                if (evidenciasData) evidencias = evidenciasData;
            }
            
            // Gerar PDF com evidências
            const pdfBlob = await generateRegistroPDF(registro, pesagemData, evidencias)
            
            // Buscar observações
            let observacoes = '';
            if (hasSupabaseEnv) {
                const { data } = await supabase
                    .from('registros_peso')
                    .select('observacoes')
                    .eq('id', registro.id)
                    .limit(1)
                    .maybeSingle();
                if (data) observacoes = data.observacoes || '';
            }
            
            // Converter PDF para base64
            const reader = new FileReader()
            const pdfBase64 = await new Promise<string>((resolve, reject) => {
                reader.onload = () => {
                    const result = reader.result as string
                    resolve(result.split(',')[1]) // Remove data:application/pdf;base64,
                }
                reader.onerror = reject
                reader.readAsDataURL(pdfBlob)
            })

            // Extrair primeiro nome do fornecedor
            const primeiroNomeFornecedor = (registro.fornecedor || 'N/A').split(' ')[0];
            
            // Formatar data
            const dataFormatada = format(new Date(registro.dataRegistro), 'dd/MM/yyyy');
            
            // Assunto do email
            const assunto = `Relatório de Recebimento - ${registro.filial} - ${dataFormatada} - NF ${registro.notaFiscal || 'N/A'} - ${primeiroNomeFornecedor}`;
            
            // Corpo do email (profissional e corporativo)
            const corpoEmail = `
                <!DOCTYPE html>
                <html lang="pt-BR">
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background-color: #002b1e; color: white; padding: 20px; text-align: center; }
                        .content { background-color: #f9f9f9; padding: 20px; margin-top: 20px; border-radius: 5px; }
                        .info-row { margin: 10px 0; padding: 8px; background: white; border-left: 3px solid #002b1e; }
                        .label { font-weight: bold; color: #002b1e; }
                        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid #002b1e; color: #666; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h2 style="margin: 0;">Relatório de Recebimento</h2>
                            <p style="margin: 5px 0;">CheckPeso - Sistema de Gestão</p>
                        </div>
                        
                        <div class="content">
                            <p>Prezados,</p>
                            <p>Segue em anexo o relatório detalhado do recebimento da carga.</p>
                            
                            <div class="info-row">
                                <span class="label">Filial:</span> ${registro.filial || 'N/A'}
                            </div>
                            
                            <div class="info-row">
                                <span class="label">Data:</span> ${dataFormatada}
                            </div>
                            
                            <div class="info-row">
                                <span class="label">Fornecedor:</span> ${registro.fornecedor || 'N/A'}
                            </div>
                            
                            <div class="info-row">
                                <span class="label">NF:</span> ${registro.notaFiscal || 'N/A'}
                            </div>
                            
                            <div class="info-row">
                                <span class="label">Produto:</span> ${registro.codigo || 'N/A'} - ${registro.produto || 'N/A'}
                            </div>
                            
                            <div class="info-row">
                                <span class="label">Quantidade NF:</span> ${registro.quantidadeRecebida} CAIXAS
                            </div>
                            
                            <div class="info-row">
                                <span class="label">Resultado:</span> ${registro.perdaCx?.toFixed(2) || '0.00'} Caixas
                            </div>
                        </div>
                        
                        <div class="footer">
                            <p><strong>Grupo Docemel</strong></p>
                            <p>APP CHECKPESO - GDM</p>
                        </div>
                    </div>
                </body>
                </html>
            `;
            
            // Enviar via Edge Function
            if (hasSupabaseEnv) {
                const { data, error } = await supabase.functions.invoke('send-email', {
                    body: {
                        to: validEmails,
                        subject: assunto,
                        html: corpoEmail,
                        pdfBase64,
                        pdfFileName: `Relatorio_Recebimento_${registro.filial}_${registro.notaFiscal || 'N/A'}.pdf`
                    }
                })

                if (error) {
                    console.error('Erro ao enviar email:', error)
                    throw error
                }

                toast.success(`Email enviado com sucesso para ${validEmails.length} destinatário(s)!`)
                onOpenChange(false)
                setEmails([''])
            } else {
                // Fallback: usar mailto com PDF em base64 (limitado)
                toast.warning('Supabase não configurado. Use a função send-email no Supabase para envio automático.')
            }
        } catch (error: any) {
            console.error("Erro ao enviar email:", error)
            toast.error(`Erro ao enviar email: ${error?.message || 'Erro desconhecido'}`)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Enviar Relatório por Email</DialogTitle>
                    <DialogDescription>
                        Digite os emails dos destinatários. O relatório será enviado em PDF.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                    {emails.map((email, index) => (
                        <div key={index} className="flex gap-2">
                            <Input
                                type="email"
                                placeholder="email@exemplo.com"
                                value={email}
                                onChange={(e) => updateEmail(index, e.target.value)}
                                className="flex-1"
                            />
                            {emails.length > 1 && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeEmail(index)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    ))}
                    
                    <Button
                        type="button"
                        variant="outline"
                        onClick={addEmail}
                        className="w-full"
                    >
                        Adicionar Email
                    </Button>
                </div>
                
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSend} disabled={loading}>
                        {loading ? 'Enviando...' : 'Enviar Email'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

