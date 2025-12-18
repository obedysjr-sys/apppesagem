import { format } from 'date-fns';
import { RegistroPeso } from '@/types';

export async function generateWhatsAppMessage(
    registro: RegistroPeso,
    pesagemData?: { campo_1?: number | null; campo_2?: number | null; [key: string]: any }
): Promise<string> {
    let message = "";
    
    message += "📟🍍*RELATÓRIO DO RECEBIMENTO*🍍📟\n\n";
    
    message += `🗓️ *DATA:* ${format(registro.dataRegistro, 'dd/MM/yyyy')}\n`;
    message += `🏢 *FILIAL:* ${registro.filial || 'SEM INFORMAÇÃO'}\n`;
    message += `🪪 *FORNECEDOR:* ${registro.fornecedor || 'SEM INFORMAÇÃO'}\n`;
    message += `📄 *NOTA FISCAL:* ${registro.notaFiscal || 'SEM INFORMAÇÃO'}\n`;
    message += ` *PRODUTO:* ${registro.produto || 'SEM INFORMAÇÃO'}\n`;
    message += "-----\n";
    
    message += `*-- DADOS DA PESAGEM --*\n`;
    message += `🔄️ *QTD. TOTAL RECEBIDA:* ${registro.quantidadeRecebida || 'SEM INFORMAÇÃO'} CX\n`;
    message += `🔄️ *PESO LÍQUIDO TOTAL PROGRAMADO:* ${registro.pesoLiquidoProgramado?.toFixed(2) || 'SEM INFORMAÇÃO'} KG\n`;
    message += `🔄️ *PESO LÍQUIDO POR CX:* ${registro.pesoLiquidoPorCaixa?.toFixed(2) || 'SEM INFORMAÇÃO'} KG\n`;
    message += `🔄️ *TARA DA CAIXA:* ${registro.taraCaixa?.toFixed(2) || 'SEM INFORMAÇÃO'} KG\n`;
    message += `🔄️ *QTD. ANALISADA:* ${registro.quantidadeTabela || 'SEM INFORMAÇÃO'}\n`;
    message += `🔄️ *QTD. BAIXO PESO:* ${registro.quantidadebaixopeso || 'SEM INFORMAÇÃO'}\n`;
    message += `🔄️ *PESO BRUTO DA ANÁLISE:* ${registro.pesoBrutoAnalise?.toFixed(2) || 'SEM INFORMAÇÃO'} KG\n`;
    message += `🔄️ *PESO LÍQUIDO DA ANÁLISE:* ${registro.pesoLiquidoAnalise?.toFixed(2) || 'SEM INFORMAÇÃO'} KG\n`;
    message += "-----\n";
    
    // Resumo da Pesagem
    if (pesagemData) {
        const allItems: Array<{ value: number; baixoPeso: boolean }> = [];
        const threshold = (Number(registro.pesoLiquidoPorCaixa) || 0) + (Number(registro.taraCaixa) || 0);
        
        for (let i = 1; i <= 50; i++) {
            const campo = pesagemData[`campo_${i}`];
            if (campo && Number(campo) > 0) {
                const kg = Number(campo);
                const baixoPeso = kg < threshold;
                allItems.push({ value: kg, baixoPeso });
            }
        }
        
        message += `*-- RESUMO DA PESAGEM --*\n`;
        if (allItems.length > 0) {
            for (const it of allItems) {
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
    }
    
    message += `*-- RESULTADOS --*\n`;
    const percentualAnaliseBaixoPeso = registro.quantidadeTabela > 0 
        ? (((Number(registro.quantidadebaixopeso) || 0) / registro.quantidadeTabela) * 100) 
        : 0;
    message += `📈 *% DA ANÁLISE DE BAIXO PESO:* ${percentualAnaliseBaixoPeso.toFixed(2)} %\n`;
    message += `📟 *PESO LÍQUIDO REAL DA CARGA:* ${registro.pesoLiquidoReal?.toFixed(2) || 'SEM INFORMAÇÃO'} KG\n`;
    message += `🔴 *PERDA EM KG:* ${registro.perdaKg?.toFixed(2) || 'SEM INFORMAÇÃO'} KG\n`;
    message += `🔴 *PERDA EM CX:* ${registro.perdaCx?.toFixed(2) || 'SEM INFORMAÇÃO'} CX\n`;
    message += `💲 *% PERDA DA CARGA:* ${registro.perdaPercentual?.toFixed(2) || 'SEM INFORMAÇÃO'} %\n`;
    message += "-----\n";
    
    // Buscar observações do banco se disponível
    const observacoes = (registro as any).observacoes || '';
    message += `💬 *OBSERVAÇÕES:* ${observacoes.toUpperCase() || 'SEM INFORMAÇÃO'}\n\n`;
    
    message += "📟🥝APP CHECKPESO - GDM🍎📟";
    
    return message;
}

export function openWhatsApp(message: string) {
    const mensagemCodificada = encodeURIComponent(message);
    const link = `https://api.whatsapp.com/send?text=${mensagemCodificada}`;
    window.open(link, "_blank");
}

