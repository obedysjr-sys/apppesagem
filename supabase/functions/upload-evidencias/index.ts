import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { google } from 'npm:googleapis@126.0.1';

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
 * Autentica com Google Drive usando Service Account
 */
async function getGoogleDriveClient() {
  console.log('=== AUTENTICANDO COM GOOGLE DRIVE ===');
  
  const serviceAccountEmail = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_EMAIL');
  const privateKey = Deno.env.get('GOOGLE_PRIVATE_KEY')?.replace(/\\n/g, '\n');

  if (!serviceAccountEmail) {
    console.error('GOOGLE_SERVICE_ACCOUNT_EMAIL não configurado');
    throw new Error('GOOGLE_SERVICE_ACCOUNT_EMAIL não configurado');
  }

  if (!privateKey) {
    console.error('GOOGLE_PRIVATE_KEY não configurado');
    throw new Error('GOOGLE_PRIVATE_KEY não configurado');
  }

  console.log('Service Account Email:', serviceAccountEmail);
  console.log('Private Key length:', privateKey.length);
  console.log('Private Key starts with:', privateKey.substring(0, 30));

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: serviceAccountEmail,
        private_key: privateKey,
      },
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });

    console.log('GoogleAuth criado com sucesso');

    const drive = google.drive({ version: 'v3', auth });
    console.log('Cliente Google Drive criado com sucesso');
    
    return drive;
  } catch (authError: any) {
    console.error('Erro ao criar cliente Google Drive:', authError);
    console.error('Mensagem:', authError?.message);
    console.error('Stack:', authError?.stack);
    throw new Error(`Falha na autenticação Google: ${authError?.message || String(authError)}`);
  }
}

/**
 * Busca ou cria uma pasta no Google Drive
 */
