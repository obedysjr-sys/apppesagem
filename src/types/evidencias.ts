export interface Evidencia {
  id: string;
  fileName: string;
  fileId: string;
  webViewLink: string;
  webContentLink: string;
  fileSize: number;
  uploadedAt: Date;
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
