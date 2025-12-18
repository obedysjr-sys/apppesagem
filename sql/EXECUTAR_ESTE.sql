-- ========================================
-- CORREÇÃO DEFINITIVA DA TABELA EVIDENCIAS
-- ========================================
-- Este SQL pode ser executado múltiplas vezes sem erro!

-- 1. ADICIONAR COLUNA uploaded_by (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'evidencias' 
    AND column_name = 'uploaded_by'
  ) THEN
    ALTER TABLE public.evidencias 
    ADD COLUMN uploaded_by UUID REFERENCES auth.users(id);
    CREATE INDEX IF NOT EXISTS idx_evidencias_uploaded_by ON public.evidencias(uploaded_by);
    RAISE NOTICE '✓ Coluna uploaded_by adicionada!';
  ELSE
    RAISE NOTICE '✓ Coluna uploaded_by já existe.';
  END IF;
END $$;

-- 2. REMOVER TODAS AS POLÍTICAS EXISTENTES
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'evidencias'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.evidencias', pol.policyname);
    RAISE NOTICE '✓ Removida política: %', pol.policyname;
  END LOOP;
END $$;

-- 3. HABILITAR RLS
ALTER TABLE public.evidencias ENABLE ROW LEVEL SECURITY;

-- 4. CRIAR POLÍTICAS NOVAS
CREATE POLICY "evidencias_select_policy"
ON public.evidencias FOR SELECT TO authenticated USING (true);

CREATE POLICY "evidencias_insert_policy"
ON public.evidencias FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "evidencias_update_policy"
ON public.evidencias FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "evidencias_delete_policy"
ON public.evidencias FOR DELETE TO authenticated USING (true);

-- 5. CORRIGIR TIPO DA COLUNA registro_id AUTOMATICAMENTE
DO $$
DECLARE
  tipo_registro_peso TEXT;
  tipo_evidencias TEXT;
BEGIN
  -- Descobrir tipos
  SELECT data_type INTO tipo_registro_peso
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'registros_peso' AND column_name = 'id';
  
  SELECT data_type INTO tipo_evidencias
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'evidencias' AND column_name = 'registro_id';
  
  RAISE NOTICE '✓ Tipo registros_peso.id: %', tipo_registro_peso;
  RAISE NOTICE '✓ Tipo evidencias.registro_id: %', tipo_evidencias;
  
  -- Se tipos diferentes, corrigir
  IF tipo_registro_peso != tipo_evidencias THEN
    RAISE NOTICE '⚠ Tipos incompatíveis! Corrigindo...';
    
    ALTER TABLE public.evidencias DROP CONSTRAINT IF EXISTS evidencias_registro_id_fkey;
    TRUNCATE TABLE public.evidencias;
    
    IF tipo_registro_peso = 'uuid' THEN
      EXECUTE 'ALTER TABLE public.evidencias ALTER COLUMN registro_id TYPE UUID USING registro_id::UUID';
    ELSIF tipo_registro_peso = 'bigint' THEN
      EXECUTE 'ALTER TABLE public.evidencias ALTER COLUMN registro_id TYPE BIGINT USING NULL';
    END IF;
    
    ALTER TABLE public.evidencias ALTER COLUMN registro_id SET NOT NULL;
    ALTER TABLE public.evidencias 
    ADD CONSTRAINT evidencias_registro_id_fkey 
    FOREIGN KEY (registro_id) REFERENCES public.registros_peso(id) ON DELETE CASCADE;
    
    RAISE NOTICE '✓ Tipo corrigido de % para %!', tipo_evidencias, tipo_registro_peso;
  ELSE
    RAISE NOTICE '✓ Tipos já compatíveis: %', tipo_registro_peso;
    
    -- Garantir FK existe
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'evidencias_registro_id_fkey'
        AND table_name = 'evidencias'
        AND table_schema = 'public'
    ) THEN
      ALTER TABLE public.evidencias 
      ADD CONSTRAINT evidencias_registro_id_fkey 
      FOREIGN KEY (registro_id) REFERENCES public.registros_peso(id) ON DELETE CASCADE;
      RAISE NOTICE '✓ Foreign key criada.';
    ELSE
      RAISE NOTICE '✓ Foreign key já existe.';
    END IF;
  END IF;
END $$;

-- 6. CRIAR ÍNDICES (se não existirem)
CREATE INDEX IF NOT EXISTS idx_evidencias_registro_id ON public.evidencias(registro_id);
CREATE INDEX IF NOT EXISTS idx_evidencias_uploaded_at ON public.evidencias(uploaded_at);

-- 7. VERIFICAÇÃO FINAL
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✓✓✓ CORREÇÃO CONCLUÍDA COM SUCESSO! ✓✓✓';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Agora teste o upload de evidências no app!';
END $$;

-- Mostrar estrutura final
SELECT 
  column_name as "Coluna",
  data_type as "Tipo",
  is_nullable as "Permite NULL"
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'evidencias'
ORDER BY ordinal_position;
