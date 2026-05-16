export const COLUMNS = [
  { id: 'TODO', title: 'To Do', color: '#6b7280', bg: 'rgba(107, 114, 128, 0.12)' },
  { id: 'IN_PROGRESS', title: 'In Progress', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.12)' },
  { id: 'REVIEW', title: 'Review', color: '#eab308', bg: 'rgba(234, 179, 8, 0.12)' },
  { id: 'COMPLETED', title: 'Completed', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.12)' },
];

export const PRIORITY_STYLES = {
  LOW: { label: 'Low', className: 'priority-low' },
  MEDIUM: { label: 'Medium', className: 'priority-medium' },
  HIGH: { label: 'High', className: 'priority-high' },
};

export const STATUS_LABELS = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  REVIEW: 'Review',
  COMPLETED: 'Completed',
};
