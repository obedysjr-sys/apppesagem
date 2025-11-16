import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Declaração para silenciar diagnósticos do Deno em ambientes locais.
declare const Deno: any;

// --- Constantes e Tipos ---

const SUPABASE_HEADERS = [
  "data_registro", "filial", "fornecedor", "nota_fiscal", "modelo_tabela",
  "quantidade_recebida", "peso_liquido_por_caixa", "quantidade_tabela",
  "quantidade_baixo_peso", "peso_bruto_analise", "tara_caixa",
  "peso_liquido_programado", "peso_liquido_analise", "peso_liquido_real",
  "perda_kg", "perda_cx", "perda_percentual", "observacoes",
  // Novos campos de produto
  "cod_produto", "produto", "categoria", "familia", "grupo_produto",
] as const;

/**
 * Converte um índice de coluna (1-based) para letra(s) A1 (A, B, ... Z, AA, AB, ...).
 */
function toColumnLetter(n: number): string {
  let s = '';
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

/**
 * Normaliza o range informado para abranger todas as colunas definidas em SUPABASE_HEADERS.
 * Ex.: "Registros!A:T" → "Registros!A:W" (se existirem 23 cabeçalhos).
 */
function normalizeRange(range: string, totalHeaders: number): string {
  const [sheetName] = range.split('!');
  const endCol = toColumnLetter(totalHeaders);
  return `${sheetName}!A:${endCol}`;
}

type ApiBody = {
  spreadsheetId: string;
  range: string;
  action?: "append" | "sync_headers";
  record?: Record<string, unknown>;
};

// --- Helpers ---

/**
 * Gera os headers CORS necessários.
 * Responde dinamicamente ao Origin da requisição para segurança.
 */
const getCorsHeaders = (origin: string | null) => {
  // Permitir localhost e domínios da Vercel (produção e previews)
  const defaultOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
  ];

  const allowedEnv = (typeof Deno !== 'undefined' ? Deno.env.get('ALLOWED_ORIGINS') : undefined) || '';
  const allowedFromEnv = allowedEnv.split(',').map(s => s.trim()).filter(Boolean);

  const isVercel = origin ? /\.vercel\.app$/i.test(origin) : false;
  const isAllowed = Boolean(
    origin && (
      defaultOrigins.includes(origin) ||
      allowedFromEnv.includes(origin) ||
      isVercel
    )
  );

  return {
    'Access-Control-Allow-Origin': origin && isAllowed ? origin : (origin ?? defaultOrigins[0]),
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
};

/**
 * Codifica uma string para o formato Base64URL.
 */
function base64UrlEncode(data: Uint8Array): string {
  return btoa(String.fromCharCode(...data))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Codifica uma string para Uint8Array (UTF-8).
 */
function utf8Encode(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

// --- Fallback Apps Script ---

/**
 * Tenta executar a mesma operação via Apps Script publicado como Web App.
 * Útil quando a autenticação da Service Account falhar ou a API do Sheets recusar.
 */
async function appsScriptFallback(
  appsScriptUrl: string | undefined,
  payload: { spreadsheetId: string; range: string; action: "append" | "sync_headers"; record?: Record<string, unknown> }
): Promise<{ ok: boolean; error?: string }> {
  if (!appsScriptUrl) return { ok: false, error: 'APPS_SCRIPT_URL não configurado.' };
  try {
    const resp = await fetch(appsScriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const text = await resp.text();
    if (!resp.ok) return { ok: false, error: `Apps Script HTTP ${resp.status}: ${text}` };
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: `Falha no Apps Script: ${msg}` };
  }
}

// --- Autenticação Google ---

/**
 * Importa a chave privada PKCS8 para uso com a Web Crypto API.
 */
async function importPrivateKey(pem: string): Promise<CryptoKey> {
  // Converte "\n" literais para quebras de linha reais (comum em variáveis de ambiente)
  const normalizedPem = pem.replace(/\\n/g, "\n");

  const cleanedPem = normalizedPem
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s|\r|\n/g, '');
  
  let binaryDer: Uint8Array;
  try {
    binaryDer = Uint8Array.from(atob(cleanedPem), c => c.charCodeAt(0));
  } catch (err) {
    console.error('Falha ao decodificar a chave privada (Base64). Verifique o formato do PEM.');
    throw err instanceof Error ? err : new Error(String(err));
  }

  return crypto.subtle.importKey(
    'pkcs8',
    binaryDer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );
}

/**
 * Gera um token de acesso do Google usando uma Service Account JWT.
 */
async function getGoogleAuthToken(email: string, privateKeyPem: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const expiry = now + 3600;

  const header = { alg: 'RS256', typ: 'JWT' };
  const claimSet = {
    iss: email,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    exp: expiry,
    iat: now,
  };

  const encodedHeader = base64UrlEncode(utf8Encode(JSON.stringify(header)));
  const encodedClaimSet = base64UrlEncode(utf8Encode(JSON.stringify(claimSet)));
  
  const signingInput = `${encodedHeader}.${encodedClaimSet}`;
  const key = await importPrivateKey(privateKeyPem);
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, utf8Encode(signingInput));
  
  const encodedSignature = base64UrlEncode(new Uint8Array(signature));
  const assertion = `${signingInput}.${encodedSignature}`;

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('Google Auth Token Error:', errorBody); // Log detalhado
    throw new Error(`Falha ao obter token do Google: ${response.status} ${errorBody}`);
  }

  const { access_token } = await response.json();
  return access_token;
}

