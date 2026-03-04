import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ChevronDown, ChevronRight, Paperclip } from 'lucide-react';
import { TaskAttachments } from './TaskAttachments';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Checkbox } from '../ui/checkbox';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';
import { useCategoriesStore } from '../../store/categories.store';
import { useListsStore } from '../../store/lists.store';
import { useTagsStore } from '../../store/tags.store';
import { useAuthStore } from '../../store/auth.store';
import { usersService, type UserSummary } from '../../services/users.service';
import type { Task, Attachment } from '@todo-list-pro/shared';

const emptyToUndefined = (val: unknown) => (val === '' ? undefined : val);

// Frontend-specific schema that handles empty strings from HTML inputs
const taskFormSchema = z.object({
  title: z.string().min(1, 'El título es obligatorio').max(500),
  description: z.preprocess(emptyToUndefined, z.string().max(5000).optional()),
  dueDate: z.preprocess(emptyToUndefined, z.string().optional()),
  categoryId: z.preprocess(emptyToUndefined, z.string().cuid().optional()),
  listId: z.preprocess(emptyToUndefined, z.string().cuid().optional()),
  priority: z
    .enum(['NONE', 'LOW', 'MEDIUM', 'HIGH', 'URGENT'])
    .default('NONE'),
  parentId: z.preprocess(emptyToUndefined, z.string().cuid().optional()),
  tagIds: z.array(z.string().cuid()).max(10).optional(),
  assigneeIds: z.array(z.string().cuid()).optional(),
});

type TaskFormData = z.infer<typeof taskFormSchema>;

const PRIORITIES = [
  { value: 'NONE', label: 'Ninguna', color: '#94a3b8' },
  { value: 'LOW', label: 'Baja', color: '#22c55e' },
  { value: 'MEDIUM', label: 'Media', color: '#f59e0b' },
  { value: 'HIGH', label: 'Alta', color: '#f97316' },
  { value: 'URGENT', label: 'Urgente', color: '#ef4444' },
];

interface TaskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null;
  defaultListId?: string;
  defaultDueDate?: string;
  onSubmit: (data: TaskFormData) => Promise<void>;
}

