# CHECKPESO — Setup rápido

Para executar localmente:

1. `npm install`
2. `npm run dev` (servidor em `http://localhost:5173`)

## Google Sheets — Cabeçalhos compatíveis com Supabase

Para que o envio ao Google Sheets funcione, a primeira linha (cabeçalhos) da aba deve usar exatamente os mesmos nomes das colunas do Supabase:

`data_registro`, `filial`, `fornecedor`, `nota_fiscal`, `modelo_tabela`, `quantidade_recebida`, `peso_liquido_por_caixa`, `quantidade_tabela`, `quantidade_baixo_peso`, `peso_bruto_analise`, `tara_caixa`, `peso_liquido_programado`, `peso_liquido_analise`, `peso_liquido_real`, `perda_kg`, `perda_cx`, `perda_percentual`, `observacoes`

Se preferir automatizar, use o arquivo `apps-script/append-sheet.gs` neste repositório:

- Abra a planilha → `Extensions` → `Apps Script` → cole o conteúdo do arquivo.
- `Deploy` → `New deployment` → `Web app` → `Anyone` → copie a URL gerada (termina com `/exec`).
- Configure a URL:
  - Supabase Edge Function (`append-sheet`): adicione o secret `APPS_SCRIPT_URL`.
  - Frontend (fallback opcional): `.env.local` → `VITE_APPS_SCRIPT_URL=<URL>`.
- Opcional: faça uma requisição com body `{ "action": "sync_headers", "spreadsheetId": "<ID>", "range": "Registros!A:Z" }` para sincronizar os cabeçalhos da aba.

Após isso, toda gravação feita pelo app seguirá a ordem dos cabeçalhos e será anexada corretamente.