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

// Função para exportar dados para PDF profissional
export const exportToPdf = async (data: RegistroPeso[], title: string) => {
    const doc = new jsPDF();

    // Totais
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

    // Header
    // Tenta carregar a logo em base64 e adiciona ao PDF.
    const logoDataUrl = await getLogoDataUrl();
    if (logoDataUrl) {
        try { doc.addImage(logoDataUrl, 'PNG', 14, 12, 20, 20); } catch {}
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
    kpiCard(60, 42, "Perda Total (CX)", `${totalPerdaCx.toFixed(2)} CX`);
    kpiCard(106, 42, "Perda Total (KG)", `${totalPerdaKg.toFixed(2)} KG`);
    kpiCard(152, 44, "Perda Média", `${mediaPerdaPercentual.toFixed(2)}%`);

    // Tabela
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
        normalizeText(item.filial).substring(0, 15),
        normalizeText(item.categoria)?.substring(0, 12),
        normalizeText(item.produto)?.substring(0, 18),
        item.quantidadeRecebida,
        Number(item.pesoLiquidoProgramado?.toFixed?.(2) ?? (item.pesoLiquidoProgramado ?? 0)),
        item.pesoLiquidoAnalise.toFixed(2),
        item.pesoLiquidoReal.toFixed(2),
        item.perdaKg.toFixed(2),
        item.perdaCx.toFixed(2),
        normalizeText(item.fornecedor)?.substring(0, 10),
        normalizeText(item.notaFiscal),
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
            3: { cellWidth: 28 },
            8: { textColor: [239, 68, 68] }, // Coluna Perda KG em vermelho
        },
        didDrawPage: (data) => {
            doc.setFontSize(10);
            doc.text(`Página ${data.pageNumber}`, data.settings.margin.left, doc.internal.pageSize.height - 10);
        }
    });

    doc.save(`Relatorio_CheckPeso_${title}.pdf`);
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