// --- Google Sheets API ---

/**
 * Garante que os cabeçalhos da planilha estejam sincronizados.
 * Usa o método PUT para atualizar a primeira linha.
 */
async function ensureHeaders(spreadsheetId: string, range: string, token: string): Promise<{ ok: boolean; error?: string }> {
  const sheetName = range.split('!')[0];
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A1?valueInputOption=RAW`;

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values: [SUPABASE_HEADERS] }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('Google Sheets API error (ensureHeaders):', errorData);
    return { ok: false, error: errorData.error.message };
  }
  return { ok: true };
}

/**
 * Anexa uma nova linha de dados à planilha.
 */
async function appendRow(spreadsheetId: string, range: string, record: Record<string, unknown>, token: string): Promise<{ ok: boolean; error?: string }> {
  const normalized = normalizeRange(range, SUPABASE_HEADERS.length);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(normalized)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
  
  const rowData = SUPABASE_HEADERS.map(header => record[header] ?? '');

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values: [rowData] }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('Google Sheets API error (appendRow):', errorData);
    return { ok: false, error: errorData.error.message };
  }
  return { ok: true };
}

// --- Servidor da Edge Function ---

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('Origin');
  const corsHeaders = getCorsHeaders(origin);

  // Resposta imediata para requisições preflight OPTIONS.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { spreadsheetId, range, action = 'append', record }: ApiBody = await req.json();

    if (!spreadsheetId || !range) {
      throw new Error('spreadsheetId e range são obrigatórios.');
    }
    if (action === 'append' && !record) {
      throw new Error('O campo "record" é obrigatório para a ação "append".');
    }

    const serviceAccountEmail = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_EMAIL');
    const privateKey = Deno.env.get('GOOGLE_PRIVATE_KEY');
    const appsScriptUrl = Deno.env.get('APPS_SCRIPT_URL');

    if (!serviceAccountEmail || !privateKey) {
      throw new Error('Segredos do Google (EMAIL ou KEY) não configurados na Supabase.');
    }

    let token: string | null = null;
    try {
      token = await getGoogleAuthToken(serviceAccountEmail, privateKey);
    } catch (authErr) {
      console.warn('Falha ao obter token do Google, tentando fallback Apps Script...', authErr);
      token = null;
    }

    let result: { ok: boolean; error?: string; action: string } = { ok: false, action };

    if (action === 'sync_headers') {
      if (token) {
        const syncResult = await ensureHeaders(spreadsheetId, range, token);
        if (!syncResult.ok) {
          const fb = await appsScriptFallback(appsScriptUrl, { spreadsheetId, range: normalizeRange(range, SUPABASE_HEADERS.length), action: 'sync_headers' });
          result = { ...result, ok: fb.ok, error: fb.error ?? syncResult.error };
        } else {
          result = { ...result, ok: true };
        }
      } else {
        const fb = await appsScriptFallback(appsScriptUrl, { spreadsheetId, range: normalizeRange(range, SUPABASE_HEADERS.length), action: 'sync_headers' });
        result = { ...result, ok: fb.ok, error: fb.error };
      }
    } else if (action === 'append' && record) {
      if (token) {
        // Tenta sincronizar cabeçalhos, mas não falha se der erro
        try { await ensureHeaders(spreadsheetId, range, token); } catch {}
        const appendResult = await appendRow(spreadsheetId, range, record, token);
        if (!appendResult.ok) {
          const fb = await appsScriptFallback(appsScriptUrl, { spreadsheetId, range: normalizeRange(range, SUPABASE_HEADERS.length), action: 'append', record });
          result = { ...result, ok: fb.ok, error: fb.error ?? appendResult.error };
        } else {
          result = { ...result, ok: true };
        }
      } else {
        const fb = await appsScriptFallback(appsScriptUrl, { spreadsheetId, range: normalizeRange(range, SUPABASE_HEADERS.length), action: 'append', record });
        result = { ...result, ok: fb.ok, error: fb.error };
      }
    } else {
      throw new Error('Ação inválida ou dados ausentes.');
    }

    return new Response(JSON.stringify(result), {
      status: result.ok ? 200 : 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e));
    // Garante que erros também retornem headers CORS.
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});