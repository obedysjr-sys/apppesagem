'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Download, X, ZoomIn, ZoomOut, Paperclip, Package } from 'lucide-react';
import { toast } from 'sonner';
import JSZip from 'jszip';

interface Evidencia {
  id?: string;
  fileName?: string;
  file_name?: string;
  webViewLink?: string;
  web_view_link?: string;
  webContentLink?: string;
  web_content_link?: string;
  publicUrl?: string;
  fileSize?: number;
  file_size?: number;
}

interface VisualizarEvidenciasModalProps {
  evidencias: Evidencia[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VisualizarEvidenciasModal({
  evidencias,
  open,
  onOpenChange,
}: VisualizarEvidenciasModalProps) {
  const [imagemAmpliada, setImagemAmpliada] = useState<string | null>(null);
  const [imageZoom, setImageZoom] = useState<{ [key: string]: boolean }>({});

  const handleToggleZoom = (imageUrl: string) => {
    setImageZoom(prev => ({
      ...prev,
      [imageUrl]: !prev[imageUrl]
    }));
  };

  const handleDownload = async (evidencia: Evidencia) => {
    try {
      const url = evidencia.webContentLink || evidencia.web_content_link || evidencia.publicUrl;
      const fileName = evidencia.fileName || evidencia.file_name || 'evidencia.jpg';
      
      if (!url) {
        toast.error('URL da imagem não encontrada');
        return;
      }

      // Criar link temporário para download
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Download iniciado!');
    } catch (error) {
      console.error('Erro ao fazer download:', error);
      toast.error('Erro ao fazer download da imagem');
    }
  };

  const handleDownloadAll = async () => {
    try {
      toast.info('Preparando download...', { description: 'Compactando imagens em ZIP' });
      
      const zip = new JSZip();
      const folder = zip.folder('evidencias');
      
      if (!folder) {
        toast.error('Erro ao criar pasta ZIP');
        return;
      }
      
      // Baixar e adicionar cada imagem ao ZIP
      for (let i = 0; i < evidencias.length; i++) {
        const evidencia = evidencias[i];
        const url = evidencia.webContentLink || evidencia.web_content_link || evidencia.publicUrl;
        const fileName = evidencia.fileName || evidencia.file_name || `evidencia_${i + 1}.jpg`;
        
        if (!url) continue;
        
        try {
          // Buscar a imagem
          const response = await fetch(url);
          const blob = await response.blob();
          
          // Adicionar ao ZIP
          folder.file(fileName, blob);
          
          toast.info(`Adicionando ${i + 1}/${evidencias.length}...`, { 
            description: fileName,
            id: 'download-progress'
          });
        } catch (error) {
          console.error(`Erro ao baixar ${fileName}:`, error);
        }
      }
      
      // Gerar e baixar o ZIP
      toast.info('Gerando arquivo ZIP...', { id: 'download-progress' });
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      
      // Download do ZIP
      const link = document.createElement('a');
      link.href = URL.createObjectURL(zipBlob);
      link.download = `evidencias_${new Date().getTime()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      
      toast.success('Download concluído!', { 
        description: `${evidencias.length} imagem(ns) baixada(s) em ZIP`,
        id: 'download-progress'
      });
      
    } catch (error) {
      console.error('Erro ao criar ZIP:', error);
      toast.error('Erro ao criar arquivo ZIP', {
        description: 'Tente baixar as imagens individualmente'
      });
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(2)} KB`;
    return `${(kb / 1024).toFixed(2)} MB`;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Paperclip className="h-5 w-5" />
              Evidências ({evidencias.length})
            </DialogTitle>
            <DialogDescription>
              Visualize, amplie e baixe as imagens anexadas a este registro
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-between items-center py-2 border-b">
            <p className="text-sm text-muted-foreground">
              Clique em uma imagem para ampliar/reduzir
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadAll}
              className="gap-2"
              disabled={evidencias.length === 0}
            >
              <Package className="h-4 w-4" />
              Baixar Todas (.ZIP)
            </Button>
          </div>

          <ScrollArea className="h-[60vh] pr-4">
            <div className="space-y-4">
              {evidencias.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma evidência encontrada
                </div>
              ) : (
                evidencias.map((evidencia, index) => {
                  const imageUrl = evidencia.webContentLink || evidencia.web_content_link || evidencia.publicUrl || '';
                  const fileName = evidencia.fileName || evidencia.file_name || `Evidência ${index + 1}`;
                  const isZoomed = imageZoom[imageUrl];

                  return (
                    <div
                      key={evidencia.id || index}
                      className="border rounded-lg overflow-hidden bg-card"
                    >
                      <div className="p-3 bg-muted flex justify-between items-center">
                        <div>
                          <p className="font-medium text-sm">{fileName}</p>
                          <p className="text-xs text-muted-foreground">
                            Tamanho: {formatFileSize(evidencia.fileSize || evidencia.file_size)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(evidencia)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>

                      <div 
                        className={`relative cursor-pointer transition-all ${
                          isZoomed ? 'bg-black' : 'bg-muted/50'
                        }`}
                        onClick={() => handleToggleZoom(imageUrl)}
                      >
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={fileName}
                            className={`w-full transition-all duration-300 ${
                              isZoomed 
                                ? 'max-w-full max-h-[80vh] object-contain mx-auto' 
                                : 'max-h-64 object-cover'
                            }`}
                            loading="lazy"
                            onError={(e) => {
                              console.error('Erro ao carregar imagem:', imageUrl);
                              e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect fill="%23ddd" width="400" height="300"/><text x="50%" y="50%" text-anchor="middle" fill="%23999">Erro ao carregar imagem</text></svg>';
                            }}
                          />
                        ) : (
                          <div className="w-full h-64 flex items-center justify-center bg-muted text-muted-foreground">
                            URL da imagem não disponível
                          </div>
                        )}
                        
                        {/* Indicador de zoom */}
                        {imageUrl && (
                          <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                            {isZoomed ? (
                              <>
                                <ZoomOut className="h-3 w-3" />
                                Reduzir
                              </>
                            ) : (
                              <>
                                <ZoomIn className="h-3 w-3" />
                                Ampliar
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Modal de imagem ampliada em tela cheia */}
      {imagemAmpliada && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={() => setImagemAmpliada(null)}
        >
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white hover:bg-white/20"
            onClick={() => setImagemAmpliada(null)}
          >
            <X className="h-6 w-6" />
          </Button>
          <img
            src={imagemAmpliada}
            alt="Imagem ampliada"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
