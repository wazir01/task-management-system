import { STATUS_LABELS } from './kanban/constants';

const CLASS_MAP = {
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  REVIEW: 'review',
  COMPLETED: 'done',
};

export default function StatusBadge({ status }) {
  const key = CLASS_MAP[status] || status.toLowerCase();
  return (
    <span className={`badge badge-${key}`}>{STATUS_LABELS[status] || status}</span>
  );
}
