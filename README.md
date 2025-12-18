# 📊 CheckPeso - GDM

**Sistema de Gestão e Controle de Pesagem para Recebimento de Cargas**

---

## 📖 Sobre o Projeto

CheckPeso é um sistema completo de gestão e controle de pesagem desenvolvido para o **Grupo Docemel** (GDM), com foco no recebimento e análise de cargas de produtos perecíveis. O sistema implementa a **norma ABNT 5429-S2** para amostragem e cálculo de perdas, oferecendo uma solução profissional e automatizada para controle de qualidade.

### Principais Funcionalidades

✅ **Gestão de Recebimento**
- Registro completo de cargas recebidas
- Cálculos automáticos baseados em ABNT 5429-S2
- Validação de peso e qualidade
- Controle de baixo peso por caixa

✅ **Análise e Cálculos**
- Tabelas S4 de amostragem automática
- Cálculo de perdas (KG, CX, %)
- Análise de baixo peso detalhada
- Estatísticas em tempo real

✅ **Evidências Fotográficas**
- Upload de múltiplas imagens
- Compressão automática
- Armazenamento no Supabase Storage
- Visualização e download (individual/ZIP)

✅ **Relatórios Profissionais**
- PDF completo com dados e evidências
- Exportação para Excel (XLSX)
- Exportação para HTML
- Envio automático por email

✅ **Integração Google Sheets**
- Sincronização automática de dados
- Append de registros sem duplicação
- Controle de cabeçalhos dinâmicos

---

## 🚀 Tecnologias Utilizadas

### Frontend
- **React 19** - Framework UI
- **TypeScript** - Linguagem tipada
- **Vite** - Build tool
- **Tailwind CSS** - Estilização
- **Shadcn/UI** - Componentes
- **React Hook Form** - Formulários
- **Zod** - Validação de schemas
- **React Router** - Roteamento
- **Date-fns** - Manipulação de datas

### Backend & Cloud
- **Supabase** - Backend-as-a-Service
  - PostgreSQL Database
  - Row Level Security (RLS)
  - Storage (evidências)
  - Edge Functions (Deno)
- **Vercel** - Hosting & Deploy
- **Resend** - Serviço de email

### Geração de Documentos
- **jsPDF** - Geração de PDF
- **jspdf-autotable** - Tabelas em PDF
- **ExcelJS** - Geração de Excel
- **JSZip** - Compressão de arquivos

### Integração
- **Google Apps Script** - Integração com Sheets
- **Google Sheets API** - Sincronização de dados

---

## 📁 Estrutura do Projeto

