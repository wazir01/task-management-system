import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import UserAvatar from './UserAvatar';
import { PRIORITY_STYLES, STATUS_LABELS } from './constants';

function formatDue(d) {
  if (!d) return null;
  return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function KanbanCard({ task, onClick }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'task', task },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.85 : 1,
  };

  const priority = PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.MEDIUM;
  const overdue =
    task.dueDate && task.status !== 'DONE' && new Date(task.dueDate) < new Date();

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={`kanban-card ${isDragging ? 'kanban-card-dragging' : ''}`}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        if (!isDragging) onClick?.(task);
      }}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.(task)}
      role="button"
      tabIndex={0}
    >
      <div className="kanban-card-top">
        <span className={`priority-badge ${priority.className}`}>{priority.label}</span>
        <span className="kanban-status-pill">{STATUS_LABELS[task.status]}</span>
      </div>
      <h4 className="kanban-card-title">{task.title}</h4>
      <p className="kanban-card-desc">{task.description || ''}</p>
      <div className="kanban-card-footer">
        {task.dueDate && (
          <span className={`kanban-due ${overdue ? 'overdue' : ''}`}>{formatDue(task.dueDate)}</span>
        )}
        <UserAvatar user={task.assignee} />
      </div>
    </article>
  );
}
