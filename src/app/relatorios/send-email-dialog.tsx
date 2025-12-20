'use client';

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { RegistroPeso } from "@/types"
import { generateRegistroPDF } from "@/lib/pdf-generator"
import { supabase, hasSupabaseEnv } from "@/lib/supabase"
import { toast } from "sonner"
import { X, Building2, ShoppingCart, Users } from "lucide-react"
import { format } from "date-fns"

// Listas de emails por filial
const EMAILS_FILIAIS = {
    ITAITINGA_CE: [
        'estoque.ce@frutasdocemel.com.br',
        'evaldo.domingos@frutasdocemel.com.br',
        'josimar.mendes@frutasdocemel.com.br',
        'qualidadece@frutasdocemel.com.br',
        'emanuella.sousa@frutasdocemel.com.br',
        'rayane.lima@frutasdocemel.com.br',
        'jose.cordeiro@frutasdocemel.com.br',
        'jose.jonas@frutasdocemel.com.br',
        'faturamentoce@frutasdocemel.com.br',
        'marcelo.barbosa@frutasdocemel.com.br',
        'osmar.teixeira@frutasdocemel.com.br',
        'rosane.sales@frutasdocemel.com.br',
        'francisco.lima@frutasdocemel.com.br',
        'jenilson.rodrigues@frutasdocemel.com.br',
        'leticia.pontes@frutasdocemel.com.br',
        'ingrid.andrade@frutasdocemel.com.br',
        'leticia.flor@frutasdocemel.com.br',
        'contasapagar@frutasdocemel.com.br',
        'agnaldo.junior@frutasdocemel.com.br',
        'logistica.operacionalce@frutasdocemel.com.br',
        'expedicaoce@frutasdocemel.com.br',
        'robertojr@frutasdocemel.com.br',
        'ricardo.farias@frutasdocemel.com.br',
        'gilson.neto@frutasdocemel.com.br',
        'custos@frutasdocemel.com.br',
        'joao.falcao@frutasdocemel.com.br',
        'ravanelle.nascimento@frutasdocemel.com.br',
        'adm.salvador@frutasdocemel.com.br',
        'marcia.santos@frutasdocemel.com.br'
    ],
    BA_CEASA: [
        'josimar.mendes@frutasdocemel.com.br',
        'adm.salvador@frutasdocemel.com.br',
        'marcia.santos@frutasdocemel.com.br',
        'qualidade.ba@frutasdocemel.com.br',
        'Isis.araujo@frutasdocemel.com.br',
        'aline.sampaio@frutasdocemel.com.br',
        'gleber.jesus@frutasdocemel.com.br',
        'logistica.ba@frutasdocemel.com.br',
        'ingrid.andrade@frutasdocemel.com.br',
        'leticia.pontes@frutasdocemel.com.br',
        'leticia.flor@frutasdocemel.com.br',
        'jessica.louvores@frutasdocemel.com.br',
        'contasapagar@frutasdocemel.com.br',
        'agnaldo.junior@frutasdocemel.com.br',
        'viviane.dantas@frutasdocemel.com.br',
        'robertojr@frutasdocemel.com.br',
        'obedysjr@gmail.com',
        'ricardo.farias@frutasdocemel.com.br',
        'gilson.neto@frutasdocemel.com.br',
        'custos@frutasdocemel.com.br',
        'cdsimoesfilho@frutasdocemel.com.br',
        'joao.falcao@frutasdocemel.com.br',
        'livia.santos@frutasdocemel.com.br',
        'elisangela.ferreira@frutasdocemel.com.br',
        'faturamentosalvador@frutasdocemel.com.br',
        'bruno.santiago@frutasdocemel.com.br',
        'rivaldo.lopes@frutasdocemel.com.br',
        'daniel.jesus@frutasdocemel.com.br'
    ],
    PAULISTA_PE: [
        'recebimentocdpaulista@frutasdocemel.com.br',
        'expedicao.cdpe@frutasdocemel.com.br',
        'administrativo.pe@frutasdocemel.com.br',
        'sharles.bras@frutasdocemel.com.br',
        'kelven.queiroz@frutasdocemel.com.br',
        'antony.matheus@frutasdocemel.com.br',
        'pedidoscdpe@frutasdocemel.com.br',
        'ingrid.andrade@frutasdocemel.com.br',
        'leticia.flor@frutasdocemel.com.br',
        'leticia.pontes@frutasdocemel.com.br',
        'contasapagar@frutasdocemel.com.br',
        'robertojr@frutasdocemel.com.br',
        'agnaldo.junior@frutasdocemel.com.br',
        'ricardo.farias@frutasdocemel.com.br',
        'gilson.neto@frutasdocemel.com.br',
        'custos@frutasdocemel.com.br',
        'josimar.mendes@frutasdocemel.com.br',
        'joao.falcao@frutasdocemel.com.br',
        'manoel.andre@frutasdocemel.com.br',
        'logisticape01@frutasdocemel.com.br',
        'estoque.cdpe@frutasdocemel.com.br',
        'adm.salvador@frutasdocemel.com.br',
        'marcia.santos@frutasdocemel.com.br'
    ],
    MAMANGUAPE_BARAUNA: [
        'coordenadordeproducao@frutasdocemel.com.br',
        'devolucoes@frutasdocemel.com.br',
        'dyego.winklyffi@frutasdocemel.com.br',
        'mario.marcelo@frutasdocemel.com.br',
        'emmanuel.souza@frutasdocemel.com.br',
        'ingrid.andrade@frutasdocemel.com.br',
        'leticia.flor@frutasdocemel.com.br',
        'leticia.pontes@frutasdocemel.com.br',
        'contasapagar@frutasdocemel.com.br',
        'expedicao@frutasdocemel.com.br',
        'agnaldo.junior@frutasdocemel.com.br',
        'robertojr@frutasdocemel.com.br',
        'ricardo.farias@frutasdocemel.com.br',
        'gilson.neto@frutasdocemel.com.br',
        'rivaldo.lopes@frutasdocemel.com.br',
        'joao.falcao@frutasdocemel.com.br',
        'custos@frutasdocemel.com.br',
        'josimar.mendes@frutasdocemel.com.br',
        'guilherme.goncalves@frutasdocemel.com.br',
        'adm.salvador@frutasdocemel.com.br',
        'marcia.santos@frutasdocemel.com.br'
    ]
}

