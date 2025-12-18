-- Tabela para armazenar evidências (imagens) dos registros de pesagem
CREATE TABLE IF NOT EXISTS public.evidencias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  registro_id UUID NOT NULL REFERENCES public.registros_peso(id) ON DELETE CASCADE,
  file_id TEXT NOT NULL, -- ID do arquivo no Google Drive
  file_name TEXT NOT NULL, -- Nome do arquivo original
  web_view_link TEXT NOT NULL, -- Link para visualizar no Google Drive
  web_content_link TEXT NOT NULL, -- Link direto para o conteúdo
  file_size BIGINT NOT NULL, -- Tamanho do arquivo em bytes
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_evidencias_registro_id ON public.evidencias(registro_id);
CREATE INDEX IF NOT EXISTS idx_evidencias_file_id ON public.evidencias(file_id);
CREATE INDEX IF NOT EXISTS idx_evidencias_uploaded_at ON public.evidencias(uploaded_at);

-- Comentários
COMMENT ON TABLE public.evidencias IS 'Armazena informações sobre evidências (imagens) anexadas aos registros de pesagem';
COMMENT ON COLUMN public.evidencias.registro_id IS 'ID do registro de pesagem ao qual a evidência pertence';
COMMENT ON COLUMN public.evidencias.file_id IS 'ID único do arquivo no Google Drive';
COMMENT ON COLUMN public.evidencias.web_view_link IS 'Link para visualizar o arquivo no Google Drive';
COMMENT ON COLUMN public.evidencias.web_content_link IS 'Link direto para baixar/visualizar o conteúdo do arquivo';

-- RLS (Row Level Security) - Permitir leitura pública, escrita apenas autenticada
ALTER TABLE public.evidencias ENABLE ROW LEVEL SECURITY;

-- Política: Qualquer um pode ler evidências
CREATE POLICY "Evidencias são públicas para leitura"
  ON public.evidencias
  FOR SELECT
  USING (true);

-- Política: Apenas usuários autenticados podem inserir evidências
CREATE POLICY "Usuários autenticados podem inserir evidências"
  ON public.evidencias
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Política: Apenas usuários autenticados podem atualizar evidências
CREATE POLICY "Usuários autenticados podem atualizar evidências"
  ON public.evidencias
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Política: Apenas usuários autenticados podem deletar evidências
CREATE POLICY "Usuários autenticados podem deletar evidências"
  ON public.evidencias
  FOR DELETE
  USING (auth.role() = 'authenticated');
