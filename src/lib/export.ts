import { RegistroPeso } from "@/types";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from 'xlsx';
import { format } from "date-fns";
// Carrega a logo em data URL (base64) em tempo de execução e mantém em cache.
let cachedLogoDataUrl: string | null = null;
const getLogoDataUrl = async (): Promise<string | null> => {
  if (cachedLogoDataUrl) return cachedLogoDataUrl;
  try {
    const res = await fetch('/logo.png');
    if (!res.ok) return null;
    const blob = await res.blob();
    await new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        cachedLogoDataUrl = typeof reader.result === 'string' ? reader.result : null;
        resolve();
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
    return cachedLogoDataUrl;
  } catch {
    return null;
  }
};

// Remove acentos e caracteres especiais problemáticos
const normalizeText = (value: string | undefined | null): string => {
  const s = (value ?? '').toString();
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacríticos
    .replace(/[^\w\s\-./]/g, ''); // remove especiais mantendo letras, números, espaço, -, ., /
};

// Função para exportar dados para XLSX
export const exportToXlsx = async (data: RegistroPeso[], fileName: string) => {
    // Try to use exceljs for styled header; fallback to plain XLSX if not available
    try {
        const ExcelJSModule = await import('exceljs');
        const ExcelJS: any = (ExcelJSModule as any)?.default ?? ExcelJSModule;
        const wb = new ExcelJS.Workbook();
        const ws = wb.addWorksheet('Relatório');
        const header = [
            'Data', 'Filial', 'Categoria', 'Modelo Tabela', 'Qtd. Recebida', 'Qtd. Tabela',
            'Peso Líq. por Caixa (KG)', 'Tara por Caixa (KG)', 'Tara Total (KG)', 'Qtd. Baixo Peso',
            'Peso Bruto Analise (KG)', 'Peso Analisado (KG)', 'Peso Real (KG)',
            'Perda (KG)', 'Perda (CX)', 'Perda (%)', 'Fornecedor', 'NF', 'Código', 'Produto', 'Família', 'Grupo Produto',
            // Novas colunas
            'Peso Ideal (Análise) (KG)',
            'Falta de Peso (Análise) (KG)',
            'Média Líq./CX Analisada (KG)',
            '% Cxs Baixo Peso (Amostra)',
            'Média Cxs Baixo Peso (Carga)',
            'Média Baixo Peso por CX (KG)'
        ];
        ws.addRow(header);
        // Style header row (green background, bold)
        const headerRow = ws.getRow(1);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF22A34A' } };
        headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
        headerRow.height = 22;
        // Data rows
        data.forEach(item => {
            const taraTotal = (item.quantidadebaixopeso ?? 0) * (item.taraCaixa ?? 0);
            ws.addRow([
                format(item.dataRegistro, 'dd/MM/yyyy'),
                normalizeText(item.filial),
                normalizeText(item.categoria),
                normalizeText(item.modeloTabela),
                item.quantidadeRecebida,
                item.quantidadeTabela,
      Number(item.pesoLiquidoPorCaixa.toFixed(2)),
      Number(item.taraCaixa.toFixed(2)),
      Number(taraTotal.toFixed(2)),
                item.quantidadebaixopeso,
      Number(item.pesoBrutoAnalise.toFixed(2)),
      Number(item.pesoLiquidoAnalise.toFixed(2)),
      Number(item.pesoLiquidoReal.toFixed(2)),
      Number(item.perdaKg.toFixed(2)),
                Number(item.perdaCx.toFixed(2)),
                Number(item.perdaPercentual.toFixed(2)),
                normalizeText(item.fornecedor),
                normalizeText(item.notaFiscal),
                normalizeText(item.codigo),
                normalizeText(item.produto),
                normalizeText(item.familia),
                normalizeText(item.grupoProduto),
                Number((item.pesoLiquidoIdealAnalise ?? 0).toFixed(2)),
                Number((item.pesoLiquidoRealAnalise ?? 0).toFixed(2)),
                Number((item.mediaPesoBaixoPorCaixa ?? 0).toFixed(2)),
                Number((((item.percentualqtdcaixascombaixopeso ?? 0) * 100)).toFixed(2)),
                Number((item.mediaqtdcaixascombaixopeso ?? 0).toFixed(2)),
                Number((item.mediabaixopesoporcaixa ?? 0).toFixed(3)),
            ]);
        });
        // Auto filter and sizing
        ws.autoFilter = {
            from: { row: 1, column: 1 },
            to: { row: 1, column: header.length },
        } as any;
        ws.columns = header.map((h) => ({ header: h, width: Math.max(14, h.length + 2) }));
        ws.views = [{ state: 'frozen', ySplit: 1 }];
        const buf = await wb.xlsx.writeBuffer();
        const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${fileName}.xlsx`;
        a.click();
        URL.revokeObjectURL(url);
        return;
    } catch (e) {
        console.warn('exceljs not available, falling back to plain XLSX export.', e);
    }
    // Fallback: basic export without styles
    const worksheet = XLSX.utils.json_to_sheet(data.map(item => {
        const taraTotal = (item.quantidadebaixopeso ?? 0) * (item.taraCaixa ?? 0);
        return {
            'Data': format(item.dataRegistro, 'dd/MM/yyyy'),
            'Filial': normalizeText(item.filial),
            'Categoria': normalizeText(item.categoria),
            'Modelo Tabela': normalizeText(item.modeloTabela),
      'Peso Programado (KG)': item.pesoLiquidoProgramado.toFixed(2),
            'Qtd. Recebida': item.quantidadeRecebida,
            'Qtd. Tabela': item.quantidadeTabela,
      'Tara por Caixa (KG)': item.taraCaixa.toFixed(2),
      'Tara Total (KG)': taraTotal.toFixed(2),
            'Qtd. Baixo Peso': item.quantidadebaixopeso,
      'Peso Bruto Analise (KG)': item.pesoBrutoAnalise.toFixed(2),
      'Peso Liquido por Caixa (KG)': item.pesoLiquidoPorCaixa.toFixed(2),
      'Peso Analisado (KG)': item.pesoLiquidoAnalise.toFixed(2),
      'Peso Real (KG)': item.pesoLiquidoReal.toFixed(2),
      'Perda (KG)': item.perdaKg.toFixed(2),
            'Perda (CX)': item.perdaCx.toFixed(2),
            'Perda (%)': item.perdaPercentual.toFixed(2),
            'Fornecedor': normalizeText(item.fornecedor),
            'NF': normalizeText(item.notaFiscal),
            'Código': normalizeText(item.codigo),
            'Produto': normalizeText(item.produto),
            'Família': normalizeText(item.familia),
            'Grupo Produto': normalizeText(item.grupoProduto),
            'Peso Ideal (Análise) (KG)': (item.pesoLiquidoIdealAnalise ?? 0).toFixed(2),
            'Falta de Peso (Análise) (KG)': (item.pesoLiquidoRealAnalise ?? 0).toFixed(2),
            'Média Líq./CX Analisada (KG)': (item.mediaPesoBaixoPorCaixa ?? 0).toFixed(2),
            '% Cxs Baixo Peso (Amostra)': (((item.percentualqtdcaixascombaixopeso ?? 0) * 100)).toFixed(2),
            'Média Cxs Baixo Peso (Carga)': (item.mediaqtdcaixascombaixopeso ?? 0).toFixed(2),
            'Média Baixo Peso por CX (KG)': (item.mediabaixopesoporcaixa ?? 0).toFixed(3),
        };
    }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Relatório");
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
};

// Helper para carregar imagem como base64
async function loadImageAsBase64(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Failed to get canvas context'));
                return;
            }
            
            ctx.drawImage(img, 0, 0);
            const dataURL = canvas.toDataURL('image/jpeg', 0.6);
            resolve(dataURL);
        };
        
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = url;
    });
}

// Função para exportar dados para PDF profissional
export const exportToPdf = async (data: RegistroPeso[], title: string) => {
    const doc = new jsPDF();

    // Buscar evidências e pesagens de todos os registros
    let todasEvidencias: { [key: string]: any[] } = {};
    let todasPesagens: { [key: string]: any } = {};
    
    try {
        const { supabase, hasSupabaseEnv } = await import('@/lib/supabase');
        if (hasSupabaseEnv) {
            const registroIds = data.map(r => r.id);
            
            // Buscar evidências
            const { data: evidenciasData } = await supabase
                .from('evidencias')
                .select('*')
                .in('registro_id', registroIds);
            
            if (evidenciasData) {
                evidenciasData.forEach(ev => {
                    const regId = ev.registro_id;
                    if (!todasEvidencias[regId]) todasEvidencias[regId] = [];
                    todasEvidencias[regId].push(ev);
                });
            }
            
            // Buscar pesagens
            const { data: pesagensData } = await supabase
                .from('pesagem')
                .select('*')
                .in('record_id', registroIds);
            
            if (pesagensData) {
                pesagensData.forEach((p: any) => {
                    todasPesagens[p.record_id] = p;
                });
            }
        }
    } catch (error) {
        console.error('Erro ao buscar dados:', error);
    }

    // Totais gerais
    const totalRegistros = data.length;
    const totalPerdaKg = data.reduce((sum, item) => sum + item.perdaKg, 0);
    const totalPerdaCx = data.reduce((sum, item) => sum + item.perdaCx, 0);
    const mediaPerdaPercentual = totalRegistros > 0
      ? data.reduce((sum, item) => {
          const base = Math.max(item.pesoLiquidoAnalise || 0, 1);
          const perc = (item.perdaKg / base) * 100;
          return sum + perc;
        }, 0) / totalRegistros
      : 0;
    
    // Novos totais das pesagens
    let totalDigitado = 0;
    let totalBaixoPeso = 0;
    let qtdBaixoPeso = 0;
    
    Object.values(todasPesagens).forEach((p: any) => {
        totalDigitado += Number(p.total_digitado || p['total digitado'] || p.totalDigitado || 0);
        totalBaixoPeso += Number(p.total_baixo_peso || p['total baixo peso'] || p.totalBaixoPeso || 0);
        qtdBaixoPeso += Number(p.qtd_baixo_peso || p['qtd baixo peso'] || p.qtdBaixoPeso || 0);
    });

    // Header
    const logoDataUrl = await getLogoDataUrl();
    if (logoDataUrl) {
        try { doc.addImage(logoDataUrl, 'PNG', 14, 10, 20, 20); } catch {}
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(normalizeText("CHECKPESO - GDM"), 40, 18);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(normalizeText(`Relatorio de Pesagem - ${title}`), 40, 25);
    
    // Extrair informações de filtros dos dados
    const filiais = [...new Set(data.map(d => d.filial).filter(Boolean))];
    const fornecedores = [...new Set(data.map(d => d.fornecedor).filter(Boolean))];
    const notasFiscais = [...new Set(data.map(d => d.notaFiscal).filter(Boolean))];
    const dataInicio = data.length > 0 ? new Date(Math.min(...data.map(d => new Date(d.dataRegistro).getTime()))) : null;
    const dataFim = data.length > 0 ? new Date(Math.max(...data.map(d => new Date(d.dataRegistro).getTime()))) : null;
    
    // Informações de filtros (lado direito)
    let infoY = 10;
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.setFont("helvetica", "normal");
    
    if (filiais.length > 0) {
        const filiaisText = filiais.length === 1 
            ? normalizeText(filiais[0]) 
            : normalizeText(`${filiais.length} filiais`);
        doc.text(`Filial: ${filiaisText}`, 196, infoY, { align: 'right' });
        infoY += 5;
    }
    
    if (fornecedores.length > 0) {
        const fornText = fornecedores.length === 1 
            ? normalizeText(fornecedores[0]).substring(0, 25) 
            : normalizeText(`${fornecedores.length} fornecedores`);
        doc.text(`Fornecedor: ${fornText}`, 196, infoY, { align: 'right' });
        infoY += 5;
    }
    
    if (notasFiscais.length > 0) {
        const nfText = notasFiscais.length === 1 
            ? normalizeText(notasFiscais[0]) 
            : normalizeText(`${notasFiscais.length} NFs`);
        doc.text(`NF: ${nfText}`, 196, infoY, { align: 'right' });
        infoY += 5;
    }
    
    if (dataInicio && dataFim) {
        const periodoText = dataInicio.getTime() === dataFim.getTime()
            ? format(dataInicio, 'dd/MM/yyyy')
            : `${format(dataInicio, 'dd/MM/yy')} a ${format(dataFim, 'dd/MM/yy')}`;
        doc.text(normalizeText(`Periodo: ${periodoText}`), 196, infoY, { align: 'right' });
    }
    
    doc.setDrawColor(0, 43, 30); // verde corporativo
    doc.line(14, 32, 196, 32);

    // KPI Cards (7 cards em 2 linhas - verde corporativo #002b1e)
    let kpiY = 38;
    const kpiCard = (x: number, y: number, w: number, title: string, value: string, color?: string) => {
        doc.setFillColor(240, 253, 244); // bg-green-50
        doc.setDrawColor(0, 43, 30); // verde corporativo
        doc.roundedRect(x, y, w, 18, 3, 3, 'FD');
        doc.setFontSize(8);
        doc.setTextColor(107, 114, 128);
        doc.text(normalizeText(title), x + 3, y + 6);
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        if (color === 'red') {
            doc.setTextColor(239, 68, 68);
        } else {
            doc.setTextColor(0, 43, 30); // verde corporativo
        }
        doc.text(normalizeText(value), x + 3, y + 14);
        doc.setFont("helvetica", "normal");
    };
    
    // Primeira linha (4 cards)
    kpiCard(14, kpiY, 44, "Total de Registros", totalRegistros.toString());
    kpiCard(62, kpiY, 44, "Perda Total (CX)", `${totalPerdaCx.toFixed(2)} CX`, 'red');
    kpiCard(110, kpiY, 44, "Perda Total (KG)", `${totalPerdaKg.toFixed(2)} KG`, 'red');
    kpiCard(158, kpiY, 38, "Perda Media", `${mediaPerdaPercentual.toFixed(2)}%`);
    
    // Segunda linha (3 cards - dados das pesagens)
    kpiY += 22;
    kpiCard(14, kpiY, 60, "Total Digitado", `${totalDigitado.toFixed(2)} KG`);
    kpiCard(78, kpiY, 60, "Total Baixo Peso", `${totalBaixoPeso.toFixed(2)} KG`, 'red');
    kpiCard(142, kpiY, 54, "Qtd. Baixo Peso", `${qtdBaixoPeso} CXS`, 'red');

    // Tabela Principal
    const tableColumn = [
        "Data",
        "Filial",
        "Categoria",
        "Produto",
        "Qtd Rec. (CX)",
        "Peso Prog. (KG)",
        "Peso Analise (KG)",
        "Peso Real (KG)",
        "Perda KG",
        "Perda CX",
        "Forn.",
        "NF"
    ];
    const tableRows: (string | number)[][] = data.map(item => [
        format(item.dataRegistro, 'dd/MM/yy'),
        normalizeText(item.filial || '').substring(0, 15),
        normalizeText(item.categoria || '').substring(0, 12),
        normalizeText(item.produto || '').substring(0, 18),
        item.quantidadeRecebida,
        Number(item.pesoLiquidoProgramado?.toFixed?.(2) ?? (item.pesoLiquidoProgramado ?? 0)),
        item.pesoLiquidoAnalise.toFixed(2),
        item.pesoLiquidoReal.toFixed(2),
        item.perdaKg.toFixed(2),
        item.perdaCx.toFixed(2),
        normalizeText(item.fornecedor || '').substring(0, 10),
        normalizeText(item.notaFiscal || ''),
    ]);

    let currentY = kpiY + 24;

    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: currentY,
        theme: 'grid',
        headStyles: { fillColor: [0, 43, 30], textColor: 255, fontSize: 7, cellPadding: 1.5 }, // verde corporativo
        styles: { fontSize: 7, cellPadding: 1.5, overflow: 'linebreak' },
        columnStyles: {
            0: { cellWidth: 16 },
            2: { cellWidth: 20 },
            3: { cellWidth: 25 },
            8: { textColor: [239, 68, 68] },
        },
        didDrawPage: (data) => {
            doc.setFontSize(8);
            doc.setTextColor(100);
            doc.text(normalizeText(`Pagina ${data.pageNumber}`), 14, doc.internal.pageSize.height - 10);
        }
    });
    
    currentY = (doc as any).lastAutoTable.finalY + 8;
    
    // TABELA 1: Pesagens das Caixas
    if (Object.keys(todasPesagens).length > 0) {
        // Verificar se precisa nova página
        if (currentY > 235) {
            doc.addPage();
            currentY = 20;
        }
        
        // Título da seção
        doc.setFillColor(52, 152, 219); // Azul
        doc.rect(14, currentY, 182, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(normalizeText('PESAGENS DAS CAIXAS'), 105, currentY + 5.5, { align: 'center' });
        currentY += 10;
        
        const pesagensRows: (string | number)[][] = [];
        
        data.forEach(item => {
            const pesagem = todasPesagens[item.id];
            if (!pesagem) return;
            
            // Extrair valores dos campos (campo_1 até campo_50)
            const valores: number[] = [];
            for (let i = 1; i <= 50; i++) {
                const key1 = `campo_${i}`;
                const key2 = `campo ${i}`;
                const val = Number(pesagem[key1] ?? pesagem[key2] ?? 0);
                if (val > 0) valores.push(val); // Desconsiderar zerados
            }
            
            if (valores.length === 0) return;
            
            // Criar linha com: Categoria, Pesagens (até 10 por linha), Fornecedor, NF
            const categoria = normalizeText(item.categoria || 'N/A').substring(0, 15);
            const fornecedor = normalizeText(item.fornecedor || 'N/A').substring(0, 12);
            const nf = normalizeText(item.notaFiscal || 'N/A').substring(0, 10);
            
            // Dividir valores em grupos de 8 para não ultrapassar largura
            const gruposValores = [];
            for (let i = 0; i < valores.length; i += 8) {
                gruposValores.push(valores.slice(i, i + 8));
            }
            
            gruposValores.forEach((grupo, idx) => {
                const pesagensStr = grupo.map(v => v.toFixed(2)).join(', ');
                pesagensRows.push([
                    idx === 0 ? categoria : '',
                    pesagensStr,
                    idx === 0 ? fornecedor : '',
                    idx === 0 ? nf : ''
                ]);
            });
        });
        
        if (pesagensRows.length > 0) {
            autoTable(doc, {
                head: [[
                    normalizeText('Categoria'),
                    normalizeText('Pesagens (KG)'),
                    normalizeText('Fornecedor'),
                    normalizeText('NF')
                ]],
                body: pesagensRows,
                startY: currentY,
                theme: 'grid',
                headStyles: { fillColor: [52, 152, 219], textColor: 255, fontSize: 8, cellPadding: 2 },
                styles: { fontSize: 7, cellPadding: 2, overflow: 'linebreak' },
                columnStyles: {
                    0: { cellWidth: 30 },
                    1: { cellWidth: 100 },
                    2: { cellWidth: 30 },
                    3: { cellWidth: 22 }
        },
        didDrawPage: (data) => {
                    doc.setFontSize(8);
                    doc.setTextColor(100);
                    doc.text(normalizeText(`Pagina ${data.pageNumber}`), 14, doc.internal.pageSize.height - 10);
                }
            });
            
            currentY = (doc as any).lastAutoTable.finalY + 8;
        }
    }
    
    // TABELA 2: Detalhes por Categoria
    if (data.length > 0) {
        // Verificar se precisa nova página
        if (currentY > 235) {
            doc.addPage();
            currentY = 20;
        }
        
        // Título da seção
        doc.setFillColor(155, 89, 182); // Roxo
        doc.rect(14, currentY, 182, 8, 'F');
        doc.setTextColor(255, 255, 255);
            doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(normalizeText('DETALHES POR CATEGORIA'), 105, currentY + 5.5, { align: 'center' });
        currentY += 10;
        
        const detalhesRows: (string | number)[][] = data.map(item => {
            const percentualBaixoPeso = ((item.percentualqtdcaixascombaixopeso ?? 0) * 100).toFixed(2);
            const mediaBaixoPorCx = (item.mediabaixopesoporcaixa ?? 0).toFixed(3);
            
            return [
                normalizeText(item.categoria || 'N/A').substring(0, 18),
                item.taraCaixa.toFixed(2),
                item.pesoLiquidoPorCaixa.toFixed(2),
                percentualBaixoPeso,
                mediaBaixoPorCx,
                normalizeText(item.fornecedor || 'N/A').substring(0, 15),
                normalizeText(item.notaFiscal || 'N/A').substring(0, 12)
            ];
        });
        
        autoTable(doc, {
            head: [[
                normalizeText('Categoria'),
                normalizeText('Tara (KG)'),
                normalizeText('Peso Liq. Prod. (KG)'),
                normalizeText('% Baixo Peso'),
                normalizeText('Media Baixo/CX'),
                normalizeText('Fornecedor'),
                normalizeText('NF')
            ]],
            body: detalhesRows,
            startY: currentY,
            theme: 'grid',
            headStyles: { fillColor: [155, 89, 182], textColor: 255, fontSize: 7, cellPadding: 1.5 },
            styles: { fontSize: 7, cellPadding: 1.5, overflow: 'linebreak' },
            columnStyles: {
                0: { cellWidth: 35 },
                1: { cellWidth: 20 },
                2: { cellWidth: 25 },
                3: { cellWidth: 22 },
                4: { cellWidth: 24 },
                5: { cellWidth: 32 },
                6: { cellWidth: 24 }
            },
            didDrawPage: (data) => {
                doc.setFontSize(8);
                doc.setTextColor(100);
                doc.text(normalizeText(`Pagina ${data.pageNumber}`), 14, doc.internal.pageSize.height - 10);
            }
        });
        
        currentY = (doc as any).lastAutoTable.finalY + 10;
    }
    
    // Adicionar evidências se houver
    const totalEvidencias = Object.values(todasEvidencias).flat().length;
    if (totalEvidencias > 0) {
        doc.addPage();
        
        // Header da seção de evidências
        doc.setFillColor(39, 174, 96); // Verde
        doc.rect(0, 0, 210, 25, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(normalizeText(`EVIDENCIAS (${totalEvidencias} ANEXO${totalEvidencias > 1 ? 'S' : ''})`), 105, 15, { align: 'center' });
        
        let yPos = 35;
        
        // Para cada registro que tem evidências
        for (const registro of data) {
            const evidencias = todasEvidencias[registro.id] || [];
            if (evidencias.length === 0) continue;
            
            // Verificar se precisa de nova página
            if (yPos > 250) {
                doc.addPage();
                yPos = 20;
            }
            
            // Título do registro
            doc.setFillColor(52, 73, 94);
            doc.rect(10, yPos - 5, 190, 8, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            const registroInfo = normalizeText(`${format(registro.dataRegistro, 'dd/MM/yyyy')} - ${registro.filial || 'N/A'} - ${registro.produto || 'N/A'} (${evidencias.length} foto${evidencias.length > 1 ? 's' : ''})`);
            doc.text(registroInfo, 15, yPos);
            yPos += 12;
            
            // Grade 3x3 para imagens
            const imgWidth = 58;
            const imgHeight = 58;
            const margin = 5;
            const startX = 12;
            let currentX = startX;
            let currentY = yPos;
            let imagesInRow = 0;
            
            for (let i = 0; i < evidencias.length; i++) {
                const evidencia = evidencias[i];
                const imageUrl = evidencia.web_content_link || evidencia.webContentLink || evidencia.publicUrl;
                
                if (!imageUrl) continue;
                
                // Verificar se precisa de nova página
                if (currentY + imgHeight > 270) {
                    doc.addPage();
                    currentY = 20;
                    currentX = startX;
                    imagesInRow = 0;
                }
                
                try {
                    const imgData = await loadImageAsBase64(imageUrl);
                    
                    // Desenhar borda
                    doc.setDrawColor(52, 73, 94);
                    doc.setLineWidth(0.5);
                    doc.rect(currentX, currentY, imgWidth, imgHeight);
                    
                    // Adicionar imagem
                    const padding = 2;
                    doc.addImage(
                        imgData,
                        'JPEG',
                        currentX + padding,
                        currentY + padding,
                        imgWidth - (padding * 2),
                        imgHeight - (padding * 2)
                    );
                    
                    // Número da foto
                    doc.setFillColor(0, 0, 0);
                    doc.circle(currentX + 8, currentY + 8, 5, 'F');
                    doc.setTextColor(255, 255, 255);
                    doc.setFontSize(8);
                    doc.setFont('helvetica', 'bold');
                    doc.text(`${i + 1}`, currentX + 8, currentY + 10, { align: 'center' });
                    
                } catch (error) {
                    console.error('Erro ao carregar imagem:', error);
                    // Placeholder de erro
                    doc.setFillColor(240, 240, 240);
                    doc.rect(currentX, currentY, imgWidth, imgHeight, 'F');
                    doc.setDrawColor(239, 68, 68);
                    doc.rect(currentX, currentY, imgWidth, imgHeight);
                    doc.setTextColor(239, 68, 68);
                    doc.setFontSize(7);
                    doc.text(normalizeText('Erro ao'), currentX + imgWidth / 2, currentY + imgHeight / 2 - 2, { align: 'center' });
                    doc.text(normalizeText('carregar'), currentX + imgWidth / 2, currentY + imgHeight / 2 + 2, { align: 'center' });
                }
                
                imagesInRow++;
                
                if (imagesInRow >= 3) {
                    currentX = startX;
                    currentY += imgHeight + margin;
                    imagesInRow = 0;
                } else {
                    currentX += imgWidth + margin;
                }
            }
            
            // Espaço após o último registro
            yPos = currentY + (imagesInRow > 0 ? imgHeight + margin + 10 : 10);
        }
    }

    doc.save(normalizeText(`Relatorio_CheckPeso_${title}.pdf`));
};

// Função para gerar HTML
export const exportToHtml = async (data: RegistroPeso[]) => {
    // Agregados
    const totalRegistros = data.length;
    const totalPerdaKg = data.reduce((sum, item) => sum + item.perdaKg, 0);
    const totalPerdaCx = data.reduce((sum, item) => sum + item.perdaCx, 0);
    const mediaPerdaPercentual = totalRegistros > 0 ? data.reduce((sum, item) => sum + item.perdaPercentual, 0) / totalRegistros : 0;

    // Dados para gráficos
    const dailyLoss = Object.values(
        data.reduce((acc, item) => {
            const date = format(item.dataRegistro, 'yyyy-MM-dd');
            if (!acc[date]) acc[date] = { date, perdaKg: 0 };
            acc[date].perdaKg += item.perdaKg;
            return acc;
        }, {} as Record<string, { date: string, perdaKg: number }>)
    );
    const lossByBranch = Object.values(
        data.reduce((acc, item) => {
            const key = normalizeText(item.filial);
            if (!acc[key]) acc[key] = { name: key, perdaKg: 0 };
            acc[key].perdaKg += item.perdaKg;
            return acc;
        }, {} as Record<string, { name: string, perdaKg: number }>)
    );

    // Resumos por período (7, 30, 365 dias)
    const now = new Date();
    const withinDays = (d: Date, n: number) => {
        const ms = (now.getTime() - new Date(d).getTime()) / (1000 * 60 * 60 * 24);
        return ms <= n;
    };
    const resumo7d = {
        perdaKg: data.filter(i => withinDays(i.dataRegistro, 7)).reduce((s, i) => s + i.perdaKg, 0),
        perdaCx: data.filter(i => withinDays(i.dataRegistro, 7)).reduce((s, i) => s + i.perdaCx, 0),
    };
    const resumo30d = {
        perdaKg: data.filter(i => withinDays(i.dataRegistro, 30)).reduce((s, i) => s + i.perdaKg, 0),
        perdaCx: data.filter(i => withinDays(i.dataRegistro, 30)).reduce((s, i) => s + i.perdaCx, 0),
    };
    const resumo365d = {
        perdaKg: data.filter(i => withinDays(i.dataRegistro, 365)).reduce((s, i) => s + i.perdaKg, 0),
        perdaCx: data.filter(i => withinDays(i.dataRegistro, 365)).reduce((s, i) => s + i.perdaCx, 0),
    };

    const logoSrc = (await getLogoDataUrl()) || (typeof window !== 'undefined' ? `${window.location.origin}/logo.png` : '/logo.png');
    const html = `
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Relatorio de Pesagem - CHECKPESO</title>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2"></script>
        <style>
          :root { --primary: #10b981; --muted: #111827; --bg: #0b0f12; --card: #111827; --border: #1f2937; --accent: #f59e0b; }
          body { font-family: system-ui, -apple-system, Segoe UI, Roboto; margin: 0; background-color: var(--bg); color: #e5e7eb; }
          .container { max-width: 1100px; margin: 0 auto; padding: 24px; }
          header { display:flex; align-items:center; gap: 12px; margin-bottom: 16px; }
          header img { width: 40px; height: 40px; }
          header h1 { font-size: 24px; margin: 0; }
          .sub { color:#94a3b8; }
          .kpis { display:grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: 12px; margin: 16px 0; }
          .card { background-color: var(--card); border: 1px solid var(--border); border-radius: 10px; padding: 12px; }
          .card h3 { margin:0; font-size:12px; color:#94a3b8; }
          .card .value { margin-top:4px; font-size:18px; font-weight:700; }
          .section { margin-top: 20px; }
          .section h2 { font-size: 16px; margin-bottom: 8px; display:flex; align-items:center; gap:8px; }
          .grid-2 { display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 12px; }
          .table-wrap { overflow-x:auto; border:1px solid var(--border); border-radius: 10px; }
          table { width:100%; border-collapse: collapse; min-width: 900px; }
          thead th { background:#0f172a; color:#93c5fd; }
          th, td { border-bottom: 1px solid var(--border); padding: 10px; text-align:left; }
          tr:nth-child(even) { background-color: rgba(255,255,255,0.02); }
          .footer { margin-top: 24px; font-size: 12px; color:#94a3b8; }
        </style>
      </head>
      <body>
        <div class="container">
          <header>
            <img src="${logoSrc}" alt="logo" />
            <div>
              <h1>CHECKPESO - GDM</h1>
              <div class="sub">Relatorio de Pesagem · Gerado em ${format(new Date(), 'dd/MM/yyyy HH:mm')}</div>
            </div>
          </header>

          <div class="kpis">
            <div class="card"><h3>📦 Total de Registros</h3><div class="value">${totalRegistros}</div></div>
            <div class="card"><h3>📉 Perda Total (KG)</h3><div class="value" style="color:#ef4444">${totalPerdaKg.toFixed(2)} KG</div></div>
            <div class="card"><h3>🧱 Perda Total (CX)</h3><div class="value" style="color:#f59e0b">${totalPerdaCx.toFixed(2)} CX</div></div>
            <div class="card"><h3>📈 Perda Media</h3><div class="value">${mediaPerdaPercentual.toFixed(2)}%</div></div>
          </div>

          <div class="grid-2 section">
            <div class="card">
              <h2>📊 Evolucao da Perda (KG)</h2>
              <canvas id="dailyLoss"></canvas>
            </div>
            <div class="card">
              <h2>🏢 Perda por Filial (KG)</h2>
              <canvas id="lossByBranch"></canvas>
            </div>
          </div>

          <div class="section">
            <h2>🗂️ Resumos Semana/Mes/Ano</h2>
            <div class="grid-2">
              <div class="card"><h3>Ultimos 7 dias</h3><div class="value">${resumo7d.perdaKg.toFixed(2)} KG · ${resumo7d.perdaCx.toFixed(2)} CX</div></div>
              <div class="card"><h3>Ultimos 30 dias</h3><div class="value">${resumo30d.perdaKg.toFixed(2)} KG · ${resumo30d.perdaCx.toFixed(2)} CX</div></div>
              <div class="card"><h3>Ultimos 365 dias</h3><div class="value">${resumo365d.perdaKg.toFixed(2)} KG · ${resumo365d.perdaCx.toFixed(2)} CX</div></div>
            </div>
          </div>

          <div class="section">
            <h2>📋 Tabela de Registros</h2>
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Data</th><th>Filial</th><th>Produto</th><th>Categoria</th><th>Qtd Rec. (CX)</th><th>Peso Prog. (KG)</th><th>Peso Analise (KG)</th><th>Peso Real (KG)</th><th>Perda (KG)</th><th>Perda (CX)</th><th>Fornecedor</th><th>NF</th>
                  </tr>
                </thead>
                <tbody>
                  ${data.map(item => `
                    <tr>
                      <td>${format(item.dataRegistro, 'dd/MM/yyyy')}</td>
                      <td>${normalizeText(item.filial)}</td>
                      <td>${normalizeText(item.produto)}</td>
                      <td>${normalizeText(item.categoria)}</td>
                      <td>${item.quantidadeRecebida}</td>
            <td>${Number(item.pesoLiquidoProgramado.toFixed(2))}</td>
            <td>${item.pesoLiquidoAnalise.toFixed(2)}</td>
            <td>${item.pesoLiquidoReal.toFixed(2)}</td>
            <td>${item.perdaKg.toFixed(2)}</td>
                      <td>${item.perdaCx.toFixed(2)}</td>
                      <td>${normalizeText(item.fornecedor)}</td>
                      <td>${normalizeText(item.notaFiscal)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>

          <div class="footer">Relatorio gerado pela aplicacao CHECKPESO · ${format(new Date(), 'dd/MM/yyyy HH:mm')}</div>
        </div>
        <script>
          const dailyLabels = ${JSON.stringify(dailyLoss.map(d => d.date))};
          const dailyValues = ${JSON.stringify(dailyLoss.map(d => Number(d.perdaKg.toFixed(2))))};
          const branchLabels = ${JSON.stringify(lossByBranch.map(b => b.name))};
          const branchValues = ${JSON.stringify(lossByBranch.map(b => Number(b.perdaKg.toFixed(2))))};

          new Chart(document.getElementById('dailyLoss'), {
            type: 'line',
            data: { labels: dailyLabels, datasets: [{ label: 'Perda (KG)', data: dailyValues, borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.2)' }] },
            options: { plugins: { legend: { display: false } }, scales: { x: { ticks: { color: '#9ca3af', font: { size: 11 } } }, y: { ticks: { color: '#9ca3af', font: { size: 11 } } } } }
          });

          new Chart(document.getElementById('lossByBranch'), {
            type: 'bar',
            data: { labels: branchLabels, datasets: [{ label: 'Perda (KG)', data: branchValues, backgroundColor: '#f59e0b' }] },
            options: { plugins: { legend: { display: false }, datalabels: { anchor: 'end', align: 'top', color: '#93c5fd', font: { size: 11 }, formatter: (v) => Number(v).toFixed(2) } }, scales: { x: { ticks: { color: '#9ca3af', font: { size: 11 } } }, y: { ticks: { color: '#9ca3af', font: { size: 11 } } } } }
          });
        </script>
      </body>
    </html>
    `;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
};

// Função para compartilhar via WhatsApp
export const shareViaWhatsApp = (data: RegistroPeso[]) => {
    if (!data || data.length === 0) {
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent('Sem dados para compartilhar.')}`);
        return;
    }

    // Período
    const sortedByDate = [...data].sort((a, b) => new Date(a.dataRegistro).getTime() - new Date(b.dataRegistro).getTime());
    const inicio = sortedByDate[0].dataRegistro;
    const fim = sortedByDate[sortedByDate.length - 1].dataRegistro;

    // Totais
    const totalRegistros = data.length;
    const totalPerdaKg = data.reduce((sum, item) => sum + (item.perdaKg || 0), 0);
    const totalPerdaCx = data.reduce((sum, item) => sum + (item.perdaCx || 0), 0);
    const mediaPerdaPercentual = totalRegistros > 0 ? data.reduce((sum, item) => sum + (item.perdaPercentual || 0), 0) / totalRegistros : 0;

    // Top 5 por registro (maior perda)
    const topRegistros = [...data]
        .sort((a, b) => (b.perdaKg || 0) - (a.perdaKg || 0))
        .slice(0, 5)
        .map((item) => `🏢 *${(item.filial || '').toString()}* - ${format(item.dataRegistro, 'dd/MM/yyyy')}: ${Number(item.perdaKg || 0).toFixed(2)} KG de perda`);

    // Top 5 fornecedor
    const fornecedorAgg = Object.values(
        data.reduce((acc, item) => {
            const key = (item.fornecedor || 'N/I').toString();
            if (!acc[key]) acc[key] = { fornecedor: key, perdaKg: 0, ultimaData: item.dataRegistro };
            acc[key].perdaKg += (item.perdaKg || 0);
            if (new Date(item.dataRegistro).getTime() > new Date(acc[key].ultimaData).getTime()) acc[key].ultimaData = item.dataRegistro;
            return acc;
        }, {} as Record<string, { fornecedor: string, perdaKg: number, ultimaData: Date }>)
    )
    .sort((a, b) => b.perdaKg - a.perdaKg)
    .slice(0, 5)
    .map((it) => `🚚 *${it.fornecedor}* - ${format(it.ultimaData, 'dd/MM/yyyy')}: ${Number(it.perdaKg).toFixed(2)} KG de perda`);

    // Top 5 produto
    const produtoAgg = Object.values(
        data.reduce((acc, item) => {
            const key = (item.produto || 'N/I').toString();
            if (!acc[key]) acc[key] = { produto: key, perdaKg: 0, ultimaData: item.dataRegistro };
            acc[key].perdaKg += (item.perdaKg || 0);
            if (new Date(item.dataRegistro).getTime() > new Date(acc[key].ultimaData).getTime()) acc[key].ultimaData = item.dataRegistro;
            return acc;
        }, {} as Record<string, { produto: string, perdaKg: number, ultimaData: Date }>)
    )
    .sort((a, b) => b.perdaKg - a.perdaKg)
    .slice(0, 5)
    .map((it) => `📦 *${it.produto}* - ${format(it.ultimaData, 'dd/MM/yyyy')}: ${Number(it.perdaKg).toFixed(2)} KG de perda`);

    let message = '';
    message += '📟🍍*RESUMOS DOS RECEBIMENTOS*🍍📟\n\n';
    message += '*-- PERÍODO E TOTAIS --*\n';
    message += `🗓️ *Período Analisado:* ${format(inicio, 'dd/MM/yyyy')} a ${format(fim, 'dd/MM/yyyy')}\n`;
    message += `🧮 *Total de Registros:* ${totalRegistros}\n`;
    message += `🔴 *Perda Total em (KG):* ${totalPerdaKg.toFixed(2)}\n`;
    message += `🔴 *Perda Total em (CX):* ${totalPerdaCx.toFixed(2)}\n`;
    message += `💲 *% Perda Média:* ${mediaPerdaPercentual.toFixed(2)}%\n\n`;

    message += '*-- TOP 5 REGISTROS DE MAIOR PERDA --*\n';
    message += topRegistros.join('\n') + '\n\n';

    message += '*-- TOP 5 FORNECEDOR DE MAIOR PERDA --*\n';
    message += fornecedorAgg.join('\n') + '\n\n';

    message += '*-- TOP 5 PRODUTO DE MAIOR PERDA --*\n';
    message += produtoAgg.join('\n') + '\n\n';

    message += '📟🥝APP CHECKPESO - GDM🍎📟';

    const link = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(link, '_blank');
};