// Lista de emails do Setor de Compras
const EMAILS_COMPRAS = [
    { email: 'import@frutasdocemel.com.br', nome: 'Import' },
    { email: 'monique.dantas@frutasdocemel.com.br', nome: 'Monique Dantas' },
    { email: 'maria.deusdedite@frutasdocemel.com.br', nome: 'Maria Deusdedite' },
    { email: 'sydney.noronha@frutasdocemel.com.br', nome: 'Sydney Noronha' },
    { email: 'fabricio.nascimento@frutasdocemel.com.br', nome: 'Fabrício Nascimento' }
]

interface SendEmailDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    registro: RegistroPeso
}

export function SendEmailDialog({ open, onOpenChange, registro }: SendEmailDialogProps) {
    // Estados para as seleções de filiais
    const [filialItaitinga, setFilialItaitinga] = useState(false)
    const [filialBaCeasa, setFilialBaCeasa] = useState(false)
    const [filialPaulista, setFilialPaulista] = useState(false)
    const [filialMamanguape, setFilialMamanguape] = useState(false)
    
    // Estados para emails do setor de compras (multisseleção individual)
    const [emailsComprasSelecionados, setEmailsComprasSelecionados] = useState<string[]>([])
    
    // Estados para emails de fornecedores (digitação manual)
    const [emailsFornecedores, setEmailsFornecedores] = useState<string[]>([''])
    
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

    // Resetar estados ao fechar
    useEffect(() => {
        if (!open) {
            setFilialItaitinga(false)
            setFilialBaCeasa(false)
            setFilialPaulista(false)
            setFilialMamanguape(false)
            setEmailsComprasSelecionados([])
            setEmailsFornecedores([''])
        }
    }, [open])

    const addEmailFornecedor = () => {
        setEmailsFornecedores([...emailsFornecedores, ''])
    }

    const removeEmailFornecedor = (index: number) => {
        setEmailsFornecedores(emailsFornecedores.filter((_, i) => i !== index))
    }

    const updateEmailFornecedor = (index: number, value: string) => {
        const newEmails = [...emailsFornecedores]
        newEmails[index] = value
        setEmailsFornecedores(newEmails)
    }

    const toggleEmailCompras = (email: string) => {
        setEmailsComprasSelecionados(prev => 
            prev.includes(email) 
                ? prev.filter(e => e !== email)
                : [...prev, email]
        )
    }

    const validateEmail = (email: string): boolean => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    }

    // Função para coletar todos os emails selecionados
    const getAllSelectedEmails = (): string[] => {
        const emails: string[] = []
        
        // Adicionar emails das filiais selecionadas
        if (filialItaitinga) emails.push(...EMAILS_FILIAIS.ITAITINGA_CE)
        if (filialBaCeasa) emails.push(...EMAILS_FILIAIS.BA_CEASA)
        if (filialPaulista) emails.push(...EMAILS_FILIAIS.PAULISTA_PE)
        if (filialMamanguape) emails.push(...EMAILS_FILIAIS.MAMANGUAPE_BARAUNA)
        
        // Adicionar emails do setor de compras selecionados
        emails.push(...emailsComprasSelecionados)
        
        // Adicionar emails de fornecedores válidos
        const fornecedoresValidos = emailsFornecedores
            .filter(e => e.trim() && validateEmail(e.trim()))
        emails.push(...fornecedoresValidos)
        
        // Remover duplicatas
        return [...new Set(emails)]
    }

    const handleSend = async () => {
        const allEmails = getAllSelectedEmails()
        
        if (allEmails.length === 0) {
            toast.error("Selecione pelo menos uma filial, email de compras ou adicione um email de fornecedor válido")
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
            
            // Enviar via Edge Function (todos os emails diretamente no campo TO)
            if (hasSupabaseEnv) {
                const { data, error } = await supabase.functions.invoke('send-email', {
                    body: {
                        to: allEmails, // Todos os emails selecionados vão diretamente como destinatários
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

                toast.success(`Email enviado com sucesso para ${allEmails.length} destinatário(s)!`)
                onOpenChange(false)
            } else {
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
            <DialogContent className="max-w-3xl max-h-[85vh]">
                <DialogHeader>
                    <DialogTitle>Enviar Relatório por Email</DialogTitle>
                    <DialogDescription>
                        Selecione as filiais, emails de compras e adicione emails de fornecedores. 
                        Todos receberão o relatório em PDF como destinatários.
                    </DialogDescription>
                </DialogHeader>
                
                <ScrollArea className="max-h-[calc(85vh-200px)] pr-4">
                    <div className="space-y-6 py-4">
                        {/* SEÇÃO: FILIAIS */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 mb-3">
                                <Building2 className="h-5 w-5 text-primary" />
                                <h3 className="font-semibold text-base">Listas de Filiais</h3>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">
                                Selecione uma ou mais filiais para incluir todos os emails automaticamente:
                            </p>
                            
                            <div className="space-y-2 pl-2">
                                <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                                    <Checkbox 
                                        id="filial-itaitinga"
                                        checked={filialItaitinga}
                                        onCheckedChange={(checked) => setFilialItaitinga(checked as boolean)}
                                    />
                                    <label 
                                        htmlFor="filial-itaitinga" 
                                        className="flex-1 text-sm font-medium cursor-pointer"
                                    >
                                        CD Itaitinga CE ({EMAILS_FILIAIS.ITAITINGA_CE.length} emails)
                                    </label>
                                </div>
                                
                                <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                                    <Checkbox 
                                        id="filial-ba"
                                        checked={filialBaCeasa}
                                        onCheckedChange={(checked) => setFilialBaCeasa(checked as boolean)}
                                    />
                                    <label 
                                        htmlFor="filial-ba" 
                                        className="flex-1 text-sm font-medium cursor-pointer"
                                    >
                                        CD BA / CEASA BA ({EMAILS_FILIAIS.BA_CEASA.length} emails)
                                    </label>
                                </div>
                                
                                <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                                    <Checkbox 
                                        id="filial-paulista"
                                        checked={filialPaulista}
                                        onCheckedChange={(checked) => setFilialPaulista(checked as boolean)}
                                    />
                                    <label 
                                        htmlFor="filial-paulista" 
                                        className="flex-1 text-sm font-medium cursor-pointer"
                                    >
                                        Trielo CD Paulista PE ({EMAILS_FILIAIS.PAULISTA_PE.length} emails)
                                    </label>
                                </div>
                                
                                <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                                    <Checkbox 
                                        id="filial-mamanguape"
                                        checked={filialMamanguape}
                                        onCheckedChange={(checked) => setFilialMamanguape(checked as boolean)}
                                    />
                                    <label 
                                        htmlFor="filial-mamanguape" 
                                        className="flex-1 text-sm font-medium cursor-pointer"
                                    >
                                        FST Mamanguape PB / Baraúna RN ({EMAILS_FILIAIS.MAMANGUAPE_BARAUNA.length} emails)
                                    </label>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* SEÇÃO: SETOR DE COMPRAS */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 mb-3">
                                <ShoppingCart className="h-5 w-5 text-primary" />
                                <h3 className="font-semibold text-base">Setor de Compras</h3>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">
                                Selecione um ou mais emails individualmente:
                            </p>
                            
                            <div className="space-y-2 pl-2">
                                {EMAILS_COMPRAS.map(({ email, nome }) => (
                                    <div key={email} className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                                        <Checkbox 
                                            id={`compras-${email}`}
                                            checked={emailsComprasSelecionados.includes(email)}
                                            onCheckedChange={() => toggleEmailCompras(email)}
                                        />
                                        <label 
                                            htmlFor={`compras-${email}`}
                                            className="flex-1 text-sm cursor-pointer"
                                        >
                                            <span className="font-medium">{nome}</span>
                                            <span className="text-muted-foreground text-xs ml-2">({email})</span>
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <Separator />

                        {/* SEÇÃO: EMAILS DE FORNECEDORES */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 mb-3">
                                <Users className="h-5 w-5 text-primary" />
                                <h3 className="font-semibold text-base">Emails de Fornecedores</h3>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">
                                Digite manualmente os emails dos fornecedores:
                            </p>
                            
                            <div className="space-y-2">
                                {emailsFornecedores.map((email, index) => (
                                    <div key={index} className="flex gap-2">
                                        <Input
                                            type="email"
                                            placeholder="fornecedor@exemplo.com"
                                            value={email}
                                            onChange={(e) => updateEmailFornecedor(index, e.target.value)}
                                            className="flex-1"
                                        />
                                        {emailsFornecedores.length > 1 && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeEmailFornecedor(index)}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                                
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={addEmailFornecedor}
                                    className="w-full"
                                    size="sm"
                                >
                                    + Adicionar Email de Fornecedor
                                </Button>
                            </div>
                        </div>

                        {/* RESUMO */}
                        {getAllSelectedEmails().length > 0 && (
                            <>
                                <Separator />
                                <div className="p-4 bg-muted/50 rounded-lg">
                                    <p className="text-sm font-medium mb-2">
                                        Total de destinatários selecionados: <span className="text-primary font-bold">{getAllSelectedEmails().length}</span>
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Todos receberão o relatório em PDF por email
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                </ScrollArea>
                
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

