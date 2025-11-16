import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

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

  const today = new Date();
  const quantidadeRecebida = 10;
  const pesoLiquidoPorCaixa = 1.234;
  const taraCaixa = 0.22;
  const pesoBrutoAnalise = 13.5;

const pesoProgramado = Number((quantidadeRecebida * pesoLiquidoPorCaixa).toFixed(2));
const pesoAnalise = Number((pesoBrutoAnalise - quantidadeRecebida * taraCaixa).toFixed(2));
  const pesoReal = pesoAnalise;
const perdaKg = Number((pesoProgramado - pesoReal).toFixed(2));
const perdaCx = Number((perdaKg / pesoLiquidoPorCaixa).toFixed(2));
  const perdaPercentual = Number(((perdaKg / (pesoProgramado || 1)) * 100).toFixed(2));

  const payload = {
    data_registro: fmtYMD(today),
    filial: 'TRIELO CD SIMÕES FILHO BA',
    fornecedor: 'Teste Automático',
    nota_fiscal: 'NF-TEST-001',
    modelo_tabela: 'S4',
    quantidade_recebida: quantidadeRecebida,
    peso_liquido_por_caixa: pesoLiquidoPorCaixa,
    quantidade_tabela: quantidadeRecebida,
    quantidade_baixo_peso: 0,
    peso_bruto_analise: pesoBrutoAnalise,
    tara_caixa: taraCaixa,
    peso_liquido_programado: pesoProgramado,
    peso_liquido_analise: pesoAnalise,
    peso_liquido_real: pesoReal,
    perda_kg: perdaKg,
    perda_cx: perdaCx,
    perda_percentual: perdaPercentual,
    observacoes: 'Teste automático via script',
  };

  let dbOk = false;
  if (supabaseUrl && supabaseAnonKey) {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { error } = await supabase.from('registros_peso').insert(payload);
    if (error) {
      console.error('[DB] Insert error:', error.message);
    } else {
      dbOk = true;
      console.log('[DB] Registro inserido com sucesso.');
    }
  } else {
    console.warn('[DB] VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY ausente. Pulando inserção.');
  }

  const body = {
    spreadsheetId,
    range,
    record: { ...payload, data_registro: fmtDMY(today) },
  };

  let sheetsOk = false;
  if (supabaseUrl && supabaseAnonKey && spreadsheetId && range) {
    try {
      const fnUrl = `${supabaseUrl.replace(/\/$/, '')}/functions/v1/append-sheet`;
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
      console.log('[Function] Status', resp.status, 'Body', text);
      if (resp.ok) sheetsOk = true;
    } catch (e) {
      console.warn('[Function] Falha na chamada ao append-sheet:', e.message);
    }
  }

  if (!sheetsOk && appsScriptUrl && spreadsheetId && range) {
    try {
      const resp = await fetch(appsScriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const text = await resp.text();
      console.log('[AppsScript] Status', resp.status, 'Body', text);
      if (resp.ok) sheetsOk = true;
    } catch (e) {
      console.warn('[AppsScript] Falha no fallback:', e.message);
    }
  }

  console.log('Resumo:', { dbOk, sheetsOk });
}

main().catch((e) => {
  console.error('Erro no teste:', e);
  process.exit(1);
});