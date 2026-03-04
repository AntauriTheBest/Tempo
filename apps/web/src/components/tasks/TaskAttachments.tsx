import { useCallback, useRef, useState } from 'react';
import { FileText, Image, Archive, File, Upload, Trash2, Loader2 } from 'lucide-react';
import type { Attachment } from '@todo-list-pro/shared';
import { tasksService } from '../../services/tasks.service';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001';

function getFileIcon(mimetype: string) {
  if (mimetype.startsWith('image/')) return Image;
  if (mimetype === 'application/pdf') return FileText;
  if (mimetype.includes('zip') || mimetype.includes('compressed')) return Archive;
  return File;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImage(mimetype: string): boolean {
  return mimetype.startsWith('image/');
}

interface TaskAttachmentsProps {
  taskId: string;
  attachments: Attachment[];
  currentUserId: string;
  isAdmin?: boolean;
  onAttachmentsChange: (attachments: Attachment[]) => void;
}

export function TaskAttachments({
  taskId,
  attachments,
  currentUserId,
  isAdmin = false,
  onAttachmentsChange,
}: TaskAttachmentsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleUpload = useCallback(async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      const uploaded: Attachment[] = [];
      for (const file of Array.from(files)) {
        const attachment = await tasksService.uploadAttachment(taskId, file);
        uploaded.push(attachment);
      }
      onAttachmentsChange([...attachments, ...uploaded]);
      toast.success(`${uploaded.length} archivo(s) adjuntado(s)`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al subir archivo');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [taskId, attachments, onAttachmentsChange]);

  const handleDelete = useCallback(async (attachmentId: string) => {
    setDeletingId(attachmentId);
    try {
      await tasksService.deleteAttachment(taskId, attachmentId);
      onAttachmentsChange(attachments.filter((a) => a.id !== attachmentId));
      toast.success('Adjunto eliminado');
    } catch {
      toast.error('Error al eliminar adjunto');
    } finally {
      setDeletingId(null);
    }
  }, [taskId, attachments, onAttachmentsChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleUpload(e.dataTransfer.files);
  }, [handleUpload]);

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          'border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors',
          dragging
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/30'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleUpload(e.target.files)}
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
        />
        {uploading ? (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Subiendo...
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Upload className="h-4 w-4" />
            <span>Arrastra archivos aquí o <span className="text-primary">haz click para seleccionar</span></span>
          </div>
        )}
      </div>

      {/* Attachment list */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          {attachments.map((attachment) => {
            const Icon = getFileIcon(attachment.mimetype);
            const canDelete = isAdmin || attachment.userId === currentUserId;
            const fileUrl = attachment.url.startsWith('http')
              ? attachment.url
              : `${API_BASE}${attachment.url}`;

            return (
              <div
                key={attachment.id}
                className="flex items-center gap-3 p-2 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors group"
              >
                {/* Preview or icon */}
                {isImage(attachment.mimetype) ? (
                  <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="shrink-0">
                    <img
                      src={fileUrl}
                      alt={attachment.originalName}
                      className="h-10 w-10 rounded object-cover border"
                    />
                  </a>
                ) : (
                  <div className="shrink-0 h-10 w-10 rounded border bg-background flex items-center justify-center">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium truncate hover:text-primary block"
                  >
                    {attachment.originalName}
                  </a>
                  <p className="text-xs text-muted-foreground">{formatSize(attachment.size)}</p>
                </div>

                {/* Delete */}
                {canDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(attachment.id)}
                    disabled={deletingId === attachment.id}
                  >
                    {deletingId === attachment.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Trash2 className="h-3 w-3" />
                    )}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