async function getOrCreateFolder(
  drive: any,
  parentFolderId: string,
  folderName: string
): Promise<string> {
  // Buscar pasta existente
  const response = await drive.files.list({
    q: `'${parentFolderId}' in parents and name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id, name)',
    spaces: 'drive',
  });

  if (response.data.files && response.data.files.length > 0) {
    return response.data.files[0].id!;
  }

  // Criar pasta se não existir
  const folderMetadata = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
    parents: [parentFolderId],
  };

  const folder = await drive.files.create({
    requestBody: folderMetadata,
    fields: 'id',
  });

  return folder.data.id!;
}

/**
 * Faz upload de arquivo para o Google Cloud Storage
 */
async function uploadToGoogleCloudStorage(
  fileName: string,
  fileData: string, // Base64
  registroId?: string
): Promise<{ fileId: string; webViewLink: string; webContentLink: string }> {
  const bucketName = Deno.env.get('GOOGLE_CLOUD_STORAGE_BUCKET_NAME');
  if (!bucketName) {
    throw new Error('GOOGLE_CLOUD_STORAGE_BUCKET_NAME não configurado');
  }

  console.log('Iniciando upload para Google Cloud Storage...');
  console.log('Bucket:', bucketName);
  console.log('Nome do arquivo:', fileName);
  console.log('Registro ID:', registroId || 'não fornecido');

  // Decodificar base64
  let base64Data = fileData;
  if (fileData.includes(',')) {
    base64Data = fileData.split(',')[1];
  }
  base64Data = base64Data.replace(/\s/g, '').replace(/\r/g, '').replace(/\n/g, '');

  const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

  // Criar estrutura de pastas: Ano/Mês/Registro_ID/arquivo
  const now = new Date();
  const year = String(now.getFullYear());
  const month = String(now.getMonth() + 1).padStart(2, '0');

  // Gerar nome único para o arquivo
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const ext = fileName.split('.').pop() || 'jpg';
  const uniqueFileName = `${timestamp}_${randomStr}.${ext}`;

  // Construir caminho no bucket
  let objectPath: string;
  if (registroId) {
    objectPath = `evidencias/${year}/${month}/registro_${registroId}/${uniqueFileName}`;
  } else {
    objectPath = `evidencias/${year}/${month}/${uniqueFileName}`;
  }

  console.log('Caminho no bucket:', objectPath);
  console.log('Tamanho do arquivo:', binaryData.length, 'bytes');

  try {
    // Obter token de acesso
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: Deno.env.get('GOOGLE_SERVICE_ACCOUNT_EMAIL')!,
        private_key: Deno.env.get('GOOGLE_PRIVATE_KEY')?.replace(/\\n/g, '\n')!,
      },
      scopes: ['https://www.googleapis.com/auth/devstorage.full_control'],
    });

    const authClient = await auth.getClient();
    const tokenResponse = await authClient.getAccessToken();
    const accessToken = tokenResponse.token;

    if (!accessToken) {
      throw new Error('Não foi possível obter token de acesso');
    }

    console.log('Token de acesso obtido com sucesso');

    // Determinar MIME type
    const mimeType = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' :
                     ext === 'png' ? 'image/png' :
                     ext === 'gif' ? 'image/gif' :
                     ext === 'webp' ? 'image/webp' : 'image/jpeg';

    // Fazer upload para Google Cloud Storage usando API REST
    // IMPORTANTE: Usar predefinedAcl=publicRead durante o upload para tornar público imediatamente
    const uploadUrl = `https://storage.googleapis.com/upload/storage/v1/b/${bucketName}/o?uploadType=media&name=${encodeURIComponent(objectPath)}&predefinedAcl=publicRead`;
    
    console.log('Fazendo upload para Google Cloud Storage...');
    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': mimeType,
        'Content-Length': binaryData.length.toString(),
      },
      body: binaryData,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('Erro no upload para Google Cloud Storage:', errorText);
      throw new Error(`Falha ao fazer upload: ${uploadResponse.status} ${uploadResponse.statusText} - ${errorText}`);
    }

    const fileData = await uploadResponse.json();

    if (!fileData.name) {
      throw new Error('Falha ao fazer upload para Google Cloud Storage: nome não retornado');
    }

    console.log('Arquivo criado no Google Cloud Storage:', fileData.name);

    // Tornar o arquivo público (CRÍTICO para visualização)
    // IMPORTANTE: O bucket precisa permitir objetos públicos
    try {
      console.log('Tornando arquivo público...');
      
      // Método mais confiável: Usar predefinedAcl durante o upload ou atualizar depois
      // Vamos atualizar o objeto para torná-lo público
      const updateUrl = `https://storage.googleapis.com/storage/v1/b/${bucketName}/o/${encodeURIComponent(objectPath)}`;
      
      // Tentar com predefinedAcl=publicRead
      const updateResponse = await fetch(`${updateUrl}?predefinedAcl=publicRead`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (updateResponse.ok) {
        console.log('Arquivo tornado público via predefinedAcl=publicRead');
      } else {
        const updateErrorText = await updateResponse.text();
        console.warn('Tentativa 1 (predefinedAcl) falhou:', updateErrorText);
        
        // Método alternativo: Adicionar ACL manualmente
        try {
          const aclUrl = `https://storage.googleapis.com/storage/v1/b/${bucketName}/o/${encodeURIComponent(objectPath)}/acl`;
          const aclResponse = await fetch(aclUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              entity: 'allUsers',
              role: 'READER',
            }),
          });

          if (aclResponse.ok) {
            console.log('ACL público adicionado com sucesso');
          } else {
            const aclErrorText = await aclResponse.text();
            console.error('Tentativa 2 (ACL) também falhou:', aclErrorText);
            throw new Error(`Não foi possível tornar o arquivo público. Verifique se o bucket permite objetos públicos. Erro: ${updateErrorText}`);
          }
        } catch (aclError) {
          console.error('Erro ao adicionar ACL:', aclError);
          throw aclError;
        }
      }
    } catch (permError: any) {
      console.error('ERRO CRÍTICO: Não foi possível tornar o arquivo público:', permError);
      console.error('O arquivo foi salvo mas NÃO está público.');
      console.error('SOLUÇÃO: Configure o bucket para permitir objetos públicos ou use URLs assinadas.');
      // Não lançar erro aqui, apenas avisar - o arquivo foi salvo
    }

    // Construir URLs públicas
    const publicUrl = `https://storage.googleapis.com/${bucketName}/${objectPath}`;
    const downloadUrl = `https://storage.googleapis.com/${bucketName}/${objectPath}?alt=media`;

    const result = {
      fileId: fileData.name,
      webViewLink: publicUrl,
      webContentLink: downloadUrl,
    };

    console.log('Upload para Google Cloud Storage concluído com sucesso:', result);
    return result;
  } catch (error: any) {
    console.error('Erro detalhado no upload para Google Cloud Storage:', error);
    console.error('Mensagem de erro:', error.message);
    console.error('Stack trace:', error.stack);
    throw new Error(`Falha ao fazer upload para Google Cloud Storage: ${error.message || String(error)}`);
  }
}

/**
 * Faz upload de arquivo para o Google Drive (DEPRECADO - mantido para compatibilidade)
 */
