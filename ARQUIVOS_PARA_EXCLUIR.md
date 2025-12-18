# 🗑️ Arquivos para Excluir - Limpeza do Projeto

## Status: Análise Completa

Esta é uma lista de arquivos antigos/temporários que podem ser excluídos com segurança.

---

## 📄 Arquivos Markdown para Excluir (24 arquivos)

### Documentação Antiga/Obsoleta do Google Drive:
```
❌ CONFIGURAR_PASTA_GOOGLE_DRIVE.md
❌ GUIA_RAPIDO_PASTA_DRIVE.md
❌ CORRIGIR_GOOGLE_PRIVATE_KEY.md
```
**Motivo**: Migramos do Google Drive para Supabase Storage

### Documentação Temporária de Debug:
```
❌ BASE64_TESTE.md
❌ DEBUG_EMAIL.md
❌ VERIFICACAO_PRE_TESTE.md
❌ ACAO_NECESSARIA.md
❌ TESTE_FUNCAO_EMAIL.md
```
**Motivo**: Arquivos temporários de debug/teste

### Documentação Duplicada/Intermediária:
```
❌ EXECUTAR_AGORA.md
❌ EXECUTE_AGORA_FINAL.md
❌ INICIO_RAPIDO.md
❌ CHECKLIST_EVIDENCIAS.md
❌ README_EVIDENCIAS.md
❌ PASSOS_FINAIS_EVIDENCIAS.md
❌ SOLUCAO_FINAL_EVIDENCIAS.md
❌ CORRIGIR_RLS_EVIDENCIAS.md
❌ CRIAR_BUCKET_SUPABASE.md
❌ MIGRACAO_STORAGE.md
❌ RESUMO_IMPLEMENTACAO.md
❌ MELHORIAS_EVIDENCIAS.md
❌ RESUMO_FINAL_CORRECOES.md
❌ CORRECOES_EVIDENCIAS_EMAIL.md
❌ COMANDOS_RAPIDOS_EMAIL.md
```
**Motivo**: Documentação intermediária consolidada em arquivos finais

### Documentação Redundante:
```
❌ CONFIGURACAO_EVIDENCIAS.md
❌ CONFIGURACAO_RESEND.md
❌ CONFIGURAR_SECRET_RESEND.md
❌ DEPLOY_FUNCAO_EMAIL.md
❌ SOLUCAO_ERRO_403_RESEND.md
❌ SOLUCAO_FETCH_FAILED.md
```
**Motivo**: Substituído por CONFIGURAR_EMAIL_RESEND.md

### Info/Docs Antigas:
```
❌ info.md
❌ checkpeso_project_files.md
```
**Motivo**: Documentação descontinuada

---

## 📄 Arquivos Markdown para MANTER (5 arquivos)

```
✅ README.md (será reescrito)
✅ CONFIGURAR_EMAIL_RESEND.md (guia completo de email)
✅ CORRECAO_CALCULOS.md (documentação de cálculos)
✅ MELHORIAS_EMAIL_PDF.md (documentação de PDF individual)
✅ PDF_RELATORIO_FINALIZADO.md (documentação de PDF relatório)
✅ RELATORIO_PDF_MELHORADO.md (histórico de melhorias)
✅ FUNCIONALIDADES_EVIDENCIAS_V2.md (documentação de evidências)
✅ RESOLVER_RLS.md (documentação de RLS - útil para referência)
✅ CORRECAO_EMAIL_FORMAT.md (correção recente)
```

---

## 🗄️ Arquivos SQL para Excluir (8 arquivos)

### Scripts Temporários/Intermediários:
```
❌ sql/corrigir_evidencias_simples.sql
❌ sql/corrigir_evidencias_final.sql
❌ sql/corrigir_evidencias_completo.sql
❌ sql/fix_evidencias_rls.sql
❌ sql/desabilitar_rls_evidencias.sql
❌ sql/descobrir_tipo_registro_id.sql
❌ sql/rls_permissivo.sql
❌ sql/create_evidencias_bucket.sql
```
**Motivo**: Scripts de correção já aplicados, obsoletos

---

## 🗄️ Arquivos SQL para MANTER (3 arquivos)

```
✅ sql/EXECUTAR_ESTE.sql (script principal RLS)
✅ sql/add_evidencias_table.sql (criação de tabela)
✅ sql/rls_registros_peso.sql (RLS registros peso)
```

---

## 📁 Outros Arquivos para Excluir

```
❌ background.png (duplicado, já existe em public/)
❌ ao atualizada 1.1 - implementacao da tela de caixas com baixo peso e melhorias visuais (arquivo texto antigo)
```

---

## 📊 Resumo de Exclusão

| Categoria | Total | Para Excluir | Para Manter |
|-----------|-------|--------------|-------------|
| Markdown (*.md) | 39 | 30 | 9 |
| SQL (*.sql) | 11 | 8 | 3 |
| Outros | 2 | 2 | 0 |
| **TOTAL** | **52** | **40** | **12** |

**Redução**: ~77% dos arquivos temporários/obsoletos removidos

---

## ✅ Arquivos que Serão CRIADOS

Após a limpeza, serão criados:
```
✅ README.md (completo e profissional)
✅ DEPLOY_VERCEL.md (guia de deployment na Vercel)
```

---

## 🚀 Próximos Passos

1. ✅ Revisar lista de exclusão
2. ⏳ Executar exclusões em batch
3. ⏳ Criar README.md profissional
4. ⏳ Criar guia DEPLOY_VERCEL.md

---

**REVISÃO NECESSÁRIA**: Confirme antes de excluir!
