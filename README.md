# [INSIRA O NOME DO SEU APLICATIVO]

Aplicativo web para registro, análise e gestão de pesagem de cargas com integração a Supabase e Google Sheets. Este README foi preparado em tom profissional e didático para orientar desenvolvimento, operação e evolução do projeto.

---

## Título do projeto
- [CHECKPESO - GDM]

## Descrição geral
- Objetivo: [REALIZAR CALCULO DE BAIXO PESO NAS CARGAS RECEBIDAS, COM REGISTROS DOS DADOS PARA ANÁLISE E GESTÃO]
- Público-alvo: [COORPORATIVO]
- O sistema registra cálculos de pesagem, salva no banco, e envia para Google Sheets para rastreabilidade e análises, com filtros e relatórios gerenciais.

## Funcionalidades principais
- Registro de pesagem com cálculo automático dos indicadores.
- Lookup opcional de produto por código (Supabase) preenchendo campos relacionados.
- Envio dos registros para Supabase e Google Sheets (Edge Function + fallback Apps Script).
- Filtros por `Filial`, `Fornecedor`, `Produto`, `Categoria`, `Família`, `Grupo Produto`.
- Relatórios com busca, paginação e exportações.
- Integração com WhatsApp: geração de mensagem resumida do recebimento.
- Suporte a tema escuro/claro com UI consistente.

## Demonstração
- Insira prints ou GIFs nas pastas `docs/` ou `public/`.
- Sugestão:
  - Tela de Cálculos (formulário + resultados).
  - Dashboard (filtros + últimos registros).
  - Relatórios (tabela + filtros).

> Onde inserir: `docs/demo-*.png` ou `docs/demo-*.gif`.

## Tecnologias utilizadas
- Frontend: React, TypeScript, Vite
- UI: Shadcn UI, Tailwind (ou utilitários CSS do projeto), Lucide Icons
- State & Forms: React Hook Form, Zod
- Data & Utils: Date-fns, XLSX (export), Fetch API
- Backend: Supabase (Database + Edge Functions)
- Integrações: Google Sheets (API e Apps Script)
- Deploy: [LOCAL DO DEPLOY]
- Repositório GitHub: [URL DO REPOSITÓRIO]

## Arquitetura do projeto
- Camada de apresentação com componentes reutilizáveis (inputs, tabela, toolbar).
- Camada de domínio para cálculos e normalização de dados.
- Persistência em Supabase (`registros_peso`) e integração paralela com Google Sheets.
- Edge Function `append-sheet` para autenticação com Google e escrita direta na planilha.
- Fallback para Apps Script (Web App) caso a função de borda falhe.

```
[Cliente Web] ──(Supabase JS)──► [Supabase DB]
       │
       ├─(invoke append-sheet)──► [Supabase Edge Function] ─► [Google Sheets API]
       │
       └─(fallback HTTP)────────► [Apps Script Web App] ─────► [Google Sheets]
```

## Como rodar o projeto
1. Pré-requisitos
   - Node.js 18+
   - NPM 9+ ou PNPM/Yarn
   - Acesso a um projeto Supabase
   - Planilha Google Sheets (com aba e cabeçalhos conforme seção abaixo)
2. Instalação
   ```bash
   npm install
   ```
3. Ambiente
   - Crie `.env.local` com as variáveis (ver seção “Variáveis de ambiente”).
