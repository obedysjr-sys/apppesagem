// Usage:
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/import-produtos-from-csv.mjs
// Reads a CSV and upserts rows into `produtos` table
// Columns expected in CSV (semicolon `;` delimited):
//   Cód. Produto;Descrição;Unid.;Categoria;Família;Grupo Produto

import fs from 'fs/promises';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// CSV path priority: CLI arg > env CSV_PATH > default 'Pasta3.csv' in workspace root
const csvArg = process.argv[2];
const csvEnv = process.env.CSV_PATH;
const csvDefault = path.resolve(process.cwd(), 'Pasta3.csv');
const csvPath = path.resolve(csvArg || csvEnv || csvDefault);

function parseNumber(str) {
  if (str == null) return null;
  const s = String(str).trim();
  if (s === '') return null;
  const normalized = s.replace(/\./g, '').replace(/,/g, '.');
  const num = Number(normalized);
  return Number.isFinite(num) ? num : null;
}

function normalize(str) {
  if (str == null) return null;
  const s = String(str).trim();
  return s === '' ? null : s;
}

async function main() {
  console.log('Reading CSV:', csvPath);
  const raw = await fs.readFile(csvPath, 'utf8');
  const lines = raw.split(/\r?\n/).filter(l => l.trim() !== '');
  if (lines.length < 2) {
    console.error('CSV does not contain data rows.');
    process.exit(1);
  }

  // Header row
  const header = lines[0].split(';').map(h => h.trim().toLowerCase());
  const idx = {
    cod_produto: header.findIndex(h => h.includes('cód') && h.includes('produto')),
    descricao: header.findIndex(h => h.includes('descri')),
    unid: header.findIndex(h => h.startsWith('unid')),
    categoria: header.findIndex(h => h.startsWith('categoria')),
    familia: header.findIndex(h => h.startsWith('fam')),
    grupo_produto: header.findIndex(h => h.includes('grupo') && h.includes('produto')),
  };
  for (const [k, v] of Object.entries(idx)) {
    if (v < 0) {
      console.error(`Missing column in CSV: ${k}`);
      process.exit(1);
    }
  }

  // Parse rows
  const parsed = lines.slice(1).map((line) => {
    const cols = line.split(';');
    const cod_produto = normalize(cols[idx.cod_produto]);
    const descricao = normalize(cols[idx.descricao]);
    const unidRaw = normalize(cols[idx.unid]);
    const unid = unidRaw != null ? parseNumber(unidRaw) : null;
    const categoria = normalize(cols[idx.categoria]);
    const familia = normalize(cols[idx.familia]);
    const grupo_produto = normalize(cols[idx.grupo_produto]);
    return { cod_produto, descricao, unid, categoria, familia, grupo_produto };
  }).filter(r => r.cod_produto != null);

  // Deduplicate by cod_produto (keep last occurrence)
  const byCode = new Map();
  for (const r of parsed) {
    byCode.set(r.cod_produto, r);
  }
  const rows = Array.from(byCode.values());

  console.log(`Parsed ${rows.length} rows. Upserting in chunks...`);
  const chunkSize = 500;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await supabase
      .from('produtos')
      .upsert(chunk, { onConflict: 'cod_produto' });
    if (error) {
      console.error('Upsert error:', error.message);
      process.exit(1);
    }
    console.log(`Upserted ${i + chunk.length}/${rows.length}`);
  }
  console.log('Done.');
}

main().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});