async function uploadToGoogleDrive(
  fileName: string,
  fileData: string, // Base64
  registroId?: string
): Promise<{ fileId: string; webViewLink: string; webContentLink: string }> {
  const driveFolderId = Deno.env.get('GOOGLE_DRIVE_FOLDER_ID');
  if (!driveFolderId) {
    throw new Error('GOOGLE_DRIVE_FOLDER_ID não configurado');
  }

  console.log('Iniciando upload para Google Drive...');
  console.log('Pasta base ID:', driveFolderId);
  console.log('Nome do arquivo:', fileName);
  console.log('Registro ID:', registroId || 'não fornecido');

  const drive = await getGoogleDriveClient();
  console.log('Cliente Google Drive autenticado com sucesso');

  // Decodificar base64
  let base64Data = fileData;
  if (fileData.includes(',')) {
    base64Data = fileData.split(',')[1];
  }
  base64Data = base64Data.replace(/\s/g, '').replace(/\r/g, '').replace(/\n/g, '');

  const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

  // Criar estrutura de pastas: Ano/Mês
  const now = new Date();
  const year = String(now.getFullYear());
  const month = String(now.getMonth() + 1).padStart(2, '0');

  // Obter ou criar pasta do ano
  console.log(`Buscando/criando pasta do ano: ${year}`);
  const yearFolderId = await getOrCreateFolder(drive, driveFolderId, year);
  console.log(`Pasta do ano criada/encontrada: ${yearFolderId}`);
  
  // Obter ou criar pasta do mês
  console.log(`Buscando/criando pasta do mês: ${month}`);
  const monthFolderId = await getOrCreateFolder(drive, yearFolderId, month);
  console.log(`Pasta do mês criada/encontrada: ${monthFolderId}`);

  // Determinar pasta final (com registroId se fornecido)
  let finalFolderId = monthFolderId;
  if (registroId) {
    const registroFolderName = `Registro_${registroId}`;
    console.log(`Buscando/criando pasta do registro: ${registroFolderName}`);
    finalFolderId = await getOrCreateFolder(drive, monthFolderId, registroFolderName);
    console.log(`Pasta do registro criada/encontrada: ${finalFolderId}`);
  }

  // Gerar nome único para o arquivo
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const ext = fileName.split('.').pop() || 'jpg';
  const uniqueFileName = `${timestamp}_${randomStr}.${ext}`;

  // Determinar MIME type
  const mimeType = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' :
                   ext === 'png' ? 'image/png' :
                   ext === 'gif' ? 'image/gif' :
                   ext === 'webp' ? 'image/webp' : 'image/jpeg';

  console.log('Fazendo upload para Google Drive:', uniqueFileName);
  console.log('Pasta destino:', finalFolderId);
  console.log('Tamanho do arquivo:', binaryData.length, 'bytes');

  try {
    // Obter token de acesso
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: Deno.env.get('GOOGLE_SERVICE_ACCOUNT_EMAIL')!,
        private_key: Deno.env.get('GOOGLE_PRIVATE_KEY')?.replace(/\\n/g, '\n')!,
      },
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });

    const authClient = await auth.getClient();
    const tokenResponse = await authClient.getAccessToken();
    const accessToken = tokenResponse.token;

    if (!accessToken) {
      throw new Error('Não foi possível obter token de acesso');
    }

    console.log('Token de acesso obtido com sucesso');

    // Usar API do Google Drive diretamente via fetch (compatível com Deno)
    // Primeiro, criar os metadados do arquivo
    const metadata = {
      name: uniqueFileName,
      parents: [finalFolderId],
    };

    // IMPORTANTE: Service Accounts não têm quota de armazenamento própria
    // A solução é garantir que o arquivo seja criado na pasta compartilhada
    // que já foi compartilhada com a Service Account (GOOGLE_DRIVE_FOLDER_ID)
    
    // Usar método de upload em duas etapas: primeiro criar metadados, depois upload do conteúdo
    // Isso é mais confiável para Service Accounts
    
    // ETAPA 1: Criar o arquivo vazio com metadados na pasta compartilhada
    console.log('Criando arquivo vazio na pasta compartilhada...');
    const createResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files?fields=id&supportsAllDrives=true`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: uniqueFileName,
          parents: [finalFolderId],
        }),
      }
    );

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error('Erro ao criar arquivo:', errorText);
      throw new Error(`Falha ao criar arquivo: ${createResponse.status} ${createResponse.statusText} - ${errorText}`);
    }

    const fileInfo = await createResponse.json();
    const fileId = fileInfo.id;

    if (!fileId) {
      throw new Error('Falha ao criar arquivo: ID não retornado');
    }

    console.log('Arquivo criado com ID:', fileId);

    // ETAPA 2: Fazer upload do conteúdo do arquivo
    console.log('Fazendo upload do conteúdo do arquivo...');
    const uploadResponse = await fetch(
      `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media&supportsAllDrives=true`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': mimeType,
          'Content-Length': binaryData.length.toString(),
        },
        body: binaryData,
      }
    );

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('Erro no upload do conteúdo:', errorText);
      // Tentar deletar o arquivo vazio criado
      try {
        await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?supportsAllDrives=true`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${accessToken}` },
        });
      } catch {}
      throw new Error(`Falha ao fazer upload do conteúdo: ${uploadResponse.status} ${uploadResponse.statusText} - ${errorText}`);
    }

    console.log('Conteúdo do arquivo enviado com sucesso');

    // ETAPA 3: Obter informações completas do arquivo (incluindo links)
    const getFileResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,webViewLink,webContentLink&supportsAllDrives=true`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!getFileResponse.ok) {
      const errorText = await getFileResponse.text();
      console.error('Erro ao obter informações do arquivo:', errorText);
      throw new Error(`Falha ao obter informações do arquivo: ${getFileResponse.status}`);
    }

    const fileData = await getFileResponse.json();

    if (!fileData.id) {
      throw new Error('Falha ao fazer upload para Google Drive: ID não retornado');
    }

    console.log('Arquivo criado no Google Drive com ID:', fileData.id);

    // Tornar o arquivo acessível publicamente (opcional)
    try {
      const permissionResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileData.id}/permissions`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            role: 'reader',
            type: 'anyone',
          }),
        }
      );

      if (permissionResponse.ok) {
        console.log('Permissão pública concedida ao arquivo');
      } else {
        console.warn('Aviso: Não foi possível tornar o arquivo público');
      }
    } catch (permError) {
      console.warn('Aviso: Não foi possível tornar o arquivo público:', permError);
      // Continuar mesmo se falhar
    }

    const result = {
      fileId: fileData.id,
      webViewLink: fileData.webViewLink || `https://drive.google.com/file/d/${fileData.id}/view`,
      webContentLink: fileData.webContentLink || `https://drive.google.com/uc?export=download&id=${fileData.id}`,
    };

    console.log('Upload para Google Drive concluído com sucesso:', result);
    return result;
  } catch (error: any) {
    console.error('Erro detalhado no upload para Google Drive:', error);
    console.error('Mensagem de erro:', error.message);
    console.error('Stack trace:', error.stack);
    throw new Error(`Falha ao fazer upload para Google Drive: ${error.message || String(error)}`);
  }
}

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

    // PRIORIDADE: Google Cloud Storage primeiro, Supabase Storage como fallback
    let googleCloudStorageResult = null;
    let storageResult = null;
    
    // Tentar Google Cloud Storage primeiro (prioridade)
    try {
      console.log('=== INICIANDO UPLOAD PARA GOOGLE CLOUD STORAGE (PRIORIDADE) ===');
      googleCloudStorageResult = await uploadToGoogleCloudStorage(fileName, fileData, registroId);
      console.log('=== UPLOAD PARA GOOGLE CLOUD STORAGE CONCLUÍDO COM SUCESSO ===');
      console.log('Google Cloud Storage File ID:', googleCloudStorageResult.fileId);
      console.log('Google Cloud Storage Web View Link:', googleCloudStorageResult.webViewLink);
    } catch (gcsError: any) {
      console.error('=== ERRO AO FAZER UPLOAD PARA GOOGLE CLOUD STORAGE ===');
      console.error('Mensagem:', gcsError?.message || String(gcsError));
      console.error('Stack:', gcsError?.stack);
      // Se falhar, tentar Supabase Storage como fallback
      console.log('Tentando Supabase Storage como fallback...');
    }

    // Se Google Cloud Storage falhou, usar Supabase Storage como fallback
    if (!googleCloudStorageResult) {
      try {
        console.log('Fazendo upload do arquivo para Supabase Storage (fallback)...');
        console.log('Nome do arquivo:', fileName);
        console.log('Tamanho do fileData:', fileData.length, 'caracteres');
        
        storageResult = await uploadToStorage(
          supabaseUrl,
          supabaseServiceKey,
          fileName,
          fileData,
          registroId
        );
        
        console.log('Upload para Supabase Storage concluído:', storageResult.fileId);
      } catch (storageError: any) {
        console.error('Erro ao fazer upload para Supabase Storage:', storageError);
        throw new Error(`Falha ao fazer upload: Google Cloud Storage e Supabase Storage falharam. ${storageError?.message || String(storageError)}`);
      }
    }

    // Retornar resultado (priorizar Google Cloud Storage)
    const finalResult = googleCloudStorageResult || storageResult!;
    const finalFileId = googleCloudStorageResult?.fileId || storageResult?.fileId || 'unknown';
    const finalPublicUrl = googleCloudStorageResult?.webViewLink || storageResult?.publicUrl || '';
    const finalWebContentLink = googleCloudStorageResult?.webContentLink || storageResult?.publicUrl || '';

    return new Response(
      JSON.stringify({
        success: true,
        fileId: finalFileId,
        publicUrl: finalPublicUrl,
        webViewLink: finalPublicUrl,
        webContentLink: finalWebContentLink,
        googleCloudStorageFileId: googleCloudStorageResult?.fileId || null,
        storageUsed: googleCloudStorageResult ? 'google-cloud-storage' : 'supabase-storage',
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
