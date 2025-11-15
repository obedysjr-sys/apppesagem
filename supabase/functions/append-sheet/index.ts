import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// CORS dinâmico baseado no header Origin da requisição
function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowOrigin = origin ?? "*"; // Em dev, liberar qualquer origem se não houver header
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Vary": "Origin",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
  };
}

type AppendBody = {
  spreadsheetId: string;
  range: string; // e.g. "Registros!A:Z"
  record?: Record<string, unknown>;
  action?: "append" | "sync_headers";
};

// Utilitário: encaminha requisição para Apps Script, se configurado
async function forwardToAppsScript(body: AppendBody, origin: string | null): Promise<Response> {
  const url = Deno.env.get("APPS_SCRIPT_URL") || "";
  if (!url) {
    return new Response(
      JSON.stringify({ ok: false, error: "APPS_SCRIPT_URL não configurado" }),
      { status: 500, headers: { "Content-Type": "application/json", ...getCorsHeaders(origin) } }
    );
  }
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await resp.text();
  // Propaga status e corpo do Apps Script
  return new Response(text, {
    status: resp.status,
    headers: { "Content-Type": "application/json", ...getCorsHeaders(origin) },
  });
}

// OBS: Implementação direta via Google Sheets API (Service Account) pode ser adicionada aqui.
// Ela exige GOOGLE_SERVICE_ACCOUNT_EMAIL e GOOGLE_PRIVATE_KEY nas variáveis da função,
// com fluxo JWT (grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer) para obter o access_token
// e chamar POST https://sheets.googleapis.com/v4/spreadsheets/{spreadsheetId}/values/{range}:append.
// Para simplificar e evitar problemas de chaves em Deno, usamos Apps Script como proxy confiável.

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  // Preflight
  if (req.method === "OPTIONS") {
    return new Response("", { headers: getCorsHeaders(origin) });
  }

  // Apenas POST é aceito
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ ok: false, error: "Método não permitido" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...getCorsHeaders(origin) },
    });
  }

  try {
    const body = (await req.json()) as AppendBody;
    if (!body?.spreadsheetId || !body?.range) {
      return new Response(JSON.stringify({ ok: false, error: "Parâmetros inválidos" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...getCorsHeaders(origin) },
      });
    }

    // Para action=sync_headers, não exigimos record. Para append, record é obrigatório.
    if ((body.action ?? "append") === "append" && !body.record) {
      return new Response(JSON.stringify({ ok: false, error: "Parâmetros inválidos" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...getCorsHeaders(origin) },
      });
    }

    // Encaminhar para Apps Script (servidor) para escrever na planilha
    const resp = await forwardToAppsScript(body, origin);
    return resp;
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...getCorsHeaders(origin) },
    });
  }
});