```
checkpeso/
├── public/                    # Arquivos públicos
│   ├── logo.png              # Logo da empresa
│   ├── background.png        # Background do app
│   ├── manifest.webmanifest  # PWA manifest
│   └── sw.js                 # Service Worker
│
├── src/
│   ├── app/                  # Páginas da aplicação
│   │   ├── calculos/        # Página de cálculos de pesagem
│   │   │   ├── calculos-form.tsx
│   │   │   └── page.tsx
│   │   ├── configuracoes/   # Gerenciamento de produtos e regras
│   │   │   ├── columns.tsx
│   │   │   ├── page.tsx
│   │   │   ├── product-dialog.tsx
│   │   │   ├── rule-dialog.tsx
│   │   │   └── tabela-editor.tsx
│   │   ├── dashboard/       # Dashboard principal
│   │   │   └── page.tsx
│   │   ├── login/           # Autenticação
│   │   │   └── page.tsx
│   │   └── relatorios/      # Relatórios e listagens
│   │       ├── columns.tsx
│   │       ├── data-table.tsx
│   │       ├── data-table-pagination.tsx
│   │       ├── data-table-toolbar.tsx
│   │       ├── data-table-row-actions.tsx
│   │       ├── delete-registro-dialog.tsx
│   │       ├── edit-registro-dialog.tsx
│   │       ├── send-email-dialog.tsx
│   │       ├── share-whatsapp-dialog.tsx
│   │       ├── pesagem-hover.tsx
│   │       ├── pesagem-modal.tsx
│   │       └── page.tsx
│   │
│   ├── components/          # Componentes reutilizáveis
│   │   ├── calculos/
│   │   │   └── result-card.tsx
│   │   ├── dashboard/
│   │   │   └── kpi-card.tsx
│   │   ├── evidencias/
│   │   │   ├── upload-evidencias.tsx
│   │   │   └── visualizar-evidencias-modal.tsx
│   │   ├── layout/          # Layout da aplicação
│   │   │   ├── app-layout.tsx
│   │   │   ├── header.tsx
│   │   │   ├── page-content.tsx
│   │   │   ├── page-wrapper.tsx
│   │   │   ├── sidebar.tsx
│   │   │   └── theme-toggle.tsx
│   │   ├── providers/       # Context providers
│   │   │   └── theme-provider.tsx
│   │   └── ui/              # Componentes Shadcn/UI
│   │       └── [40+ componentes UI]
│   │
│   ├── hooks/               # Custom hooks
│   │   ├── use-auth.ts     # Hook de autenticação
│   │   ├── use-filiais.ts  # Hook de filiais
│   │   └── use-toast.ts    # Hook de notificações
│   │
│   ├── lib/                 # Bibliotecas e utilitários
│   │   ├── calculos.ts     # Lógica de cálculos (ABNT 5429-S2)
│   │   ├── config.ts       # Configurações gerais
│   │   ├── export.ts       # Exportação de relatórios (PDF/Excel/HTML)
│   │   ├── image-compression.ts  # Compressão de imagens
│   │   ├── pdf-generator.ts      # Geração de PDF individual
│   │   ├── supabase.ts     # Cliente Supabase
│   │   ├── tabelas-mock.ts # Dados mock para desenvolvimento
│   │   ├── tabelaS4.ts     # Tabela S4 de amostragem
│   │   ├── utils.ts        # Utilitários gerais
│   │   └── whatsapp-message.ts   # Mensagens WhatsApp
│   │
│   ├── types/               # TypeScript types
│   │   ├── evidencias.ts   # Tipos de evidências
│   │   ├── index.ts        # Tipos principais
│   │   └── supabase-row.ts # Tipos do Supabase
│   │
│   ├── App.tsx              # Componente raiz
│   ├── main.tsx             # Entry point
│   └── index.css            # Estilos globais
│
├── supabase/
│   ├── functions/           # Edge Functions (Deno)
│   │   ├── append-sheet/   # Integração Google Sheets
│   │   │   └── index.ts
│   │   ├── send-email/     # Envio de emails via Resend
│   │   │   └── index.ts
│   │   └── upload-evidencias/  # Upload de evidências
│   │       └── index.ts
│   └── .temp/              # Cache temporário Supabase CLI
│
├── sql/                     # Scripts SQL
│   ├── EXECUTAR_ESTE.sql   # Script principal RLS
│   ├── add_evidencias_table.sql  # Criação tabela evidências
│   └── rls_registros_peso.sql    # RLS registros peso
│
├── scripts/                 # Scripts Node.js
│   ├── import-produtos-from-csv.mjs  # Importar produtos
│   └── sync-headers-and-append.mjs   # Sync Google Sheets
│
├── apps-script/             # Google Apps Script
│   └── append-sheet.gs     # Script append de dados
│
├── docs/                    # Documentação técnica
│   ├── CONFIGURAR_EMAIL_RESEND.md    # Setup email
│   ├── CORRECAO_CALCULOS.md          # Documentação cálculos
│   ├── MELHORIAS_EMAIL_PDF.md        # PDF individual
│   ├── PDF_RELATORIO_FINALIZADO.md   # PDF relatório
│   ├── RELATORIO_PDF_MELHORADO.md    # Histórico melhorias
│   ├── FUNCIONALIDADES_EVIDENCIAS_V2.md  # Sistema evidências
│   ├── RESOLVER_RLS.md               # Troubleshooting RLS
│   └── CORRECAO_EMAIL_FORMAT.md      # Correções email
│
├── .gitignore
├── components.json          # Configuração Shadcn/UI
├── eslint.config.js
├── netlify.toml
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vercel.json              # Configuração Vercel
├── vite.config.ts
└── README.md
```

---

## 🛠️ Instalação e Configuração

### Pré-requisitos

- Node.js 18+ 
- npm ou yarn
- Conta Supabase (gratuita)
- Conta Resend (para emails)
- Conta Vercel (para deploy)

### 1. Clone o Repositório

```bash
git clone https://github.com/seu-usuario/checkpeso.git
cd checkpeso
```

### 2. Instale as Dependências

```bash
npm install
```

### 3. Configure as Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Supabase
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key

