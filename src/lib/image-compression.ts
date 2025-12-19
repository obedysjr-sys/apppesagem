import imageCompression from 'browser-image-compression';

export interface CompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
  fileType?: string;
}

/**
 * Comprime uma imagem mantendo qualidade visual máxima
 * Reduz drasticamente o tamanho do arquivo sem perder qualidade perceptível
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const {
    maxSizeMB = 0.3, // Reduzido para 300KB (melhor compressão)
    maxWidthOrHeight = 1600, // Reduzido para 1600px (mantém qualidade visual)
    useWebWorker = true,
    fileType = 'image/jpeg'
  } = options;

  try {
    // Opções de compressão otimizadas para melhor compressão sem perder qualidade perceptível
    const compressionOptions = {
      maxSizeMB,
      maxWidthOrHeight,
      useWebWorker,
      fileType,
      initialQuality: 0.88, // Qualidade otimizada (88% mantém boa qualidade visual)
      alwaysKeepResolution: false, // Permite redimensionar se necessário
      exifOrientation: 1, // Remove EXIF para reduzir tamanho
    };

    let compressedFile = await imageCompression(file, compressionOptions);
    
    // Se ainda estiver muito grande, comprime mais agressivamente em etapas
    if (compressedFile.size > maxSizeMB * 1024 * 1024) {
      // Tentativa 1: Reduzir qualidade para 80%
      compressedFile = await imageCompression(file, {
        ...compressionOptions,
        initialQuality: 0.80,
        maxSizeMB: maxSizeMB * 0.9,
      });
      
      // Tentativa 2: Se ainda estiver grande, reduzir mais
      if (compressedFile.size > maxSizeMB * 1024 * 1024) {
        compressedFile = await imageCompression(file, {
          ...compressionOptions,
          initialQuality: 0.75,
          maxSizeMB: maxSizeMB * 0.7,
          maxWidthOrHeight: 1400, // Reduzir resolução se necessário
        });
      }
    }

    return compressedFile;
  } catch (error) {
    console.error('Erro ao comprimir imagem:', error);
    // Se falhar, retorna o arquivo original
    return file;
  }
}

/**
 * Comprime múltiplas imagens em paralelo
 */
export async function compressImages(
  files: File[],
  options: CompressionOptions = {}
): Promise<File[]> {
  const compressionPromises = files.map(file => compressImage(file, options));
  return Promise.all(compressionPromises);
}

/**
 * Valida se o arquivo é uma imagem válida
 */
export function isValidImageFile(file: File): boolean {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  return validTypes.includes(file.type);
}

/**
 * Obtém o tamanho formatado do arquivo
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
