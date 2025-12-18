# 🚀 Deploy CheckPeso na Vercel - Guia Completo

## ✅ Status: Projeto Hospedado na Vercel

Este guia cobre a configuração completa para redeploy com as atualizações mais recentes do projeto.

---

## 📋 Pré-requisitos

Antes de iniciar o deploy, certifique-se de ter:

- [x] Conta Vercel (https://vercel.com)
- [x] Conta Supabase configurada
- [x] Conta Resend configurada (para emails)
- [x] Repositório Git atualizado
- [x] Domínio configurado (opcional)

---

## 🔐 Variáveis de Ambiente Necessárias

### 1. Supabase (Obrigatório)

```env
VITE_SUPABASE_URL=https://szonjqmqhwqmohliqlxw.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6b25qcW1xaHdxbW9obGlxbHh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwNjY0OTcsImV4cCI6MjA3ODY0MjQ5N30.3-PL8lJp-KHlyI53X9pez5jZe3nu7VTHRIQGYvKP69Q
```

**Como obter**:
1. Acesse: https://supabase.com/dashboard/project/szonjqmqhwqmohliqlxw
2. Vá em **Settings** → **API**
3. Copie:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon/public** key → `VITE_SUPABASE_ANON_KEY`

### 2. Google Sheets (Opcional)

```env
VITE_GOOGLE_SHEET_ID=seu-google-sheet-id
```

**Como obter**:
- Da URL do Google Sheet: `https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit`
- Copie o ID entre `/d/` e `/edit`

---

## 🛠️ Configuração das Edge Functions (Supabase)

As Edge Functions já estão deployadas, mas precisam de secrets configurados.

### Secrets Necessários

```bash
# 1. RESEND_API_KEY (para envio de emails)
npx supabase secrets set RESEND_API_KEY=re_sua_api_key_aqui

# 2. RESEND_FROM_EMAIL (email remetente verificado)
npx supabase secrets set RESEND_FROM_EMAIL=noreply@gdmregistro.com.br
```

### Redeploy das Funções (se necessário)

```bash
# Certifique-se de estar na pasta do projeto
cd C:\Users\PC\Desktop\apppesagem

# Deploy de todas as funções
npx supabase functions deploy append-sheet --no-verify-jwt
npx supabase functions deploy send-email --no-verify-jwt
npx supabase functions deploy upload-evidencias --no-verify-jwt
```

---

## 🌐 Deploy na Vercel - Passo a Passo

### Opção 1: Via Dashboard Vercel (Recomendado)

#### 1️⃣ Acesse o Projeto na Vercel

1. Login: https://vercel.com
2. Encontre o projeto **checkpeso** (ou similar)
3. Clique no projeto

#### 2️⃣ Configure as Variáveis de Ambiente

1. Vá em **Settings** → **Environment Variables**
2. Adicione/atualize cada variável:

| Name | Value | Environment |
|------|-------|-------------|
| `VITE_SUPABASE_URL` | `https://szonjqmqhwqmohliqlxw.supabase.co` | Production, Preview, Development |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbG...` (sua anon key completa) | Production, Preview, Development |
| `VITE_GOOGLE_SHEET_ID` | `seu-sheet-id` (opcional) | Production, Preview, Development |

**⚠️ IMPORTANTE**: 
- Marque **todos os ambientes** (Production, Preview, Development)
- Clique em **Save** após cada variável

#### 3️⃣ Faça o Redeploy

Opção A: **Via Dashboard**
1. Vá em **Deployments**
2. Clique nos `...` do último deployment
3. **Redeploy**
4. Marque ✅ **Use existing Build Cache** (opcional)
5. Clique em **Redeploy**

Opção B: **Via Commit no Git**
```bash
# No seu terminal local
git add .
git commit -m "Update: Novas funcionalidades (PDF, Email, Evidências)"
git push origin main
```

A Vercel fará deploy automaticamente.

### Opção 2: Via Vercel CLI

```bash
# Instale a CLI da Vercel (se não tiver)
npm install -g vercel

# Login
vercel login

# Link com o projeto existente
vercel link

# Configure as variáveis de ambiente
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel env add VITE_GOOGLE_SHEET_ID

# Deploy
vercel --prod
```

---

## 🔍 Verificação Pós-Deploy

### 1️⃣ Acesse a URL de Produção

```
https://seu-dominio.vercel.app
```

### 2️⃣ Teste as Funcionalidades

#### Login
```
✅ Login funciona
✅ Redirecionamento correto
```

#### Cálculos
```
✅ Formulário carrega
✅ Cálculos executados corretamente
✅ Pesagens das caixas funcionando
✅ Valores conforme ABNT 5429-S2
```

#### Evidências
```
✅ Upload de imagens funciona
✅ Compressão automática
✅ Armazenamento no Supabase
✅ Visualização em modal
✅ Download individual e ZIP
```

#### Relatórios
```
✅ Listagem de registros
✅ Filtros funcionando
✅ Exportação PDF (com evidências)
✅ Exportação Excel
✅ Exportação HTML
```

#### Email
```
✅ Botão "Enviar Email" disponível
✅ Modal abre corretamente
✅ Email é enviado
✅ PDF anexado corretamente
✅ Evidências no PDF
✅ Email chega na caixa de entrada
```

### 3️⃣ Verifique os Logs

Se houver erro:

1. **Vercel Dashboard**:
   - Vá em **Deployments** → Clique no deployment
   - Veja **Build Logs** e **Function Logs**

2. **Supabase Dashboard**:
   - Vá em **Edge Functions** → Clique na função
   - Veja **Logs** e **Invocations**

3. **Browser Console**:
   - Abra DevTools (F12)
   - Veja **Console** e **Network**

---

## 🐛 Troubleshooting

### Erro 1: "Supabase client not configured"

**Causa**: Variáveis de ambiente não configuradas

**Solução**:
1. Verifique se `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` estão configuradas
2. Certifique-se que **Production** está marcado
3. Faça um novo deploy

### Erro 2: "Failed to send email"

**Causa**: Secrets do Resend não configurados no Supabase

**Solução**:
```bash
# Configure os secrets
npx supabase secrets set RESEND_API_KEY=re_sua_api_key
npx supabase secrets set RESEND_FROM_EMAIL=noreply@gdmregistro.com.br

# Redeploy a função
npx supabase functions deploy send-email --no-verify-jwt
```

### Erro 3: "RLS policy violation"

**Causa**: Row Level Security não configurado

**Solução**:
1. Execute o script: `sql/EXECUTAR_ESTE.sql` no Supabase SQL Editor
2. Verifique que o usuário está autenticado

### Erro 4: "Image upload failed"

**Causa**: Bucket não configurado ou permissões incorretas

**Solução**:
1. Vá em **Supabase** → **Storage**
2. Certifique-se que o bucket `evidencias` existe
3. Verifique que o bucket é **privado**
4. Execute: `sql/EXECUTAR_ESTE.sql` para RLS

### Erro 5: Build falha na Vercel

**Causa**: Erro de TypeScript ou dependências

**Solução**:
```bash
# Localmente, execute
npm install
npm run build

# Se houver erros, corrija-os
# Depois faça commit e push
```

---

## 🎨 Configurações Avançadas

### Domínio Personalizado

1. **Vercel Dashboard** → **Settings** → **Domains**
2. Adicione seu domínio: `checkpeso.gdmregistro.com.br`
3. Configure DNS:
   ```
   Type: CNAME
   Name: checkpeso
   Value: cname.vercel-dns.com
   ```
4. Aguarde propagação (até 48h)

### Build & Deploy Settings

**Build Command**:
```bash
npm run build
```

**Output Directory**:
```
dist
```

**Install Command**:
```bash
npm install
```

**Development Command**:
```bash
npm start
```

### Environment Variables por Branch

| Branch | Environment |
|--------|-------------|
| `main` | Production |
| `develop` | Preview |
| outros | Preview |

---

## 📊 Monitoramento

### Métricas Vercel

- **Dashboard** → **Analytics**
  - Page Views
  - Top Pages
  - Top Referrers
  - Unique Visitors

### Logs Supabase

- **Edge Functions** → **Logs**
  - Invocations
  - Errors
  - Performance

### Alertas

Configure webhooks no Vercel para receber notificações:

1. **Settings** → **Git** → **Deploy Hooks**
2. Adicione webhook URL
3. Configure para disparar em:
   - ✅ Deploy success
   - ✅ Deploy failure

---

## 🔒 Segurança

### Headers de Segurança

Já configurados no `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

### CORS

Configurado nas Edge Functions para aceitar apenas origens confiáveis.

### Rate Limiting

- **Supabase**: Limite de API requests por IP
- **Resend**: Limite de emails por dia (plano free: 100/dia)

---

## 💰 Custos

### Vercel (Hobby - Gratuito)

- ✅ Unlimited deployments
- ✅ 100 GB bandwidth
- ✅ Serverless Functions
- ✅ Custom domains
- ⚠️ Limite: 100 GB/mês

### Supabase (Free Tier)

- ✅ 500 MB database
- ✅ 1 GB storage
- ✅ 2 GB bandwidth
- ✅ 50.000 active users
- ⚠️ Pausa após 7 dias inativo

### Resend (Free Tier)

- ✅ 100 emails/dia
- ✅ 3.000 emails/mês
- ⚠️ Apenas domínios verificados

**Custo Total**: **R$ 0,00** (no plano gratuito)

---

## 📋 Checklist de Deploy

### Antes do Deploy

- [ ] Código commitado e pushado
- [ ] `npm run build` funciona localmente
- [ ] Testes manuais realizados
- [ ] Variáveis de ambiente documentadas
- [ ] Secrets do Supabase configurados

### Durante o Deploy

- [ ] Variáveis de ambiente configuradas na Vercel
- [ ] Deploy iniciado (automático ou manual)
- [ ] Build concluído com sucesso
- [ ] Deployment URL gerada

### Após o Deploy

- [ ] URL de produção acessível
- [ ] Login funcionando
- [ ] Cálculos corretos
- [ ] Upload de evidências OK
- [ ] Geração de PDF OK
- [ ] Envio de email OK
- [ ] Performance aceitável
- [ ] Sem erros no console

---

## 🚀 Comandos Rápidos

### Deploy Completo (Primeiro Deploy)

```bash
# 1. Configure variáveis de ambiente na Vercel Dashboard
# 2. No terminal:
git add .
git commit -m "Deploy inicial CheckPeso v2.0"
git push origin main

# 3. Aguarde o deploy automático
# 4. Configure secrets do Supabase:
npx supabase secrets set RESEND_API_KEY=re_sua_api_key
npx supabase secrets set RESEND_FROM_EMAIL=noreply@gdmregistro.com.br
npx supabase functions deploy send-email --no-verify-jwt
```

### Redeploy (Atualizações)

```bash
# Opção 1: Git push (recomendado)
git add .
git commit -m "Update: descrição da mudança"
git push origin main

# Opção 2: Vercel CLI
vercel --prod

# Opção 3: Dashboard Vercel
# Deployments → ... → Redeploy
```

---

## 📖 Recursos Adicionais

### Documentação Oficial

- **Vercel**: https://vercel.com/docs
- **Supabase**: https://supabase.com/docs
- **Resend**: https://resend.com/docs

### Docs do Projeto

- `README.md` - Documentação geral
- `CONFIGURAR_EMAIL_RESEND.md` - Setup de email
- `CORRECAO_CALCULOS.md` - Cálculos ABNT
- `FUNCIONALIDADES_EVIDENCIAS_V2.md` - Sistema de evidências

### Suporte

- **Email**: suporte@gdm.com.br
- **Dashboard Vercel**: https://vercel.com/dashboard
- **Dashboard Supabase**: https://supabase.com/dashboard

---

## ✅ Resumo Executivo

### O Que Foi Configurado

✅ **Frontend**:
- Hospedado na Vercel
- Build otimizado (Vite + React)
- HTTPS automático
- CDN global

✅ **Backend**:
- Supabase (PostgreSQL + Storage + Functions)
- Row Level Security (RLS)
- Edge Functions deployadas

✅ **Email**:
- Resend configurado
- Domínio verificado: gdmregistro.com.br
- Secrets configurados

✅ **Storage**:
- Bucket privado `evidencias`
- URLs assinadas
- RLS configurado

### Próximos Passos

1. ✅ Variáveis de ambiente configuradas
2. ✅ Deploy realizado
3. ⏳ Testes em produção
4. ⏳ Monitoramento de métricas
5. ⏳ Feedback dos usuários

---

**Deploy concluído! 🎉**

**URL de Produção**: https://seu-dominio.vercel.app

**TESTE TUDO E BOA SORTE!** 🚀📊
