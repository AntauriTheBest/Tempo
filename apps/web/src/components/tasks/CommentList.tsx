import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Trash2, Send } from 'lucide-react';
import { commentsService } from '../../services/comments.service';
import { useAuthStore } from '../../store/auth.store';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { toast } from 'sonner';
import type { Comment } from '@todo-list-pro/shared';

interface CommentListProps {
  taskId: string;
}

export function CommentList({ taskId }: CommentListProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    loadComments();
  }, [taskId]);

  const loadComments = async () => {
    try {
      const data = await commentsService.getByTask(taskId);
      setComments(data);
    } catch {
      toast.error('Error al cargar comentarios');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const comment = await commentsService.create(taskId, {
        content: newComment.trim(),
      });
      setComments([...comments, comment]);
      setNewComment('');
      toast.success('Comentario agregado');
    } catch {
      toast.error('Error al agregar comentario');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await commentsService.remove(commentId);
      setComments(comments.filter((c) => c.id !== commentId));
      toast.success('Comentario eliminado');
    } catch {
      toast.error('Error al eliminar comentario');
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-4">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase">
        Comentarios ({comments.length})
      </h4>

      {/* Comment List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {comments.map((comment) => (
          <div
            key={comment.id}
            className="flex gap-3 p-3 rounded-lg bg-muted/30"
          >
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarFallback className="text-xs">
                {getInitials(comment.user.name)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-sm font-medium">
                  {comment.user.name}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(comment.createdAt), 'PPp', { locale: es })}
                  </span>
                  {user?.id === comment.userId && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(comment.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {comment.content}
              </p>
            </div>
          </div>
        ))}

        {comments.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No hay comentarios aún
          </p>
        )}
      </div>

      {/* Add Comment Form */}
      <form onSubmit={handleSubmit} className="space-y-2">
        <Textarea
          placeholder="Escribe un comentario..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="min-h-[80px] resize-none"
          disabled={isSubmitting}
        />
        <div className="flex justify-end">
          <Button
            type="submit"
            size="sm"
            disabled={!newComment.trim() || isSubmitting}
          >
            <Send className="mr-1 h-3 w-3" />
            {isSubmitting ? 'Enviando...' : 'Comentar'}
          </Button>
        </div>
      </form>
    </div>
  );
}