4. Desenvolvimento
   ```bash
   npm run dev
   # Servidor local em `http://localhost:5173`
   ```
5. Build
   ```bash
   npm run build
   npm run preview
   ```
6. Edge Function (Supabase)
   - Configure as secrets no projeto Supabase (ver seção “Variáveis de ambiente”).
   - Faça deploy da função:
     ```bash
     supabase functions deploy append-sheet
     ```

## Variáveis de ambiente necessárias
- Frontend (`.env.local`):
  ```env
  VITE_SUPABASE_URL=_Informação a ser adicionada_
  VITE_SUPABASE_ANON_KEY=_Informação a ser adicionada_
  
  # Google Sheets
  VITE_SHEETS_SPREADSHEET_ID=_Informação a ser adicionada_
  VITE_SHEETS_RANGE=Registros!A:Z
  
  # Fallback opcional para Apps Script
  VITE_APPS_SCRIPT_URL=_Informação a ser adicionada_
  ```
- Supabase (Secrets da Edge Function `append-sheet`):
  - `GOOGLE_SERVICE_ACCOUNT_EMAIL`: email da service account Google
  - `GOOGLE_PRIVATE_KEY`: chave privada da service account (formato PEM, com `\n` para novas linhas)
  - `ALLOWED_ORIGINS`: lista de origens permitidas separadas por vírgula (ex.: `https://*.vercel.app,http://localhost:5173`)

## Estrutura de pastas do projeto
```
.
├─ apps-script/
│  └─ append-sheet.gs
├─ public/
│  ├─ logo.png
│  ├─ manifest.webmanifest
│  └─ sw.js
├─ scripts/
│  ├─ import-produtos-from-csv.mjs
│  └─ sync-headers-and-append.mjs
├─ src/
│  ├─ app/
│  │  ├─ dashboard/page.tsx
│  │  ├─ relatorios/page.tsx
│  │  └─ calculos/calculos-form.tsx
│  ├─ components/
│  │  └─ ui/input.tsx
│  ├─ lib/
│  │  ├─ config.ts
│  │  ├─ supabase.ts
│  │  ├─ calculos.ts
│  │  └─ tabelaS4.ts
│  └─ types/index.ts
├─ supabase/
│  └─ functions/append-sheet/
├─ package.json
└─ README.md
```

## Como fazer build e deploy
- Build do frontend:
  ```bash
  npm run build
  ```
- Deploy do frontend: [LOCAL DO DEPLOY]
- Edge Function `append-sheet`:
  ```bash
  # Login e link do projeto (se necessário)
  supabase login
  supabase link --project-ref _Informação a ser adicionada_

  # Deploy da função
  supabase functions deploy append-sheet
  ```
- Secrets na Supabase:
  ```bash
  supabase secrets set \
    GOOGLE_SERVICE_ACCOUNT_EMAIL="_Informação a ser adicionada_" \
    GOOGLE_PRIVATE_KEY="_Informação a ser adicionada_" \
    ALLOWED_ORIGINS="http://localhost:5173,https://*.vercel.app"
  ```

## Integrações externas
- API: Supabase Functions (`append-sheet`) para autenticar no Google e escrever na planilha.
- Google Sheets: escrita via API e via Apps Script (fallback).
- Supabase: banco de dados (Postgres), client-side SDK, canais em tempo real.
- Firebase: _Informação a ser adicionada_ (se aplicável).

### Cabeçalhos do Google Sheets
A primeira linha da aba da planilha deve bater exatamente com os nomes abaixo:
```
data_registro, filial, fornecedor, nota_fiscal, modelo_tabela, quantidade_recebida,
peso_liquido_por_caixa, quantidade_tabela, quantidade_baixo_peso, peso_bruto_analise, tara_caixa,
peso_liquido_programado, peso_liquido_analise, peso_liquido_real, perda_kg, perda_cx, perda_percentual,
observacoes, cod_produto, produto, categoria, familia, grupo_produto
```
- Para automatizar, publique o `apps-script/append-sheet.gs` como Web App e chame com body:
  ```json
  {
    "action": "sync_headers",
    "spreadsheetId": "_Informação a ser adicionada_",
    "range": "Registros!A:Z"
  }
  ```

