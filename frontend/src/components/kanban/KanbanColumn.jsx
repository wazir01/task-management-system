import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import KanbanCard from './KanbanCard';

export default function KanbanColumn({ column, tasks, onTaskClick }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div
      className={`kanban-column ${isOver ? 'kanban-column-over' : ''}`}
      style={{ '--column-accent': column.color, '--column-bg': column.bg }}
    >
      <header className="kanban-column-header">
        <div className="kanban-column-title">
          <span className="kanban-column-dot" />
          <h3>{column.title}</h3>
        </div>
        <span className="kanban-column-count">{tasks.length}</span>
      </header>
      <div ref={setNodeRef} className="kanban-column-body">
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <KanbanCard key={task.id} task={task} onClick={onTaskClick} />
          ))}
        </SortableContext>
        {tasks.length === 0 && <p className="kanban-column-empty">Drop tasks here</p>}
      </div>
    </div>
  );
}
