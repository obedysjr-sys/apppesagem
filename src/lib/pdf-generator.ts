import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { RegistroPeso } from '@/types';
import { format } from 'date-fns';

// Interface para evidências
interface Evidencia {
    webContentLink?: string;
    web_content_link?: string;
    publicUrl?: string;
    fileName?: string;
    file_name?: string;
}

// Cache da logo
let cachedLogoDataUrl: string | null = null;

// Carregar logo
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

// Normalizar texto
const normalizeText = (value: string | undefined | null): string => {
    const s = (value ?? '').toString();
    return s
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w\s\-./]/g, '');
};

// Função helper para carregar imagem como base64
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

export async function generateRegistroPDF(
    registro: RegistroPeso, 
    pesagemData?: any,
    evidencias?: Evidencia[]
): Promise<Blob> {
    const doc = new jsPDF();
    
    // Cor verde corporativa
    const greenColor = [0, 43, 30]; // #002b1e
    
    // Header com logo
    const logoDataUrl = await getLogoDataUrl();
    if (logoDataUrl) {
        try { doc.addImage(logoDataUrl, 'PNG', 14, 10, 20, 20); } catch {}
    }
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(normalizeText("CHECKPESO - GDM"), 40, 18);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(normalizeText(`Relatorio de Recebimento`), 40, 25);
    
    // Informações de contexto (lado direito)
    let infoY = 10;
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.setFont("helvetica", "normal");
    
    doc.text(`Filial: ${normalizeText(registro.filial || 'N/A')}`, 196, infoY, { align: 'right' });
    infoY += 5;
    doc.text(`Fornecedor: ${normalizeText((registro.fornecedor || 'N/A').substring(0, 25))}`, 196, infoY, { align: 'right' });
    infoY += 5;
    doc.text(`NF: ${normalizeText(registro.notaFiscal || 'N/A')}`, 196, infoY, { align: 'right' });
    infoY += 5;
    doc.text(normalizeText(`Data: ${format(registro.dataRegistro, 'dd/MM/yyyy')}`), 196, infoY, { align: 'right' });
    
    doc.setDrawColor(0, 43, 30);
    doc.line(14, 32, 196, 32);
    
    // KPI Cards (verde corporativo)
    let kpiY = 38;
    const kpiCard = (x: number, y: number, w: number, title: string, value: string, isRed?: boolean) => {
        doc.setFillColor(240, 253, 244); // bg-green-50
        doc.setDrawColor(...greenColor);
        doc.roundedRect(x, y, w, 18, 3, 3, 'FD');
        doc.setFontSize(8);
        doc.setTextColor(107, 114, 128);
        doc.text(normalizeText(title), x + 3, y + 6);
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        if (isRed) {
            doc.setTextColor(239, 68, 68);
        } else {
            doc.setTextColor(...greenColor);
        }
        doc.text(normalizeText(value), x + 3, y + 14);
        doc.setFont("helvetica", "normal");
    };
    
    // Cards de dados
    kpiCard(14, kpiY, 60, "Qtd. Total Recebida", `${registro.quantidadeRecebida} CX`);
    kpiCard(78, kpiY, 60, "Peso Programado", `${registro.pesoLiquidoProgramado?.toFixed(2) || '0.00'} KG`);
    kpiCard(142, kpiY, 54, "Qtd. Analisada", `${registro.quantidadeTabela || 0} CX`);
    
    kpiY += 22;
    kpiCard(14, kpiY, 60, "Peso Real", `${registro.pesoLiquidoReal?.toFixed(2) || '0.00'} KG`);
    kpiCard(78, kpiY, 60, "Perda KG", `${registro.perdaKg?.toFixed(2) || '0.00'} KG`, true);
    kpiCard(142, kpiY, 54, "Perda CX", `${registro.perdaCx?.toFixed(2) || '0.00'} CX`, true);
    
    let yPos = kpiY + 24;
    
    // Informações Principais
    doc.setFillColor(...greenColor);
    doc.rect(14, yPos, 182, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(normalizeText('INFORMACOES PRINCIPAIS'), 105, yPos + 5.5, { align: 'center' });
    yPos += 12;
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    const infoData = [
        ['Data:', format(registro.dataRegistro, 'dd/MM/yyyy')],
        ['Filial:', normalizeText(registro.filial || 'N/A')],
        ['Fornecedor:', normalizeText(registro.fornecedor || 'N/A')],
        ['Nota Fiscal:', normalizeText(registro.notaFiscal || 'N/A')],
        ['Produto:', normalizeText(registro.produto || 'N/A')],
        ['Codigo:', normalizeText(registro.codigo || 'N/A')],
        ['Categoria:', normalizeText(registro.categoria || 'N/A')],
        ['Familia:', normalizeText(registro.familia || 'N/A')],
        ['Grupo Produto:', normalizeText(registro.grupoProduto || 'N/A')],
    ];
    
    infoData.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold');
        doc.text(label, 18, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(value, 60, yPos);
        yPos += 6;
    });
    
    yPos += 4;
    
    // Dados da Pesagem
    doc.setFillColor(...greenColor);
    doc.rect(14, yPos, 182, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(normalizeText('DADOS DA PESAGEM'), 105, yPos + 5.5, { align: 'center' });
    yPos += 12;
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    const pesagemDataRows = [
        ['Quantidade Total Recebida:', `${registro.quantidadeRecebida} CX`],
        ['Peso Liquido Total Programado:', `${registro.pesoLiquidoProgramado?.toFixed(2) || '0.00'} KG`],
        ['Peso Liquido por Caixa:', `${registro.pesoLiquidoPorCaixa?.toFixed(2) || '0.00'} KG`],
        ['Tara da Caixa:', `${registro.taraCaixa?.toFixed(2) || '0.00'} KG`],
        ['Quantidade Analisada:', `${registro.quantidadeTabela || 0}`],
        ['Quantidade Baixo Peso:', `${registro.quantidadebaixopeso || 0}`],
        ['Peso Bruto da Analise:', `${registro.pesoBrutoAnalise?.toFixed(2) || '0.00'} KG`],
        ['Peso Liquido da Analise:', `${registro.pesoLiquidoAnalise?.toFixed(2) || '0.00'} KG`],
    ];
    
    pesagemDataRows.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold');
        doc.text(normalizeText(label), 18, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(normalizeText(value), 85, yPos);
        yPos += 6;
    });
    
    yPos += 4;
    
    // NOVA TABELA: Registros de Pesagens das Caixas
    if (pesagemData) {
        // Verificar se precisa nova página
        if (yPos > 220) {
            doc.addPage();
            yPos = 20;
        }
        
        // Título da seção
        doc.setFillColor(...greenColor); // Azul
        doc.rect(14, yPos, 182, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(normalizeText('REGISTROS DE PESAGENS DAS CAIXAS - LIQUIDO'), 105, yPos + 5.5, { align: 'center' });
        yPos += 10;
        
        // Extrair valores dos campos (campo_1 até campo_50)
        const valores: number[] = [];
        for (let i = 1; i <= 50; i++) {
            const key1 = `campo_${i}`;
            const key2 = `campo ${i}`;
            const val = Number(pesagemData[key1] ?? pesagemData[key2] ?? 0);
            if (val > 0) valores.push(val); // Desconsiderar zerados
        }
        
        if (valores.length > 0) {
            // Dividir valores em grupos de 8 para não ultrapassar largura
            const pesagensRows: (string | number)[][] = [];
            const gruposValores = [];
            for (let i = 0; i < valores.length; i += 8) {
                gruposValores.push(valores.slice(i, i + 8));
            }
            
            gruposValores.forEach((grupo) => {
                const pesagensStr = grupo.map(v => v.toFixed(2)).join(', ');
                pesagensRows.push([pesagensStr]);
            });
            
            autoTable(doc, {
                head: [[normalizeText('Pesagens liquidas das caixas (KG)')]],
                body: pesagensRows,
                startY: yPos,
                theme: 'grid',
                headStyles: { fillColor: [...greenColor], textColor: 255, fontSize: 9, cellPadding: 2 },
                styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
                columnStyles: {
                    0: { cellWidth: 182 }
                }
            });
            
            yPos = (doc as any).lastAutoTable.finalY + 8;
        } else {
            doc.setFontSize(9);
            doc.setTextColor(100);
            doc.text(normalizeText('Nenhum registro de pesagem disponivel.'), 105, yPos + 10, { align: 'center' });
            yPos += 18;
        }
    }
    
    // Verificar se precisa nova página
    if (yPos > 220) {
        doc.addPage();
        yPos = 20;
    }
    
    // Resultados
    doc.setFillColor(...greenColor); // Vermelho
    doc.rect(14, yPos, 182, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(normalizeText('RESULTADOS'), 105, yPos + 5.5, { align: 'center' });
    
    yPos += 12;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    
    const percentualAnaliseBaixoPeso = registro.quantidadeTabela > 0 
        ? (((Number(registro.quantidadebaixopeso) || 0) / registro.quantidadeTabela) * 100) 
        : 0;
    
    const resultadosData = [
        ['Percentual de Baixo Peso da Carga:', `${percentualAnaliseBaixoPeso.toFixed(2)}%`],
        ['Peso Líquido Real da Carga:', `${registro.pesoLiquidoReal?.toFixed(2) || '0.00'} KG`],
        ['Perda em KG:', `${registro.perdaKg?.toFixed(2) || '0.00'} KG`],
        ['Perda em CX:', `${registro.perdaCx?.toFixed(2) || '0.00'} CX`],
        ['Percentual de Perda da Carga:', `${registro.perdaPercentual?.toFixed(2) || '0.00'}%`],
    ];
    
    if (pesagemData) {
        const pesoIdealAnalise = Number(registro.pesoLiquidoIdealAnalise ?? 0);
        const pesoRealAnalise = Number(registro.pesoLiquidoRealAnalise ?? 0);
        const mediaPesoBaixoPorCaixa = Number(registro.mediaPesoBaixoPorCaixa ?? 0);
        const percentualCaixasBaixoPeso = Number((registro.percentualqtdcaixascombaixopeso ?? 0) * 100);
        const mediaCaixasBaixoPeso = Number(registro.mediaqtdcaixascombaixopeso ?? 0);
        const mediaBaixoPesoPorCaixa = Number(registro.mediabaixopesoporcaixa ?? 0);
        
        resultadosData.push(
            ['Peso Liquido Ideal Analise:', `${pesoIdealAnalise.toFixed(2)} KG`],
            ['Perda Liquida na Analise:', `${pesoRealAnalise.toFixed(2)} KG`],
            ['Media de Peso Liq. Por CX Analisada:', `${mediaPesoBaixoPorCaixa.toFixed(2)} KG`],
            ['Percentual de Caixas Baixo Peso (Amostra):', `${percentualCaixasBaixoPeso.toFixed(2)}%`],
            ['Media de Caixas Baixo Peso (Carga):', `${mediaCaixasBaixoPeso.toFixed(2)} CX`],
            ['Media de Baixo Peso por CX:', `${mediaBaixoPesoPorCaixa.toFixed(3)} KG`]
        );
    }
    
    resultadosData.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold');
        doc.text(normalizeText(label), 18, yPos);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(231, 76, 60);
        doc.text(normalizeText(value), 85, yPos);
        doc.setTextColor(0, 0, 0);
        yPos += 6;
    });
    
    // Evidências (Imagens) - igual ao PDF do relatório
    if (evidencias && evidencias.length > 0) {
        doc.addPage();
        
        // Header da seção de evidências
        doc.setFillColor(...greenColor); // Verde
        doc.rect(0, 0, 210, 25, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(normalizeText(`EVIDENCIAS (${evidencias.length} ANEXO${evidencias.length > 1 ? 'S' : ''})`), 105, 15, { align: 'center' });
        
        let yPosEv = 35;
        
        // Título do registro
        doc.setFillColor(...greenColor);
        doc.rect(10, yPosEv - 5, 190, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        const registroInfo = normalizeText(`${format(registro.dataRegistro, 'dd/MM/yyyy')} - ${registro.filial || 'N/A'} - ${registro.produto || 'N/A'} (${evidencias.length} foto${evidencias.length > 1 ? 's' : ''})`);
        doc.text(registroInfo, 15, yPosEv);
        yPosEv += 12;
        
        // Grade 3x3 para imagens
        const imgWidth = 58;
        const imgHeight = 58;
        const margin = 5;
        const startX = 12;
        let currentX = startX;
        let currentY = yPosEv;
        let imagesInRow = 0;
        
        for (let i = 0; i < evidencias.length; i++) {
            const evidencia = evidencias[i];
            const imageUrl = evidencia.webContentLink || evidencia.web_content_link || evidencia.publicUrl;
            
            if (!imageUrl) continue;
            
            try {
                // Carregar imagem
                const imgData = await loadImageAsBase64(imageUrl);
                
                // Verificar se precisa de nova página
                if (currentY + imgHeight > 270) {
                    doc.addPage();
                    currentY = 20;
                    currentX = startX;
                    imagesInRow = 0;
                }
                
                // Desenhar borda do quadrado
                doc.setDrawColor(52, 73, 94);
                doc.setLineWidth(0.5);
                doc.rect(currentX, currentY, imgWidth, imgHeight);
                
                // Adicionar imagem dentro do quadrado com padding
                const padding = 2;
                doc.addImage(
                    imgData, 
                    'JPEG', 
                    currentX + padding, 
                    currentY + padding, 
                    imgWidth - (padding * 2), 
                    imgHeight - (padding * 2)
                );
                
                // Adicionar número da imagem
                doc.setFillColor(0, 0, 0);
                doc.circle(currentX + 8, currentY + 8, 5, 'F');
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(8);
                doc.setFont('helvetica', 'bold');
                doc.text(`${i + 1}`, currentX + 8, currentY + 10, { align: 'center' });
                
                imagesInRow++;
                
                // Próxima posição
                if (imagesInRow >= 3) {
                    // Nova linha
                    currentX = startX;
                    currentY += imgHeight + margin;
                    imagesInRow = 0;
                } else {
                    // Próxima coluna
                    currentX += imgWidth + margin;
                }
                
            } catch (error) {
                console.error('Erro ao carregar imagem para PDF:', error);
                // Desenhar placeholder de erro
                doc.setFillColor(240, 240, 240);
                doc.rect(currentX, currentY, imgWidth, imgHeight, 'F');
                doc.setDrawColor(239, 68, 68);
                doc.setLineWidth(0.5);
                doc.rect(currentX, currentY, imgWidth, imgHeight);
                doc.setTextColor(239, 68, 68);
                doc.setFontSize(7);
                doc.text(normalizeText('Erro ao'), currentX + imgWidth / 2, currentY + imgHeight / 2 - 2, { align: 'center' });
                doc.text(normalizeText('carregar'), currentX + imgWidth / 2, currentY + imgHeight / 2 + 2, { align: 'center' });
                
                imagesInRow++;
                if (imagesInRow >= 3) {
                    currentX = startX;
                    currentY += imgHeight + margin;
                    imagesInRow = 0;
                } else {
                    currentX += imgWidth + margin;
                }
            }
        }
    }
    
    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text(normalizeText(`Pagina ${i} de ${pageCount}`), 105, 287, { align: 'center' });
        doc.text(normalizeText('APP CHECKPESO - GDM'), 14, 287);
    }
    
    return doc.output('blob');
}

