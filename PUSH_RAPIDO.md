# 🚀 Push Rápido - Personal Access Token (2 minutos)

## ⚡ Solução Mais Rápida (Sem Reiniciar Terminal)

### Passo 1: Criar Token no GitHub (1 minuto)

1. **Acesse**: https://github.com/settings/tokens/new
2. **Note**: `CheckPeso Deploy`
3. **Expiration**: 90 days (ou mais)
4. **Marque**:
   - ✅ `repo` (todas as opções)
   - ✅ `workflow`
5. **Clique**: `Generate token`
6. **⚠️ COPIE O TOKEN AGORA** (começa com `ghp_...`)

---

### Passo 2: Fazer Push (30 segundos)

```powershell
cd "c:\Users\PC\Desktop\apppesagem"

# Substitua SEU_TOKEN_AQUI pelo token que você copiou
git remote set-url origin https://SEU_TOKEN_AQUI@github.com/obedysjr-sys/apppesagem.git

# Push
git push origin main
```

**Exemplo**:
```powershell
git remote set-url origin https://ghp_abc123xyz456@github.com/obedysjr-sys/apppesagem.git
git push origin main
```

---

## ✅ Pronto!

Após o push, a Vercel fará deploy automático! 🎉

---

## 🔄 Para Próximas Vezes

O token fica salvo no remote. Você só precisa fazer:

```powershell
git push origin main
```

**Não precisa** colocar o token novamente!

---

## 🔒 Segurança

- ✅ O token fica apenas no seu computador
- ✅ Você pode revogar o token a qualquer momento em: https://github.com/settings/tokens
- ✅ O token expira automaticamente (você escolheu 90 dias)

---

**FAÇA AGORA! 🚀**