export function TaskForm({
  open,
  onOpenChange,
  task,
  defaultListId,
  defaultDueDate,
  onSubmit,
}: TaskFormProps) {
  const categories = useCategoriesStore((s) => s.categories);
  const lists = useListsStore((s) => s.lists);
  const tags = useTagsStore((s) => s.tags);
  const currentUser = useAuthStore((s) => s.user);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isRecurring, setIsRecurring] = useState(false);
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [recurrenceStartDate, setRecurrenceStartDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [showMore, setShowMore] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      priority: 'NONE',
      listId: defaultListId,
    },
  });

  const watchedListId = watch('listId');
  const selectedList = lists.find((l) => l.id === watchedListId);
  const isClientList = !!selectedList?.clientId;

  useEffect(() => {
    if (open) {
      usersService.getAll().then(setUsers).catch(() => {});
      setIsRecurring(false);
      setDayOfMonth(1);
      setRecurrenceStartDate(new Date().toISOString().slice(0, 10));
      if (task) {
        setShowMore(true);
        setAttachments(task.attachments ?? []);
        const assigneeIds = task.assignees?.map((a) => a.id) ?? [];
        const taskTagIds = task.tags?.map((t) => t.id) ?? [];
        reset({
          title: task.title,
          description: task.description || undefined,
          dueDate: task.dueDate
            ? new Date(task.dueDate).toISOString().slice(0, 16)
            : undefined,
          categoryId: task.categoryId || undefined,
          listId: task.listId || undefined,
          priority: task.priority,
          tagIds: taskTagIds,
          assigneeIds,
        });
        setSelectedAssignees(assigneeIds);
        setSelectedTags(taskTagIds);
      } else {
        setShowMore(false);
        setAttachments([]);
        const defaultAssignees = currentUser ? [currentUser.id] : [];
        reset({
          title: '',
          description: undefined,
          dueDate: defaultDueDate
            ? new Date(defaultDueDate).toISOString().slice(0, 16)
            : undefined,
          priority: 'NONE',
          listId: defaultListId,
          assigneeIds: defaultAssignees,
          tagIds: [],
        });
        setSelectedAssignees(defaultAssignees);
        setSelectedTags([]);
      }
    }
  }, [open, task, defaultListId, defaultDueDate, reset, currentUser]);

  const toggleAssignee = (userId: string) => {
    if (userId === currentUser?.id) return;
    const updated = selectedAssignees.includes(userId)
      ? selectedAssignees.filter((id) => id !== userId)
      : [...selectedAssignees, userId];
    setSelectedAssignees(updated);
    setValue('assigneeIds', updated);
  };

  const toggleTag = (tagId: string) => {
    const updated = selectedTags.includes(tagId)
      ? selectedTags.filter((id) => id !== tagId)
      : [...selectedTags, tagId];
    setSelectedTags(updated);
    setValue('tagIds', updated);
  };

  const getInitials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  const handleFormSubmit = async (data: TaskFormData) => {
    if (data.dueDate) {
      data.dueDate = new Date(data.dueDate).toISOString();
    }
    const submitData: any = { ...data };
    if (!task && isRecurring && isClientList) {
      submitData.isRecurring = true;
      submitData.recurrence = {
        frequency: 'MONTHLY',
        interval: 1,
        dayOfMonth,
        startDate: new Date(recurrenceStartDate).toISOString(),
      };
    }
    await onSubmit(submitData);
    onOpenChange(false);
  };

  // Count how many "extra" options are set to show indicator
  const extrasCount = [
    watch('description'),
    watch('dueDate'),
    watch('categoryId'),
    selectedTags.length > 0,
    selectedAssignees.filter((id) => id !== currentUser?.id).length > 0,
  ].filter(Boolean).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task ? 'Editar tarea' : 'Nueva tarea'}</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(handleFormSubmit)}
          className="space-y-3"
        >
          {/* Título */}
          <div className="space-y-1">
            <Input
              id="title"
              placeholder="¿Qué necesitas hacer?"
              autoFocus
              className="text-base"
              {...register('title')}
            />
            {errors.title && (
              <p className="text-xs text-destructive">
                {errors.title.message}
              </p>
            )}
          </div>

          {/* Lista + Prioridad — siempre visibles, compactos */}
          <div className="flex items-center gap-2">
            <select
              id="listId"
              className="h-8 flex-1 rounded-md border border-input bg-background px-2 text-sm"
              {...register('listId')}
            >
              <option value="">Sin lista</option>
              {lists
                .filter((l) => !['Inbox', 'Hoy', 'Próximos'].includes(l.name))
                .map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
            </select>

            <select
              id="priority"
              className="h-8 w-32 rounded-md border border-input bg-background px-2 text-sm"
              {...register('priority')}
            >
              {PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* Toggle "Más opciones" */}
          <button
            type="button"
            className={cn(
              'flex w-full items-center gap-1.5 rounded-md px-1 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors',
            )}
            onClick={() => setShowMore(!showMore)}
          >
            {showMore ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            <span>Más opciones</span>
            {!showMore && extrasCount > 0 && (
              <span className="ml-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-xs text-primary">
                {extrasCount}
              </span>
            )}
          </button>

          {/* Sección colapsable */}
          {showMore && (
            <div className="space-y-3 rounded-md border border-border/50 bg-muted/30 p-3">
              {/* Descripción */}
              <div className="space-y-1">
                <Label htmlFor="description" className="text-xs">Descripción</Label>
                <Textarea
                  id="description"
                  placeholder="Detalles adicionales..."
                  rows={2}
                  className="text-sm"
                  {...register('description')}
                />
              </div>

              {/* Fecha límite + Categoría */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="dueDate" className="text-xs">Fecha límite</Label>
                  <Input
                    id="dueDate"
                    type="datetime-local"
                    className="h-8 text-sm"
                    {...register('dueDate')}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="categoryId" className="text-xs">Categoría</Label>
                  <select
                    id="categoryId"
                    className="h-8 w-full rounded-md border border-input bg-background px-2 text-sm"
                    {...register('categoryId')}
                  >
                    <option value="">Sin categoría</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Recurrencia (solo al crear, solo en listas de cliente) */}
              {!task && isClientList && (
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={isRecurring}
                      onChange={() => setIsRecurring(!isRecurring)}
                    />
                    <span className="text-xs font-medium">Tarea recurrente (mensual)</span>
                  </label>
                  {isRecurring && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="dayOfMonth" className="text-xs">Día del mes</Label>
                        <Input
                          id="dayOfMonth"
                          type="number"
                          min={1}
                          max={28}
                          className="h-8 text-sm"
                          value={dayOfMonth}
                          onChange={(e) => setDayOfMonth(parseInt(e.target.value) || 1)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="recurrenceStart" className="text-xs">Fecha inicio</Label>
                        <Input
                          id="recurrenceStart"
                          type="date"
                          className="h-8 text-sm"
                          value={recurrenceStartDate}
                          onChange={(e) => setRecurrenceStartDate(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Etiquetas */}
              {tags.length > 0 && (
                <div className="space-y-1">
                  <Label className="text-xs">Etiquetas</Label>
                  <div className="flex flex-wrap gap-1">
                    {tags.map((tag) => (
                      <Badge
                        key={tag.id}
                        variant={selectedTags.includes(tag.id) ? 'default' : 'outline'}
                        className="cursor-pointer text-xs py-0 transition-colors"
                        style={
                          selectedTags.includes(tag.id)
                            ? { backgroundColor: tag.color, borderColor: tag.color, color: '#fff' }
                            : { borderColor: tag.color, color: tag.color }
                        }
                        onClick={() => toggleTag(tag.id)}
                      >
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Asignados */}
              {users.length > 0 && (
                <div className="space-y-1">
                  <Label className="text-xs">Asignados</Label>
                  <div className="max-h-28 overflow-y-auto space-y-0.5 rounded-md border bg-background p-1.5">
                    {users.map((u) => (
                      <label
                        key={u.id}
                        className="flex items-center gap-2 rounded px-1.5 py-1 hover:bg-accent/50 cursor-pointer"
                      >
                        <Checkbox
                          checked={selectedAssignees.includes(u.id)}
                          onChange={() => toggleAssignee(u.id)}
                          disabled={u.id === currentUser?.id}
                        />
                        <Avatar className="h-5 w-5">
                          <AvatarFallback className="text-[10px]">
                            {getInitials(u.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs">{u.name}</span>
                        {u.id === currentUser?.id && (
                          <span className="text-[10px] text-muted-foreground ml-auto">(tú)</span>
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Adjuntos — solo en modo edición */}
          {task?.id && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-sm font-medium">
                <Paperclip className="h-4 w-4" />
                Adjuntos {attachments.length > 0 && <span className="text-xs text-muted-foreground">({attachments.length})</span>}
              </div>
              <TaskAttachments
                taskId={task.id}
                attachments={attachments}
                currentUserId={currentUser?.id ?? ''}
                isAdmin={currentUser?.role === 'ADMIN'}
                onAttachmentsChange={setAttachments}
              />
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting
                ? 'Guardando...'
                : task
                  ? 'Guardar cambios'
                  : 'Crear tarea'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
