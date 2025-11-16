import fs from 'node:fs';
import path from 'node:path';

function parseEnv(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
  return env;
}

function fmtYMD(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${da}`;
}

function fmtDMY(d) {
  const da = String(d.getDate()).padStart(2, '0');
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const y = d.getFullYear();
  return `${da}/${m}/${y}`;
}

async function main() {
  const root = process.cwd();
  const envPath = path.join(root, '.env.local');
  const env = fs.existsSync(envPath) ? parseEnv(envPath) : {};

  const supabaseUrl = env.VITE_SUPABASE_URL || '';
  const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || '';
  const spreadsheetId = env.VITE_SHEETS_SPREADSHEET_ID || '';
  const range = env.VITE_SHEETS_RANGE || '';
  const appsScriptUrl = env.VITE_APPS_SCRIPT_URL || '';

  if (!spreadsheetId || !range) {
    console.error('[Sync] Falta spreadsheetId/range em .env.local');
    process.exit(1);
  }

  // 1) Sincroniza cabeçalhos via Apps Script diretamente
  if (!appsScriptUrl) {
    console.warn('[Sync] VITE_APPS_SCRIPT_URL ausente; pulando sync_headers direto.');
  } else {
    const syncBody = { spreadsheetId, range, action: 'sync_headers' };
    const resp = await fetch(appsScriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(syncBody),
    });
    const text = await resp.text();
    console.log('[AppsScript sync_headers] Status', resp.status, 'Body', text);
  }

  // 2) Append via função (server-side)
  const today = new Date();
  const quantidadeRecebida = 5;
  const pesoLiquidoPorCaixa = 1.5;
  const taraCaixa = 0.2;
  const pesoBrutoAnalise = 8.5;

const pesoProgramado = Number((quantidadeRecebida * pesoLiquidoPorCaixa).toFixed(2));
const pesoAnalise = Number((pesoBrutoAnalise - quantidadeRecebida * taraCaixa).toFixed(2));
const perdaKg = Number((pesoProgramado - pesoAnalise).toFixed(2));
const perdaCx = Number((perdaKg / pesoLiquidoPorCaixa).toFixed(2));
  const perdaPercentual = Number(((perdaKg / (pesoProgramado || 1)) * 100).toFixed(2));

  const record = {
    data_registro: fmtDMY(today), // Sheets usa dd/mm/yyyy
    filial: 'TRIELO CD SIMÕES FILHO BA',
    fornecedor: 'Sync Test',
    nota_fiscal: 'NF-SYNC-001',
    modelo_tabela: 'S4',
    quantidade_recebida: quantidadeRecebida,
    peso_liquido_por_caixa: pesoLiquidoPorCaixa,
    quantidade_tabela: quantidadeRecebida,
    quantidade_baixo_peso: 0,
    peso_bruto_analise: pesoBrutoAnalise,
    tara_caixa: taraCaixa,
    peso_liquido_programado: pesoProgramado,
    peso_liquido_analise: pesoAnalise,
    peso_liquido_real: pesoAnalise,
    perda_kg: perdaKg,
    perda_cx: perdaCx,
    perda_percentual: perdaPercentual,
    observacoes: 'Sync headers + append via function',
    // Campos de produto para validar escrita nas colunas finais
    cod_produto: '001.021',
    produto: '001.021 - Mamao Papaya Golden Doce Mel Extra Cx 12 Kg',
    categoria: 'Papaya Extra',
    familia: 'Mamao Papaya',
    grupo_produto: 'Mamao',
  };

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[Sync] Falta VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY em .env.local');
    process.exit(1);
  }

  const fnUrl = `${supabaseUrl.replace(/\/$/, '')}/functions/v1/append-sheet`;
  const body = { spreadsheetId, range, record };
  const resp = await fetch(fnUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'Origin': 'http://localhost:5173',
    },
    body: JSON.stringify(body),
  });
  const text = await resp.text();
  console.log('[Function append] Status', resp.status, 'Body', text);
}

main().catch((e) => {
  console.error('Erro:', e);
  process.exit(1);
});