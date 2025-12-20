# Configuração do Sistema de Envio de Emails por Filiais

## 📋 O que foi implementado

O sistema de envio de emails foi completamente reestruturado para permitir seleção organizada de destinatários através de:

### 1. **Seleção de Filiais (Checkbox)**
Ao selecionar uma filial, TODOS os emails da lista são automaticamente incluídos como cópia (CC):

- ✅ **CD Itaitinga CE** (29 emails)
- ✅ **CD BA / CEASA BA** (27 emails)
- ✅ **Trielo CD Paulista PE** (23 emails)
- ✅ **FST Mamanguape PB / Baraúna RN** (21 emails)

### 2. **Setor de Compras (Multisseleção Individual)**
O usuário pode selecionar um ou mais emails individualmente:

- import@frutasdocemel.com.br
- monique.dantas@frutasdocemel.com.br
- maria.deusdedite@frutasdocemel.com.br
- sydney.noronha@frutasdocemel.com.br
- fabricio.nascimento@frutasdocemel.com.br

### 3. **Emails de Fornecedores (Digitação Manual)**
O usuário pode adicionar quantos emails de fornecedores desejar digitando manualmente.

---

## 🔧 Arquivos Modificados

### 1. `src/app/relatorios/send-email-dialog.tsx`
- Adicionadas constantes com todas as listas de emails das filiais
- Nova interface com 3 seções: Filiais, Compras e Fornecedores
- Sistema de checkboxes para seleção de filiais
- Sistema de checkboxes individuais para emails de compras
- Campos de digitação para emails de fornecedores
- Todos os emails selecionados são enviados como **CC (cópia)**

### 2. `supabase/functions/send-email/index.ts`
- Adicionado suporte ao campo `cc` (cópia) na interface `EmailRequest`
- Validação de emails tanto no campo `to` quanto no campo `cc`
- Payload do Resend agora inclui o campo `cc` quando fornecido
- Mensagem de sucesso atualizada para mostrar total de destinatários (TO + CC)

---

## ⚙️ Configuração no Resend

### **NÃO É NECESSÁRIO FAZER NENHUMA CONFIGURAÇÃO ADICIONAL NO RESEND!**

✅ A API do Resend já suporta nativamente o campo `cc` (cópia)  
✅ O código já está preparado para enviar emails com cópia  
✅ Basta ter a `RESEND_API_KEY` configurada no Supabase (que você já tem)

### Verificar no Supabase Edge Functions

1. Acesse: **Supabase Dashboard > Edge Functions**
2. Selecione a função: `send-email`
3. Vá em: **Settings > Secrets**
4. Confirme que existe: `RESEND_API_KEY=re_xxxxxxxxxxxxx`
5. Confirme que existe: `RESEND_FROM_EMAIL=seu-email@dominio.com`

**Se essas variáveis já estão configuradas, você NÃO precisa fazer mais nada!**

---

## 📧 Como o Email é Enviado

```typescript
{
  from: "seu-email@dominio.com",
  to: ["noreply@frutasdocemel.com.br"],  // Email principal (não visualizado)
  cc: [                                   // TODOS os emails selecionados vão aqui
    // Emails das filiais selecionadas
    "estoque.ce@frutasdocemel.com.br",
    "evaldo.domingos@frutasdocemel.com.br",
    // ... todos os outros emails das filiais
    
    // Emails de compras selecionados
    "import@frutasdocemel.com.br",
    "monique.dantas@frutasdocemel.com.br",
    
    // Emails de fornecedores digitados
    "fornecedor1@exemplo.com",
    "fornecedor2@exemplo.com"
  ],
  subject: "Relatório de Recebimento - ...",
  html: "...",
  attachments: [{ filename: "...", content: "..." }]
}
```

---

## 🚀 Como Usar no App

1. **Abra um relatório** na tela de Relatórios
2. **Clique em "Enviar Email"**
3. **Selecione as filiais** marcando os checkboxes (cada checkbox seleciona automaticamente todos os emails daquela filial)
4. **Selecione emails de compras** individualmente se desejar
5. **Digite emails de fornecedores** nos campos de texto
6. **Veja o resumo** com o total de destinatários no rodapé
7. **Clique em "Enviar Email"**

---

## ✨ Novos Recursos da Interface

- 📊 **Contador em tempo real** mostrando quantos emails estão selecionados
- 🎨 **Interface moderna** com ícones e cores para cada seção
- 📱 **Responsiva** com scroll para telas menores
- ⚡ **Rápida** - checkboxes selecionam todos os emails instantaneamente
- 🔍 **Transparente** - mostra quantos emails cada filial tem
- ✅ **Validação** - só permite envio se houver pelo menos um email selecionado

---

## 🧪 Testando

### 1. Testar Seleção de Filial Única
- Marcar apenas "CD Itaitinga CE"
- Verificar contador: deve mostrar 29 destinatários
- Enviar e confirmar que todos receberam

### 2. Testar Múltiplas Filiais
- Marcar "CD Itaitinga CE" + "CD BA / CEASA BA"
- Verificar contador: deve mostrar 56 destinatários (sem duplicatas)
- Enviar e confirmar

### 3. Testar Combinação Completa
- Marcar 1 filial
- Selecionar 2 emails de compras
- Adicionar 2 emails de fornecedores
- Verificar que o total está correto
- Enviar e confirmar que todos receberam como CC

---

## 📝 Observações Importantes

1. **Duplicatas são removidas automaticamente** - Se um email aparece em múltiplas listas, ele recebe apenas uma vez
2. **Emails inválidos são filtrados** - Tanto na validação do frontend quanto do backend
3. **Todos recebem como CC** - Nenhum destinatário vê os outros destinatários (se configurado assim no Resend)
4. **Limite do Resend** - Verifique o plano do Resend para o limite de destinatários por email

---

## 🔄 Deploy

Após as alterações, faça o deploy:

```bash
# Frontend (se estiver usando Vercel/Netlify)
npm run build
# Deploy automático via Git push

# Backend - Edge Function do Supabase
# Faça o deploy via Supabase CLI:
supabase functions deploy send-email
```

---

## ✅ Checklist Final

- [x] Listas de emails de todas as filiais configuradas
- [x] Lista de emails do setor de compras configurada
- [x] Interface com checkboxes para filiais
- [x] Interface com checkboxes para compras
- [x] Interface com campos para fornecedores
- [x] Contador de destinatários em tempo real
- [x] Remoção automática de duplicatas
- [x] Validação de emails no frontend
- [x] Validação de emails no backend
- [x] Suporte a CC na Edge Function
- [x] Mensagens de sucesso/erro apropriadas
- [x] Sem erros de linting

---

## 🎉 Pronto para Usar!

O sistema está completamente funcional e não requer configurações adicionais no Resend. Basta testar e usar!

