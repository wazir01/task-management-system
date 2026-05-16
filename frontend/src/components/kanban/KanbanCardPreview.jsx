import UserAvatar from './UserAvatar';
import { PRIORITY_STYLES, STATUS_LABELS } from './constants';

export default function KanbanCardPreview({ task }) {
  const priority = PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.MEDIUM;

  return (
    <article className="kanban-card kanban-card-overlay-inner">
      <div className="kanban-card-top">
        <span className={`priority-badge ${priority.className}`}>{priority.label}</span>
        <span className="kanban-status-pill">{STATUS_LABELS[task.status]}</span>
      </div>
      <h4 className="kanban-card-title">{task.title}</h4>
      {task.description && <p className="kanban-card-desc">{task.description}</p>}
      <div className="kanban-card-footer">
        <UserAvatar user={task.assignee} />
      </div>
    </article>
  );
}
