# 🔧 Resolver Erro 403 Git Push - "Permission denied"

## ❌ Erro Identificado

```
remote: Permission to obedysjr-sys/apppesagem.git denied to beteste42-tech.
fatal: unable to access 'https://github.com/obedysjr-sys/apppesagem.git/': The requested URL returned error: 403
```

**Causa**: O Git está usando as credenciais do usuário `beteste42-tech`, mas você precisa usar `obedysjr-sys`.

---

## ✅ Solução 1: Usar GitHub CLI (Recomendado)

### Passo 1: Instalar GitHub CLI

```powershell
# Baixe e instale: https://cli.github.com/
# Ou via winget:
winget install GitHub.cli
```

### ⚠️ Se o comando `gh` não for reconhecido após instalação:

**Solução Rápida (Recomendada):**

1. **Feche e reabra o PowerShell** (o PATH é atualizado ao reiniciar o terminal)
2. Tente novamente: `gh auth login`

**Se ainda não funcionar:**

```powershell
# 1. Verificar se foi instalado
Get-Command gh -ErrorAction SilentlyContinue

# 2. Se não encontrar, adicionar manualmente ao PATH
# O GitHub CLI geralmente instala em:
$env:Path += ";C:\Program Files\GitHub CLI"

# 3. Ou reiniciar o computador (última opção)
```

**Alternativa Rápida**: Use a **Solução 2 (Personal Access Token)** abaixo - é mais direta e não requer reiniciar o terminal!

---

### Passo 2: Fazer Login

```powershell
# Login no GitHub
gh auth login

# Selecione:
# - GitHub.com
# - HTTPS
# - Yes (authenticate Git)
# - Login with a web browser
```

### Passo 3: Fazer Push

```powershell
cd "c:\Users\PC\Desktop\apppesagem"
git push origin main
```

---

## ✅ Solução 2: Personal Access Token (PAT)

### Passo 1: Criar Token no GitHub

1. Acesse: https://github.com/settings/tokens
2. Clique em **Generate new token** → **Classic**
3. Nome: `CheckPeso Deploy`
4. Expiration: 90 days (ou mais)
5. Marque os scopes:
   - ✅ `repo` (todos)
   - ✅ `workflow`
6. Clique em **Generate token**
7. **COPIE O TOKEN** (aparece apenas uma vez!)

### Passo 2: Usar Token no Push

```powershell
cd "c:\Users\PC\Desktop\apppesagem"

# Método 1: Via URL com token
git push https://<SEU_TOKEN>@github.com/obedysjr-sys/apppesagem.git main

# Método 2: Atualizar remote
git remote set-url origin https://<SEU_TOKEN>@github.com/obedysjr-sys/apppesagem.git
git push origin main
```

**⚠️ IMPORTANTE**: Substitua `<SEU_TOKEN>` pelo token que você copiou.

---

## ✅ Solução 3: Remover Credenciais Antigas do Windows

### Passo 1: Abrir Gerenciador de Credenciais

```powershell
# Abra o Gerenciador de Credenciais do Windows
control /name Microsoft.CredentialManager
```

Ou:
- Pressione `Win + R`
- Digite: `control keymgr.dll`
- Enter

### Passo 2: Remover Credenciais do Git

1. Vá em **Credenciais do Windows**
2. Procure por:
   - `git:https://github.com`
   - Ou qualquer entrada relacionada ao GitHub
3. Clique em cada uma → **Remover**

### Passo 3: Fazer Push Novamente

```powershell
cd "c:\Users\PC\Desktop\apppesagem"
git push origin main
```

O Git irá pedir suas credenciais novamente. Digite:
- **Username**: `obedysjr-sys`
- **Password**: Seu token do GitHub (não a senha!)

---

## ✅ Solução 4: SSH (Mais Seguro)

### Passo 1: Gerar Chave SSH

```powershell
# Gere uma chave SSH
ssh-keygen -t ed25519 -C "seu-email@exemplo.com"

# Aperte Enter 3 vezes (usa valores padrão)
```

### Passo 2: Copiar Chave Pública

```powershell
# Copie o conteúdo da chave pública
Get-Content $HOME\.ssh\id_ed25519.pub | Set-Clipboard

# Ou exiba no terminal:
cat $HOME\.ssh\id_ed25519.pub
```

### Passo 3: Adicionar no GitHub

1. Acesse: https://github.com/settings/keys
2. Clique em **New SSH key**
3. Nome: `CheckPeso - PC`
4. Cole a chave pública
5. Clique em **Add SSH key**

### Passo 4: Atualizar Remote para SSH

```powershell
cd "c:\Users\PC\Desktop\apppesagem"

# Mudar de HTTPS para SSH
git remote set-url origin git@github.com:obedysjr-sys/apppesagem.git

# Fazer push
git push origin main
```

---

## 🚀 Comandos Rápidos (Após Resolver)

### Método 1: GitHub CLI (Recomendado)

```powershell
# 1. Instalar GitHub CLI
winget install GitHub.cli

# 2. Login
gh auth login

# 3. Push
cd "c:\Users\PC\Desktop\apppesagem"
git push origin main
```

### Método 2: Token no Remote

```powershell
cd "c:\Users\PC\Desktop\apppesagem"

# Atualizar remote com token
git remote set-url origin https://ghp_SEU_TOKEN_AQUI@github.com/obedysjr-sys/apppesagem.git

# Push
git push origin main
```

---

## 🎯 Qual Solução Escolher?

| Solução | Facilidade | Segurança | Recomendação |
|---------|------------|-----------|--------------|
| **GitHub CLI** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | **RECOMENDADO** |
| **PAT Token** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Bom |
| **Limpar Credenciais** | ⭐⭐⭐ | ⭐⭐⭐ | OK |
| **SSH** | ⭐⭐ | ⭐⭐⭐⭐⭐ | Melhor segurança |

**Recomendação**: Use **GitHub CLI** (Solução 1) - é a mais fácil e segura!

---

## ✅ Após Resolver

```powershell
# 1. Verifique se o push funcionou
git push origin main

# 2. Verifique no GitHub
# Acesse: https://github.com/obedysjr-sys/apppesagem

# 3. Aguarde o deploy automático na Vercel
# Acesse: https://vercel.com/dashboard
```

---

## 🔍 Verificar Qual Usuário o Git Está Usando

```powershell
# Ver configuração global
git config --global user.name
git config --global user.email

# Ver credencial armazenada
git config --get credential.helper
```

---

## 📞 Se Ainda Não Funcionar

1. **Certifique-se de estar logado como obedysjr-sys**:
   - GitHub.com → Perfil → Certifique-se do usuário correto

2. **Tente via GitHub Desktop**:
   - Baixe: https://desktop.github.com
   - Clone o repositório pelo app
   - Faça commit e push pelo app

3. **Crie um novo token** com permissões corretas:
   - https://github.com/settings/tokens
   - Deve ter permissão `repo` completa

---

**RESOLVA E FAÇA O PUSH! 🚀**

Após o push, a Vercel fará deploy automático! ✅
