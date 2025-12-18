# 📧 Configurar Email com Resend + Domínio gdmregistro.com.br

## ✅ Status Atual

Pelo que vi nas imagens:
- ✅ Domínio **gdmregistro.com.br** registrado na Hostinger
- ✅ Domínio verificado no Resend
- ✅ Registros DNS (TXT, MX, CNAME) configurados
- ⚠️ Função send-email com erro 500

## 🔧 Passos para Corrigir

### 1️⃣ Atualizar RESEND_FROM_EMAIL no Supabase

A função está configurada, mas precisa usar o email correto do seu domínio.

#### Passos:

1. **Acesse o Supabase Dashboard**:
   - https://supabase.com/dashboard/project/szonjqmqhwqmohliqlxw

2. **Vá em Edge Functions**:
   - Menu lateral → **Edge Functions**
   - Clique em **send-email**

3. **Configure os Secrets**:
   - Clique na aba **Secrets** (ou **Settings**)
   - Adicione/atualize estas variáveis:

```
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@gdmregistro.com.br
```

**⚠️ IMPORTANTE**: O email deve ser do seu domínio!

#### Emails válidos para FROM:
```
✅ noreply@gdmregistro.com.br
✅ notificacoes@gdmregistro.com.br
✅ checkpeso@gdmregistro.com.br
✅ sistema@gdmregistro.com.br

❌ noreply@resend.dev (não funciona após verificação)
❌ qualquercoisa@gmail.com (não é seu domínio)
```

---

### 2️⃣ Obter API Key do Resend

#### Passos:

1. **Acesse o Resend**:
   - https://resend.com/login
   - Faça login

2. **Crie uma API Key**:
   - Menu lateral → **API Keys**
   - Clique em **Create API Key**
   - Nome: `checkpeso-production`
   - Permissão: **Full Access** ou **Send emails**
   - Copie a chave gerada

3. **Cole no Supabase**:
   - Volte no Supabase → Edge Functions → send-email → Secrets
   - `RESEND_API_KEY` = `re_xxxxxx` (a chave que você copiou)

---

### 3️⃣ Verificar Domínio no Resend

Baseado nas suas imagens, parece que já está verificado! ✅

Mas se precisar verificar novamente:

1. **Acesse Resend → Domains**
2. **Clique em gdmregistro.com.br**
3. **Verifique os Status**:
   - DKIM: ✅ Verificado
   - FPS/SPF: ✅ Verificado
   - DMARC: ✅ (Opcional)

4. **Se algum estiver pendente**:
   - Copie os registros DNS do Resend
   - Cole na Hostinger (DNS/Nameservers)
   - Aguarde 10-60 minutos para propagação
   - Clique em **Verify** no Resend

---

### 4️⃣ Fazer Deploy da Função (Atualizada)

Depois de configurar os secrets, faça deploy:

```powershell
# No terminal do VS Code (Powershell)
cd C:\Users\PC\Desktop\apppesagem

# Deploy da função
npx supabase functions deploy send-email --no-verify-jwt
```

**Ou manualmente no Dashboard**:
1. Supabase → Edge Functions → send-email
2. Clique em **Redeploy**

---

### 5️⃣ Testar o Envio

#### Teste Direto na Função (Supabase):

1. **Acesse a função**:
   - https://supabase.com/dashboard/project/szonjqmqhwqmohliqlxw/functions/send-email

2. **Clique em "Invoke"** ou **"Test"**

3. **Cole este JSON de teste**:

```json
{
  "to": ["seu-email@gmail.com"],
  "subject": "Teste CheckPeso",
  "html": "<h1>Teste de Email</h1><p>Se você recebeu este email, está funcionando!</p>",
  "pdfBase64": null,
  "pdfFileName": null
}
```

4. **Clique em "Send"**

5. **Verifique**:
   - ✅ Status 200 → Sucesso!
   - ❌ Status 500 → Veja o erro abaixo

---

## 🐛 Possíveis Erros e Soluções

### Erro 1: "RESEND_API_KEY não configurada"

**Solução**: Configure a API key nos secrets (passo 1 e 2).

### Erro 2: "403 Domain not verified"

**Solução**: 
1. Verifique o domínio no Resend (passo 3)
2. Aguarde propagação DNS (até 1 hora)
3. Use um email do domínio verificado em `from`

### Erro 3: "Invalid from address"

**Solução**: 
- Use um email do SEU domínio: `@gdmregistro.com.br`
- Não use `@resend.dev` ou `@gmail.com`

### Erro 4: "550 Mailbox not found"

**Solução**:
- O email de destino (`to`) não existe
- Verifique se digitou corretamente

### Erro 5: "Rate limit exceeded"

**Solução**:
- Você atingiu o limite de envios
- Plano gratuito: 100 emails/dia, 3.000/mês
- Aguarde ou faça upgrade no Resend

---

## 📊 Checklist de Configuração

