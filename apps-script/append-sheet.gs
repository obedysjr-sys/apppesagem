// CHECKPESO — Apps Script para sincronizar cabeçalhos e anexar registros
// Cole este arquivo no editor do Apps Script vinculado à sua planilha
// e publique como Web App (Deploy → New deployment → Web app → Anyone).

const SUPABASE_HEADERS = [
  'data_registro',
  'filial',
  'fornecedor',
  'nota_fiscal',
  'modelo_tabela',
  'quantidade_recebida',
  'peso_liquido_por_caixa',
  'quantidade_tabela',
  'quantidade_baixo_peso',
  'peso_bruto_analise',
  'tara_caixa',
  'peso_liquido_programado',
  'peso_liquido_analise',
  'peso_liquido_real',
  'perda_kg',
  'perda_cx',
  'perda_percentual',
  'observacoes',
  // Novos campos de produto — devem existir na planilha nesta ordem
  'cod_produto',
  'produto',
  'categoria',
  'familia',
  'grupo_produto',
  // Novos cálculos (adicionados)
  'peso_liquido_ideal_analise',
  'peso_liquido_real_analise',
  'media_baixo_peso_por_caixa',
  'percentual_qtd_caixas_com_baixo_peso',
  'media_qtd_caixas_com_baixo_peso',
  'media_baixo_peso_por_cx',
];

/**
 * Entrada do Web App — recebe JSON: { spreadsheetId, range, record, action? }
 * action: 'append' (default) ou 'sync_headers'
 */
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || '{}');
    const spreadsheetId = body.spreadsheetId;
    const range = body.range; // ex.: "Registros!A:Z"
    const action = body.action || 'append';
    if (!spreadsheetId || !range) {
      return json({ ok: false, error: 'Parâmetros ausentes: spreadsheetId/range' }, 400);
    }

    const { sheet } = getSheetFromRange(spreadsheetId, range);

    if (action === 'sync_headers') {
      ensureHeaders(sheet, SUPABASE_HEADERS);
      return json({ ok: true, synced: true, sheet: sheet.getName(), headers: SUPABASE_HEADERS });
    }

    const record = body.record || {};
    ensureHeaders(sheet, SUPABASE_HEADERS);
    const row = SUPABASE_HEADERS.map((k) => (record[k] != null ? record[k] : ''));
    sheet.appendRow(row);
    return json({ ok: true, appended: true, sheet: sheet.getName(), lastRow: sheet.getLastRow() });
  } catch (err) {
    return json({ ok: false, error: String(err) }, 500);
  }
}

function getSheetFromRange(spreadsheetId, a1Range) {
  const excl = a1Range.split('!');
  const sheetName = excl[0];
  const ss = SpreadsheetApp.openById(spreadsheetId);
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error('Aba não encontrada: ' + sheetName);
  return { ss, sheet };
}

function ensureHeaders(sheet, headers) {
  const range = sheet.getRange(1, 1, 1, headers.length);
  range.setValues([headers]);
}

function json(obj, status) {
  const output = ContentService.createTextOutput(JSON.stringify(obj));
  output.setMimeType(ContentService.MimeType.JSON);
  if (status) {
    // Apps Script não altera status HTTP, mas podemos embutir status no corpo
    return output;
  }
  return output;
}