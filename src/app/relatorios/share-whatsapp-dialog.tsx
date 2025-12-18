'use client';

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { RegistroPeso } from "@/types"
import { generateWhatsAppMessage, openWhatsApp } from "@/lib/whatsapp-message"
import { supabase, hasSupabaseEnv } from "@/lib/supabase"
import { toast } from "sonner"

interface ShareWhatsAppDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    registro: RegistroPeso
}

export function ShareWhatsAppDialog({ open, onOpenChange, registro }: ShareWhatsAppDialogProps) {
    const [loading, setLoading] = useState(false)

    const handleShare = async () => {
        setLoading(true)
        try {
            let pesagemData = null;
            
            // Buscar dados de pesagem se disponível
            if (hasSupabaseEnv) {
                try {
                    const { data, error } = await supabase
                        .from('pesagem')
                        .select('*')
                        .eq('record_id', registro.id)
                        .limit(1)
                        .maybeSingle();
                    
                    if (!error && data) {
                        pesagemData = data;
                    }
                } catch (e) {
                    console.warn('Erro ao buscar dados de pesagem:', e);
                }
            }
            
            // Buscar observações do registro
            if (hasSupabaseEnv) {
                try {
                    const { data: regData } = await supabase
                        .from('registros_peso')
                        .select('observacoes')
                        .eq('id', registro.id)
                        .limit(1)
                        .maybeSingle();
                    
                    if (regData) {
                        (registro as any).observacoes = regData.observacoes || '';
                    }
                } catch (e) {
                    console.warn('Erro ao buscar observações:', e);
                }
            }
            
            const message = await generateWhatsAppMessage(registro, pesagemData);
            openWhatsApp(message);
            onOpenChange(false);
        } catch (error: any) {
            console.error("Erro ao gerar mensagem WhatsApp:", error);
            toast.error("Erro ao gerar mensagem do WhatsApp");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Compartilhar no WhatsApp</DialogTitle>
                    <DialogDescription>
                        O resumo do registro será gerado e aberto no WhatsApp para compartilhamento.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button onClick={handleShare} disabled={loading}>
                        {loading ? 'Gerando...' : 'Abrir WhatsApp'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

