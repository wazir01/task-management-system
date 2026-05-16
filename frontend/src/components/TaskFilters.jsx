import { COLUMNS } from './kanban/constants';

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'];

export default function TaskFilters({ filters, onChange, members }) {
  const set = (key, value) => onChange({ ...filters, [key]: value });

  return (
    <div className="task-filters card">
      <div className="filter-row">
        <div className="form-group filter-search">
          <label htmlFor="search">Search</label>
          <input
            id="search"
            type="search"
            placeholder="Search title or description…"
            value={filters.q}
            onChange={(e) => set('q', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="status">Status</label>
          <select
            id="status"
            value={filters.status}
            onChange={(e) => set('status', e.target.value)}
          >
            <option value="">All statuses</option>
            {COLUMNS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="priority">Priority</label>
          <select
            id="priority"
            value={filters.priority}
            onChange={(e) => set('priority', e.target.value)}
          >
            <option value="">All priorities</option>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p.charAt(0) + p.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="assignee">Assignee</label>
          <select
            id="assignee"
            value={filters.assigneeId}
            onChange={(e) => set('assigneeId', e.target.value)}
          >
            <option value="">Anyone</option>
            <option value="unassigned">Unassigned</option>
            {members.map((m) => (
              <option key={m.userId} value={m.userId}>
                {m.user.name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          className="btn btn-ghost btn-sm filter-clear"
          onClick={() =>
            onChange({ q: '', status: '', priority: '', assigneeId: '' })
          }
        >
          Clear
        </button>
      </div>
    </div>
  );
}
