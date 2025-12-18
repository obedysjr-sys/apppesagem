# ⚠️ Problema com Token Fine-Grained

## ❌ Erro Identificado

```
remote: Permission to obedysjr-sys/apppesagem.git denied to obedysjr-sys.
fatal: unable to access 'https://github.com/obedysjr-sys/apppesagem.git/': The requested URL returned error: 403
```

**Causa**: O token `github_pat_...` é um **Fine-Grained Token** que pode ter restrições específicas. Ele precisa ter permissão de **write** no repositório.

---

## ✅ Solução: Criar Token Classic (ghp_...)

### Passo 1: Criar Novo Token Classic

1. **Acesse**: https://github.com/settings/tokens/new
2. **IMPORTANTE**: Selecione **"Generate new token"** → **"Generate new token (classic)"**
3. **Note**: `CheckPeso Deploy Classic`
4. **Expiration**: 90 days (ou mais)
5. **Marque os scopes**:
   - ✅ **`repo`** (todas as opções - isso dá acesso completo ao repositório)
   - ✅ **`workflow`** (se você usar GitHub Actions)
6. **Clique**: `Generate token`
7. **⚠️ COPIE O TOKEN** (começa com `ghp_...`)

---

### Passo 2: Atualizar Remote e Fazer Push

```powershell
cd "c:\Users\PC\Desktop\apppesagem"

# Substitua SEU_TOKEN_GHP pelo token classic que você copiou (ghp_...)
git remote set-url origin https://SEU_TOKEN_GHP@github.com/obedysjr-sys/apppesagem.git

# Push
git push origin main
```

---

## 🔍 Verificar Permissões do Token Fine-Grained (Alternativa)

Se você quiser usar o token fine-grained atual:

1. **Acesse**: https://github.com/settings/tokens
2. **Clique no token** `github_pat_...`
3. **Verifique**:
   - ✅ **Repository access**: Deve estar em "Selected repositories" e incluir `obedysjr-sys/apppesagem`
   - ✅ **Permissions**: Deve ter:
     - **Repository permissions** → **Contents**: Read and write
     - **Repository permissions** → **Metadata**: Read-only (já vem marcado)
4. **Salve** as alterações

Depois tente o push novamente:

```powershell
cd "c:\Users\PC\Desktop\apppesagem"
git push origin main
```

---

## 🎯 Recomendação

**Use um Token Classic (`ghp_...`)** - é mais simples e tem menos restrições!

1. Crie um token classic: https://github.com/settings/tokens/new
2. Marque apenas `repo` (todas as opções)
3. Use no remote como mostrado acima

---

## ✅ Após Resolver

```powershell
# Verificar se funcionou
git push origin main

# Verificar no GitHub
# Acesse: https://github.com/obedysjr-sys/apppesagem
```

---

**CRIE UM TOKEN CLASSIC E TENTE NOVAMENTE! 🚀**
