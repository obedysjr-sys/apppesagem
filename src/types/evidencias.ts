export interface Evidencia {
  id: string;
  fileName: string;
  fileId?: string; // Opcional até ser feito o upload
  webViewLink?: string; // Opcional até ser feito o upload
  webContentLink?: string; // Opcional até ser feito o upload
  fileSize: number;
  uploadedAt?: Date; // Opcional até ser feito o upload
  // Campos temporários para upload pendente
  fileData?: string; // Base64 do arquivo
  file?: File; // Arquivo original
}

export interface EvidenciaDB {
  id: string;
  registro_id: string;
  file_id: string;
  file_name: string;
  web_view_link: string;
  web_content_link: string;
  file_size: number;
  uploaded_at: string;
}
