import { RegistroPeso } from "@/types";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from 'xlsx';
import { format } from "date-fns";
import logoBase64 from '/logo.png'; // Import da logo via pasta public

// Função para exportar dados para XLSX
export const exportToXlsx = (data: RegistroPeso[], fileName: string) => {
    const worksheet = XLSX.utils.json_to_sheet(data.map(item => ({
        'Data': format(item.dataRegistro, 'dd/MM/yyyy'),
        'Filial': item.filial,
        'Modelo Tabela': item.modeloTabela,
        'Qtd. Recebida': item.quantidadeRecebida,
        'Peso Analisado (KG)': item.pesoLiquidoAnalise.toFixed(3),
        'Peso Real (KG)': item.pesoLiquidoReal.toFixed(3),
        'Perda (KG)': item.perdaKg.toFixed(3),
        'Perda (CX)': item.perdaCx.toFixed(2),
        'Fornecedor': item.fornecedor,
        'NF': item.notaFiscal,
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Relatório");
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
};

// Função para exportar dados para PDF profissional
export const exportToPdf = (data: RegistroPeso[], title: string) => {
    const doc = new jsPDF();

    // Totais
    const totalRegistros = data.length;
    const totalPerdaKg = data.reduce((sum, item) => sum + item.perdaKg, 0);
    const totalPesoReal = data.reduce((sum, item) => sum + item.pesoLiquidoReal, 0);
    const mediaPerdaPercentual = totalRegistros > 0 ? data.reduce((sum, item) => sum + item.perdaPercentual, 0) / totalRegistros : 0;

    // Header
    if (logoBase64) {
        // jspdf espera a string base64 pura, então removemos o prefixo do data URL
        const base64Data = logoBase64.substring(logoBase64.indexOf(',') + 1);
        doc.addImage(base64Data, 'PNG', 14, 12, 20, 20);
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("CHECKPESO - GDM", 40, 22);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text(`Relatório de Pesagem - ${title}`, 40, 29);
    doc.setDrawColor(22, 163, 74); // Cor primária
    doc.line(14, 38, 196, 38);

    // KPI Cards
    const kpiY = 45;
    const kpiCard = (x: number, w: number, title: string, value: string) => {
        doc.setFillColor(240, 253, 244); // bg-green-50
        doc.setDrawColor(22, 163, 74);
        doc.roundedRect(x, kpiY, w, 20, 3, 3, 'FD');
        doc.setFontSize(10);
        doc.setTextColor(107, 114, 128); // text-gray-500
        doc.text(title, x + 5, kpiY + 7);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 0, 0);
        doc.text(value, x + 5, kpiY + 15);
        doc.setFont("helvetica", "normal");
    };
    kpiCard(14, 42, "Total de Registros", totalRegistros.toString());
    kpiCard(60, 42, "Peso Real Total", `${totalPesoReal.toFixed(2)} KG`);
    kpiCard(106, 42, "Perda Total", `${totalPerdaKg.toFixed(2)} KG`);
    kpiCard(152, 44, "Perda Média", `${mediaPerdaPercentual.toFixed(2)}%`);

    // Tabela
    const tableColumn = ["Data", "Filial", "Modelo", "Qtd Rec.", "Peso Anls.", "Peso Real", "Perda KG", "Perda CX", "Forn.", "NF"];
    const tableRows: (string | number)[][] = data.map(item => [
        format(item.dataRegistro, 'dd/MM/yy'),
        item.filial.substring(0, 15),
        item.modeloTabela,
        item.quantidadeRecebida,
        item.pesoLiquidoAnalise.toFixed(2),
        item.pesoLiquidoReal.toFixed(2),
        item.perdaKg.toFixed(2),
        item.perdaCx.toFixed(2),
        (item.fornecedor ?? '').substring(0, 10),
        item.notaFiscal ?? '',
    ]);

    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: kpiY + 28,
        theme: 'grid',
        headStyles: { fillColor: [22, 163, 74], textColor: 255 },
        styles: { fontSize: 8, cellPadding: 2 },
        columnStyles: {
            0: { cellWidth: 16 },
            6: { textColor: [239, 68, 68] }, // Coluna Perda KG em vermelho
        },
        didDrawPage: (data) => {
            doc.setFontSize(10);
            doc.text(`Página ${data.pageNumber}`, data.settings.margin.left, doc.internal.pageSize.height - 10);
        }
    });

    doc.save(`Relatorio_CheckPeso_${title}.pdf`);
};

// Função para gerar HTML
export const exportToHtml = (data: RegistroPeso[]) => {
    const html = `
    <html>
      <head>
        <title>Relatório de Pesagem - CHECKPESO</title>
        <style>
          body { font-family: sans-serif; margin: 2rem; background-color: #f9fafb; color: #111827; }
          h1 { color: #15803d; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; }
          th { background-color: #dcfce7; }
          tr:nth-child(even) { background-color: #f3f4f6; }
        </style>
      </head>
      <body>
        <h1>Relatório de Pesagem - CHECKPESO</h1>
        <p>Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
        <table>
          <thead>
            <tr>
              <th>Data</th><th>Filial</th><th>Modelo</th><th>Qtd. Recebida</th><th>Peso Analisado (KG)</th><th>Peso Real (KG)</th><th>Perda (KG)</th><th>Perda (CX)</th><th>Fornecedor</th><th>NF</th>
            </tr>
          </thead>
          <tbody>
            ${data.map(item => `
              <tr>
                <td>${format(item.dataRegistro, 'dd/MM/yyyy')}</td>
                <td>${item.filial}</td>
                <td>${item.modeloTabela}</td>
                <td>${item.quantidadeRecebida}</td>
                <td>${item.pesoLiquidoAnalise.toFixed(3)}</td>
                <td>${item.pesoLiquidoReal.toFixed(3)}</td>
                <td>${item.perdaKg.toFixed(3)}</td>
                <td>${item.perdaCx.toFixed(2)}</td>
                <td>${item.fornecedor}</td>
                <td>${item.notaFiscal}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
    </html>
    `;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
};

// Função para compartilhar via WhatsApp
export const shareViaWhatsApp = (data: RegistroPeso[]) => {
    const totalRegistros = data.length;
    const totalPerdaKg = data.reduce((sum, item) => sum + item.perdaKg, 0);
    const mediaPerdaPercentual = totalRegistros > 0 ? data.reduce((sum, item) => sum + item.perdaPercentual, 0) / totalRegistros : 0;
    
    let mensagem = `*CHECKPESO - Relatório Resumido*%0A%0A`;
    mensagem += `*Período Analisado*%0A`;
    mensagem += `*Total de Registros:* ${totalRegistros}%0A`;
    mensagem += `*Perda Total:* ${totalPerdaKg.toFixed(2)} KG%0A`;
    mensagem += `*Perda Média:* ${mediaPerdaPercentual.toFixed(2)}%%0A%0A`;
    mensagem += `*Top 5 Registros com Maior Perda:*%0A`;

    data.sort((a, b) => b.perdaKg - a.perdaKg)
        .slice(0, 5)
        .forEach((item, index) => {
            mensagem += `${index + 1}. *${item.filial.split(' ')[1]}* - ${format(item.dataRegistro, 'dd/MM')}: ${item.perdaKg.toFixed(2)} KG de perda%0A`;
        });

    const link = `https://api.whatsapp.com/send?text=${mensagem}`;
    window.open(link, '_blank');
};