# Google Sheets (opcional)
VITE_GOOGLE_SHEET_ID=seu-sheet-id
```

### 4. Configure o Supabase

#### 4.1. Crie as Tabelas

Execute os scripts SQL na seguinte ordem:

1. `sql/add_evidencias_table.sql` - Cria tabela de evidências
2. `sql/rls_registros_peso.sql` - Configura RLS para registros
3. `sql/EXECUTAR_ESTE.sql` - Configura RLS para evidências

#### 4.2. Configure o Storage

1. Acesse o Supabase Dashboard
2. Vá em **Storage** → **New Bucket**
3. Nome: `evidencias`
4. Público: ❌ (privado)
5. Allowed MIME types: `image/*`

#### 4.3. Configure as Edge Functions

```bash
# Instale Supabase CLI
npm install -g supabase

# Login no Supabase
npx supabase login

# Link com seu projeto
npx supabase link --project-ref seu-project-ref

# Deploy das funções
npx supabase functions deploy append-sheet --no-verify-jwt
npx supabase functions deploy send-email --no-verify-jwt
npx supabase functions deploy upload-evidencias --no-verify-jwt
```

#### 4.4. Configure os Secrets da Edge Function

```bash
# Resend API Key (para emails)
npx supabase secrets set RESEND_API_KEY=re_sua_api_key

# Email de envio (domínio verificado no Resend)
npx supabase secrets set RESEND_FROM_EMAIL=noreply@seudominio.com.br

# Redeploy após configurar secrets
npx supabase functions deploy send-email --no-verify-jwt
```

### 5. Inicie o Servidor de Desenvolvimento

```bash
npm start
```

Acesse: http://localhost:5173

---

## 📧 Configuração de Email (Resend)

Para enviar relatórios por email, configure o Resend:

1. **Crie uma conta**: https://resend.com
2. **Verifique seu domínio**: Adicione registros DNS (TXT, MX, CNAME)
3. **Crie uma API Key**: Com permissão de envio
4. **Configure os Secrets** no Supabase (passo 4.4)

📖 **Documentação Completa**: `CONFIGURAR_EMAIL_RESEND.md`

---

## 🎨 Funcionalidades Detalhadas

### 1. Cálculos de Pesagem (ABNT 5429-S2)

O sistema implementa a norma ABNT 5429-S2 para amostragem de lotes:

- **Tabela S4**: Determina quantidade de caixas para análise
- **Cálculo de Baixo Peso**: Identifica caixas fora do padrão
- **Perdas Calculadas**:
  - Perda em KG
  - Perda em CX
  - Percentual de perda
  - Média de baixo peso por caixa

**Fórmulas Implementadas**:

```typescript
// % de Caixas com Baixo Peso
percentualBaixoPeso = (qtdBaixoPeso / qtdTabela) * 100

// Média Total de Caixas com Baixo Peso
mediaTotalBaixoPeso = percentualBaixoPeso * qtdTotalRecebida

// Média de Baixo Peso por Caixa
mediaBaixoPesoPorCX = ((pesoBruto / qtdBaixoPeso) - pesoPadrao) * -1

// Perda Total KG
perdaTotalKG = mediaBaixoPesoPorCX * mediaTotalBaixoPeso

// Perda Total CX
perdaTotalCX = perdaTotalKG / pesoPadrao
```

📖 **Documentação**: `CORRECAO_CALCULOS.md`

### 2. Sistema de Evidências

- **Upload**: Até 50 imagens por registro
- **Compressão**: Automática (< 800KB)
- **Armazenamento**: Supabase Storage
- **Visualização**: Modal com zoom
- **Download**: Individual ou ZIP

📖 **Documentação**: `FUNCIONALIDADES_EVIDENCIAS_V2.md`

### 3. Relatórios PDF

Dois tipos de PDF profissionais:

#### PDF Individual (Email)
- Header com logo
- KPI cards verdes (#002b1e)
- Informações completas do registro
- Tabela de pesagens das caixas
- Resultados detalhados
- Evidências em grade 3x3

#### PDF Relatório (Múltiplos)
- Mesmo design do PDF individual
- Tabela com todos os registros
- Tabela de pesagens consolidada
- Detalhes por categoria
- Evidências agrupadas por registro

📖 **Documentação**: `MELHORIAS_EMAIL_PDF.md`, `PDF_RELATORIO_FINALIZADO.md`

### 4. Integração Google Sheets

Sincronização automática de dados:

- Append sem duplicação
- Controle de cabeçalhos
- Validação de dados
- Error handling robusto

📖 **Script**: `apps-script/append-sheet.gs`

---

## 🌐 Deploy

### Deploy na Vercel

1. **Conecte o Repositório**:
   - Acesse https://vercel.com
   - New Project → Import Git Repository

2. **Configure as Variáveis de Ambiente**:
   ```
   VITE_SUPABASE_URL
   VITE_SUPABASE_ANON_KEY
   VITE_GOOGLE_SHEET_ID (opcional)
   ```

3. **Build Command**:
   ```bash
   npm run build
   ```

4. **Output Directory**:
   ```
   dist
   ```

5. **Deploy**:
   - Clique em "Deploy"
   - Aguarde o build
   - Acesse a URL gerada

📖 **Guia Completo**: `DEPLOY_VERCEL.md` (a ser criado)

---

## 🔒 Segurança

### Row Level Security (RLS)

Todas as tabelas têm RLS habilitado:

- **Registros**: Usuário só acessa seus próprios registros
- **Evidências**: Vinculadas ao usuário que fez upload
- **Produtos**: Acesso compartilhado por organização

### Storage Security

- Bucket privado
- Acesso via autenticação
- URLs assinadas (signed URLs)
- Expiração automática

📖 **Troubleshooting**: `RESOLVER_RLS.md`

---

## 📊 Tecnologias de Análise

### Dashboard KPIs

- Total de registros
- Perda total (KG e CX)
- Perda média (%)
- Total digitado
- Total baixo peso
- Quantidade baixo peso

### Filtros Avançados

- Por filial
- Por fornecedor
- Por nota fiscal
- Por período (data)
- Por categoria/produto

---

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm start                # Inicia servidor dev (Vite)
npm run dev              # Alias para start

# Build
npm run build            # Build de produção

# Linting
npm run lint             # Executa ESLint

# Preview
npm run preview          # Preview do build

# Testes
npm run test:e2e         # Testa registro completo
npm run test:sync        # Testa sync Google Sheets

# Importação
npm run import:produtos  # Importa produtos de CSV
```

---

## 📚 Documentação Técnica

### Arquitetura

- **Frontend**: React SPA com React Router
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Storage**: Supabase Storage
- **Email**: Resend API
- **Deploy**: Vercel (Edge Network)

### Fluxo de Dados

```
1. Usuário preenche formulário
   ↓
2. Cálculos executados (lib/calculos.ts)
   ↓
3. Imagens comprimidas (lib/image-compression.ts)
   ↓
4. Upload para Supabase Storage (functions/upload-evidencias)
   ↓
5. Registro salvo no PostgreSQL
   ↓
6. (Opcional) Sync com Google Sheets (functions/append-sheet)
   ↓
7. PDF gerado (lib/pdf-generator.ts ou lib/export.ts)
   ↓
8. Email enviado (functions/send-email)
```

### Modelos de Dados

#### RegistroPeso
```typescript
interface RegistroPeso {
  id: number;
  dataRegistro: Date;
  filial: string;
  fornecedor: string;
  notaFiscal: string;
  produto: string;
  codigo: string;
  categoria: string;
  familia: string;
  grupoProduto: string;
  quantidadeRecebida: number;
  pesoLiquidoPorCaixa: number;
  taraCaixa: number;
  quantidadeTabela: number;
  quantidadebaixopeso: number;
  pesoBrutoAnalise: number;
  pesoLiquidoAnalise: number;
  pesoLiquidoProgramado: number;
  pesoLiquidoReal: number;
  perdaKg: number;
  perdaCx: number;
  perdaPercentual: number;
  // ... outros campos calculados
}
```

#### Evidencia
```typescript
interface Evidencia {
  id: number;
  registro_id: number;
  file_path: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  uploaded_by: string;
  created_at: Date;
}
```

---

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

---

## 📄 Licença

Este projeto é propriedade do **Grupo Docemel** (GDM).

---

## 👥 Contato

**Grupo Docemel** - Sistema CheckPeso  
Email: suporte@gdm.com.br  
Site: https://checkpeso.gdm.com.br

---

## 📝 Changelog

### v2.0.0 (Atual)
- ✅ Sistema de evidências com Supabase Storage
- ✅ PDFs profissionais com evidências
- ✅ Envio de emails via Resend
- ✅ Correção de cálculos (ABNT 5429-S2)
- ✅ Cor verde corporativa (#002b1e)
- ✅ Limpeza de arquivos obsoletos

### v1.1.0
- ✅ Tela de caixas com baixo peso
- ✅ Melhorias visuais

### v1.0.0
- ✅ Sistema básico de pesagem
- ✅ Dashboard e relatórios
- ✅ Integração Google Sheets

---

## 🙏 Agradecimentos

- **Grupo Docemel (GDM)** - Cliente e patrocinador
- **Supabase** - Backend-as-a-Service
- **Vercel** - Hosting e deploy
- **Resend** - Serviço de email
- **Shadcn/UI** - Componentes UI

---

**Desenvolvido com 💚 para o Grupo Docemel (GDM)**