### No Resend:
- [ ] API Key criada e copiada
- [ ] Domínio gdmregistro.com.br adicionado
- [ ] Domínio verificado (DKIM ✅, SPF ✅)
- [ ] Registros DNS corretos na Hostinger

### No Supabase:
- [ ] Secret `RESEND_API_KEY` configurada
- [ ] Secret `RESEND_FROM_EMAIL` = `noreply@gdmregistro.com.br`
- [ ] Função send-email deployada
- [ ] Teste manual funcionando

### No App:
- [ ] Teste de envio de email funciona
- [ ] PDF é anexado corretamente
- [ ] Email chega na caixa de entrada

---

## 🔍 Debug: Como Ver os Logs

### Logs da Função no Supabase:

1. **Acesse**:
   - https://supabase.com/dashboard/project/szonjqmqhwqmohliqlxw/functions/send-email

2. **Clique em "Logs"** ou **"Invocations"**

3. **Veja os logs em tempo real**:
   ```
   Recebendo requisição...
   Body recebido: { to: [...], subject: "...", hasPdf: true }
   Emails válidos: [...]
   Resend config: { hasApiKey: true, fromEmail: "noreply@gdmregistro.com.br" }
   Enviando para Resend API...
   Email enviado com sucesso: re_abc123xyz
   ```

4. **Se houver erro**:
   ```
   ❌ Resend API Error: { message: "Domain not verified" }
   ❌ RESEND_API_KEY não encontrada
   ❌ Erro ao enviar email via Resend: Invalid from address
   ```

---

## 📧 Exemplo de Email FROM Correto

### ✅ Correto:
```json
{
  "from": "noreply@gdmregistro.com.br",
  "to": ["cliente@empresa.com"],
  "subject": "Relatório CheckPeso",
  "html": "<h1>Relatório</h1>"
}
```

### ❌ Errado:
```json
{
  "from": "noreply@resend.dev",  // ❌ Não é seu domínio
  "to": ["cliente@empresa.com"],
  "subject": "Relatório CheckPeso",
  "html": "<h1>Relatório</h1>"
}
```

---

## 🎯 Passo a Passo Rápido (5 minutos)

1. **Copie a API Key do Resend**
   - https://resend.com/api-keys

2. **Cole no Supabase Secrets**:
   ```
   RESEND_API_KEY=re_xxxxxx
   RESEND_FROM_EMAIL=noreply@gdmregistro.com.br
   ```

3. **Faça deploy**:
   ```powershell
   npx supabase functions deploy send-email --no-verify-jwt
   ```

4. **Teste no app**:
   - Relatórios → Enviar Email
   - Digite seu email
   - Enviar

5. **Verifique sua caixa de entrada** ✉️

---

## 📸 Configuração DNS (Referência)

Baseado nas suas imagens, você já tem:

### Hostinger DNS:
```
TXT  resend._domainkey  [valor do DKIM]
CNAME www              gdmregistro.com.br
TXT  send              [valor SPF]
MX   send              feedback-smtp.sa-east-1.amazonses.com
```

### Resend Dashboard:
- Status: ✅ Verificado
- DKIM: ✅
- SPF: ✅

**Isso está correto!** ✅

---

## ❓ Perguntas Frequentes

### 1. Quanto tempo para DNS propagar?
- **Mínimo**: 10 minutos
- **Normal**: 30-60 minutos
- **Máximo**: 24 horas (raro)

### 2. Posso usar outro email FROM?
- Sim! Mas deve ser do seu domínio:
  - `sistema@gdmregistro.com.br` ✅
  - `suporte@gdmregistro.com.br` ✅
  - `qualquer-coisa@gdmregistro.com.br` ✅

### 3. Quantos emails posso enviar?
- **Plano Free**: 100/dia, 3.000/mês
- **Plano Pro**: 50.000/mês
- Veja: https://resend.com/pricing

### 4. O email vai para spam?
- Improvável se:
  - ✅ Domínio verificado
  - ✅ DKIM configurado
  - ✅ SPF configurado
  - ✅ DMARC configurado (opcional)

---

## 🔗 Links Úteis

- **Resend Dashboard**: https://resend.com/domains
- **Resend API Keys**: https://resend.com/api-keys
- **Supabase Functions**: https://supabase.com/dashboard/project/szonjqmqhwqmohliqlxw/functions
- **Hostinger DNS**: (seu painel de controle)

---

## ✅ Resultado Final

Quando tudo estiver configurado:

```
📧 Email enviado!
De: noreply@gdmregistro.com.br
Para: cliente@empresa.com
Assunto: Relatório de Recebimento - CheckPeso
Anexo: Relatorio_Registro_123.pdf (2.5 MB)
Status: ✅ Entregue
```

---

**SIGA ESTES PASSOS E TESTE!** 🚀

Se ainda der erro, me envie:
1. Print dos logs da função no Supabase
2. Print da configuração de Secrets
3. Status do domínio no Resend

Vou te ajudar a resolver! 💪
