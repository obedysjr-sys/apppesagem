'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, X, Upload, Loader2, Image as ImageIcon } from 'lucide-react';
import { compressImage, isValidImageFile, formatFileSize } from '@/lib/image-compression';
import { toast } from 'sonner';
import { Evidencia } from '@/types/evidencias';

interface UploadEvidenciasProps {
  registroId?: string;
  evidencias?: Evidencia[];
  onEvidenciasChange?: (evidencias: Evidencia[]) => void;
  maxFiles?: number;
  disabled?: boolean;
}

export function UploadEvidencias({
  registroId,
  evidencias = [],
  onEvidenciasChange,
  maxFiles = 40,
  disabled = false,
}: UploadEvidenciasProps) {
  const [uploading, setUploading] = useState(false);
  const [previewFiles, setPreviewFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (files.length === 0) return;

    // Validar quantidade máxima
    if (evidencias.length + files.length > maxFiles) {
      toast.error(`Máximo de ${maxFiles} imagens permitidas`);
      return;
    }

    // Validar tipos de arquivo
    const invalidFiles = files.filter(file => !isValidImageFile(file));
    if (invalidFiles.length > 0) {
      toast.error('Apenas imagens são permitidas (JPEG, PNG, WebP)');
      return;
    }

    // Mostrar preview antes de comprimir
    setPreviewFiles(prev => [...prev, ...files]);

    // Comprimir e fazer upload
    try {
      setUploading(true);
      const uploadPromises = files.map(async (file) => {
        try {
          // Comprimir imagem
          const compressedFile = await compressImage(file, {
            maxSizeMB: 0.5,
            maxWidthOrHeight: 1920,
          });

          // Converter para base64
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const result = reader.result as string;
              resolve(result);
            };
            reader.onerror = reject;
            reader.readAsDataURL(compressedFile);
          });

          // Fazer upload via Edge Function usando Supabase SDK
          const { supabase, hasSupabaseEnv } = await import('@/lib/supabase');

          if (!hasSupabaseEnv) {
            throw new Error('Configuração do Supabase não encontrada');
          }

          const { data: uploadResult, error: uploadError } = await supabase.functions.invoke(
            'upload-evidencias',
            {
              body: {
                fileName: compressedFile.name,
                fileData: base64,
                registroId,
              },
            }
          );

          console.log('Upload Response:', { uploadResult, uploadError });

          if (uploadError) {
            console.error('Upload Error Details:', uploadError);
            // Tentar obter mais detalhes do erro
            const errorMessage = uploadError.message || 
              (uploadError.context?.msg) || 
              `Erro ao fazer upload: ${JSON.stringify(uploadError)}`;
            throw new Error(errorMessage);
          }

          if (!uploadResult) {
            throw new Error('Resposta vazia da função');
          }

          if (!uploadResult.success) {
            console.error('Upload Result Error:', uploadResult);
            const errorMsg = uploadResult.error || 
              uploadResult.details || 
              uploadResult.message || 
              'Erro ao fazer upload';
            throw new Error(errorMsg);
          }

          const novaEvidencia: Evidencia = {
            id: uploadResult.fileId,
            fileName: compressedFile.name,
            fileId: uploadResult.fileId,
            webViewLink: uploadResult.webViewLink,
            webContentLink: uploadResult.webContentLink,
            fileSize: compressedFile.size,
            uploadedAt: new Date(),
          };

          return novaEvidencia;
        } catch (error) {
          console.error('Erro ao fazer upload:', error);
          toast.error(`Erro ao fazer upload de ${file.name}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
          return null;
        }
      });

      const novasEvidencias = (await Promise.all(uploadPromises)).filter(
        (e): e is Evidencia => e !== null
      );

      if (novasEvidencias.length > 0) {
        const todasEvidencias = [...evidencias, ...novasEvidencias];
        onEvidenciasChange?.(todasEvidencias);
        toast.success(`${novasEvidencias.length} imagem(ns) enviada(s) com sucesso!`);
      }

      // Limpar preview
      setPreviewFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Erro ao processar arquivos:', error);
      toast.error('Erro ao processar imagens');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = (index: number) => {
    const novasEvidencias = evidencias.filter((_, i) => i !== index);
    onEvidenciasChange?.(novasEvidencias);
    toast.success('Evidência removida');
  };

  const handleClick = () => {
    if (!disabled && !uploading) {
      fileInputRef.current?.click();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Anexar Evidências
        </CardTitle>
        <CardDescription>
          Adicione imagens da pesagem. As imagens serão comprimidas automaticamente e salvas no Google Drive.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled || uploading}
        />

        <Button
          type="button"
          onClick={handleClick}
          disabled={disabled || uploading || evidencias.length >= maxFiles}
          className="w-full"
          variant="outline"
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processando...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Selecionar Imagens ({evidencias.length}/{maxFiles})
            </>
          )}
        </Button>

        {/* Preview de arquivos sendo processados */}
        {previewFiles.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Processando...</p>
            {previewFiles.map((file, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <ImageIcon className="h-4 w-4" />
                <span className="flex-1 truncate">{file.name}</span>
                <span className="text-muted-foreground">{formatFileSize(file.size)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Lista de evidências enviadas */}
        {evidencias.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Evidências anexadas ({evidencias.length}):</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {evidencias.map((evidencia, index) => (
                <div
                  key={evidencia.id}
                  className="flex items-center gap-2 p-2 border rounded-lg bg-muted/50"
                >
                  <ImageIcon className="h-4 w-4 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{evidencia.fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(evidencia.fileSize)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => window.open(evidencia.webViewLink, '_blank')}
                      title="Visualizar no Google Drive"
                    >
                      <ImageIcon className="h-4 w-4" />
                    </Button>
                    {!disabled && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleRemove(index)}
                        title="Remover"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {evidencias.length === 0 && !uploading && previewFiles.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma evidência anexada ainda
          </p>
        )}
      </CardContent>
    </Card>
  );
}