## Banco de dados
### Tabelas
- `registros_peso`
  - `data_registro` (date/string)
  - `filial` (string)
  - `fornecedor` (string, opcional)
  - `nota_fiscal` (string, opcional)
  - `modelo_tabela` (string)
  - `quantidade_recebida` (number)
  - `peso_liquido_por_caixa` (number)
  - `quantidade_tabela` (number)
  - `quantidade_baixo_peso` (number)
  - `peso_bruto_analise` (number)
  - `tara_caixa` (number)
  - `peso_liquido_programado` (number)
  - `peso_liquido_analise` (number)
  - `peso_liquido_real` (number)
  - `perda_kg` (number)
  - `perda_cx` (number)
  - `perda_percentual` (number)
  - `observacoes` (string, opcional)
  - `cod_produto` (string, opcional)
  - `produto` (string, opcional)
  - `categoria` (string, opcional)
  - `familia` (string, opcional)
  - `grupo_produto` (string, opcional)
- `produtos`
  - `cod_produto` (string, PK/UK)
  - `descricao` (string)
  - `unid` (number) — usado para preencher “Peso Líq. por Caixa (KG)”
  - `categoria` (string)
  - `familia` (string)
  - `grupo_produto` (string)

### Relacionamentos
- `registros_peso.cod_produto` referencia `produtos.cod_produto` (lookup na aplicação).

## Checklist de pré-requisitos
- Node e NPM instalados.
- Projeto Supabase criado com tabelas `registros_peso` e `produtos`.
- Variáveis do `.env.local` definidas.
- Secrets da função `append-sheet` configuradas na Supabase.
- Planilha Google com aba e cabeçalhos padronizados.

## Melhorias futuras
- Importação em massa de produtos a partir de CSV.
- Painel de gráficos de perdas por período/fornecedor.
- Auditoria e histórico de alterações em registros.
- Testes automatizados (unitários e e2e).
- Internacionalização.

## Contribuição
1. Faça um fork do repositório.
2. Crie uma branch de feature: `feat/nome-feature`.
3. Abra PR descrevendo claramente mudanças e impactos.
4. Mantenha o padrão de código e estilo do projeto.

## Licença
- _Informação a ser adicionada_

---

### Exemplos de uso
#### Criação de registro (cliente)
```javascript
// Exemplo simplificado de envio
const payload = {
  data_registro: '01/10/2025',
  filial: 'Matriz',
  fornecedor: 'Fornecedor X',
  modelo_tabela: 'S4',
  quantidade_recebida: 100,
  peso_liquido_por_caixa: 13.5,
  // ...demais campos
};

// Supabase DB
await supabase.from('registros_peso').insert(payload);

// Edge Function
const body = {
  spreadsheetId: import.meta.env.VITE_SHEETS_SPREADSHEET_ID,
  range: import.meta.env.VITE_SHEETS_RANGE,
  action: 'append',
  record: payload,
};
await supabase.functions.invoke('append-sheet', { body });
```

#### Variáveis de ambiente (frontend)
```env
VITE_SUPABASE_URL=https://example.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1Ni...
VITE_SHEETS_SPREADSHEET_ID=1AbCdefGhIJKlmNOPqRstUVwxyz
VITE_SHEETS_RANGE=Registros!A:Z
VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/AKfycbx.../exec
```

#### SQL (exemplo de criação de tabela)
```sql
create table if not exists public.registros_peso (
  id bigint generated always as identity primary key,
  data_registro date not null,
  filial text not null,
  fornecedor text,
  nota_fiscal text,
  modelo_tabela text not null,
  quantidade_recebida numeric not null,
  peso_liquido_por_caixa numeric,
  quantidade_tabela numeric,
  quantidade_baixo_peso numeric,
  peso_bruto_analise numeric,
  tara_caixa numeric,
  peso_liquido_programado numeric,
  peso_liquido_analise numeric,
  peso_liquido_real numeric,
  perda_kg numeric,
  perda_cx numeric,
  perda_percentual numeric,
  observacoes text,
  cod_produto text,
  produto text,
  categoria text,
  familia text,
  grupo_produto text
);
```