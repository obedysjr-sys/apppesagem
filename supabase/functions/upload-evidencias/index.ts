import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

interface UploadRequest {
  fileName: string;
  fileData: string; // Base64
  registroId?: string; // ID do registro de pesagem (opcional)
}

// Headers CORS
const getCorsHeaders = (origin: string | null) => {
  const defaultOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:5174',
  ];

  const allowedEnv = (typeof Deno !== 'undefined' ? Deno.env.get('ALLOWED_ORIGINS') : undefined) || '';
  const allowedFromEnv = allowedEnv.split(',').map(s => s.trim()).filter(Boolean);

  const isVercel = origin ? /\.vercel\.app$/i.test(origin) : false;
  const isAllowed = Boolean(
    origin && (
      defaultOrigins.includes(origin) ||
      allowedFromEnv.includes(origin) ||
      isVercel
    )
  );

  return {
    'Access-Control-Allow-Origin': origin && isAllowed ? origin : (origin ?? defaultOrigins[0]),
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
};

/**
 * Faz upload de arquivo para o Supabase Storage
 */
async function uploadToStorage(
  supabaseUrl: string,
  supabaseKey: string,
  fileName: string,
  fileData: string, // Base64
  registroId?: string
): Promise<{ fileId: string; publicUrl: string }> {
  // Remove prefixo data:image/...;base64, se existir
  let base64Data = fileData;
  if (fileData.includes(',')) {
    base64Data = fileData.split(',')[1];
  }

  // Remove espaços, quebras de linha e outros caracteres inválidos do base64
  base64Data = base64Data.replace(/\s/g, '').replace(/\r/g, '').replace(/\n/g, '');

  // Validar tamanho mínimo do base64
  if (base64Data.length < 50) {
    console.error(`Base64 muito curto: ${base64Data.length} caracteres`);
    throw new Error(`Base64 inválido ou incompleto (${base64Data.length} caracteres).`);
  }

  let binaryData: Uint8Array;
  try {
    binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
  } catch (err) {
    console.error('Falha ao decodificar base64 do arquivo.');
    console.error('Primeiros 50 caracteres do base64:', base64Data.substring(0, 50));
    throw new Error(`Erro ao decodificar base64: ${err instanceof Error ? err.message : String(err)}`);
  }

  if (binaryData.length < 10) {
    throw new Error('Arquivo muito pequeno para ser uma imagem válida');
  }

  // Criar cliente Supabase
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Estrutura de caminho: evidencias/Ano/Mes/Registro_ID/arquivo.jpg
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  
  // Gerar nome único para o arquivo
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const ext = fileName.split('.').pop() || 'jpg';
  const uniqueFileName = `${timestamp}_${randomStr}.${ext}`;
  
  // Caminho no storage
  let storagePath: string;
  if (registroId) {
    storagePath = `evidencias/${year}/${month}/registro_${registroId}/${uniqueFileName}`;
  } else {
    storagePath = `evidencias/${year}/${month}/${uniqueFileName}`;
  }

  console.log('Fazendo upload para Supabase Storage:', storagePath);

  // Fazer upload
  const { data, error } = await supabase.storage
    .from('evidencias')
    .upload(storagePath, binaryData, {
      contentType: `image/${ext}`,
      upsert: false,
    });

  if (error) {
    console.error('Erro no upload para Supabase Storage:', error);
    throw new Error(`Falha ao fazer upload: ${error.message}`);
  }

  // Obter URL pública
  const { data: urlData } = supabase.storage
    .from('evidencias')
    .getPublicUrl(storagePath);

  console.log('Upload concluído:', data.path);

  return {
    fileId: data.path,
    publicUrl: urlData.publicUrl,
  };
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('Origin');
  const corsHeaders = getCorsHeaders(origin);

  // Resposta imediata para requisições preflight OPTIONS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Recebendo requisição de upload...');
    
    const { fileName, fileData, registroId }: UploadRequest = await req.json();

    if (!fileName || !fileData) {
      return new Response(
        JSON.stringify({ error: 'fileName e fileData são obrigatórios' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Obter configurações do Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase config não encontrada');
      return new Response(
        JSON.stringify({ 
          error: 'Configuração do Supabase não encontrada',
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Fazer upload do arquivo
    console.log('Fazendo upload do arquivo...');
    console.log('Nome do arquivo:', fileName);
    console.log('Tamanho do fileData:', fileData.length, 'caracteres');
    
    const uploadResult = await uploadToStorage(
      supabaseUrl,
      supabaseServiceKey,
      fileName,
      fileData,
      registroId
    );
    
    console.log('Upload concluído:', uploadResult.fileId);

    return new Response(
      JSON.stringify({
        success: true,
        fileId: uploadResult.fileId,
        webViewLink: uploadResult.publicUrl,
        webContentLink: uploadResult.publicUrl,
        publicUrl: uploadResult.publicUrl,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('Erro ao processar upload:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Erro desconhecido',
        details: String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
