import { useEffect, useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { tasksApi } from '../../api';
import { COLUMNS } from './constants';
import KanbanColumn from './KanbanColumn';
import KanbanCardPreview from './KanbanCardPreview';

export default function KanbanBoard({ tasks, onTasksChange, onTaskClick, onError }) {
  const [activeTask, setActiveTask] = useState(null);
  const [localTasks, setLocalTasks] = useState(tasks);

  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const tasksByColumn = useMemo(() => {
    const map = Object.fromEntries(COLUMNS.map((c) => [c.id, []]));
    localTasks.forEach((t) => {
      if (map[t.status]) map[t.status].push(t);
    });
    return map;
  }, [localTasks]);

  const findColumn = (taskId) => localTasks.find((t) => t.id === taskId)?.status;

  const handleDragStart = (event) => {
    setActiveTask(localTasks.find((t) => t.id === event.active.id));
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const activeColumn = findColumn(activeId);
    let overColumn = COLUMNS.find((c) => c.id === over.id)?.id;
    if (!overColumn) overColumn = findColumn(over.id);

    if (!activeColumn || !overColumn || activeColumn === overColumn) return;

    setLocalTasks((prev) =>
      prev.map((t) => (t.id === activeId ? { ...t, status: overColumn } : t))
    );
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) {
      setLocalTasks(tasks);
      return;
    }

    const activeId = active.id;
    let overColumn = COLUMNS.find((c) => c.id === over.id)?.id;
    if (!overColumn) overColumn = findColumn(over.id);

    const task = localTasks.find((t) => t.id === activeId);
    const original = tasks.find((t) => t.id === activeId);
    if (!task || !overColumn) return;

    if (original?.status === overColumn) {
      onTasksChange(localTasks);
      return;
    }

    try {
      const { task: updated } = await tasksApi.updateStatus(activeId, overColumn);
      const next = localTasks.map((t) => (t.id === activeId ? updated : t));
      setLocalTasks(next);
      onTasksChange(next);
    } catch (err) {
      setLocalTasks(tasks);
      onError?.(err.message);
    }
  };

  const handleDragCancel = () => {
    setActiveTask(null);
    setLocalTasks(tasks);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="kanban-board">
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col.id}
            column={col}
            tasks={tasksByColumn[col.id]}
            onTaskClick={onTaskClick}
          />
        ))}
      </div>
      <DragOverlay dropAnimation={{ duration: 220, easing: 'cubic-bezier(0.2, 0, 0, 1)' }}>
        {activeTask ? <KanbanCardPreview task={activeTask} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
