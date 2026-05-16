import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi } from '../api';
import StatusBadge from '../components/StatusBadge';
import WeeklyPieChart from '../components/WeeklyPieChart';
import AppBrand from '../components/AppBrand';
import ThemeSelector from '../components/ThemeSelector';
import { STATUS_LABELS } from '../components/kanban/constants';

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function matchesTaskSearch(task, q) {
  if (!q) return true;
  const term = q.toLowerCase();
  return (
    task.title.toLowerCase().includes(term) ||
    (task.project?.name || '').toLowerCase().includes(term)
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [taskSearch, setTaskSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    dashboardApi
      .get()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filteredMyTasks = useMemo(() => {
    if (!data?.myTasks) return [];
    return data.myTasks.filter((task) => {
      if (statusFilter && task.status !== statusFilter) return false;
      return matchesTaskSearch(task, taskSearch.trim());
    });
  }, [data, taskSearch, statusFilter]);

  const filteredTeamTasks = useMemo(() => {
    if (!data?.teamTasks) return [];
    return data.teamTasks.filter((task) => {
      if (statusFilter && task.status !== statusFilter) return false;
      return matchesTaskSearch(task, taskSearch.trim());
    });
  }, [data, taskSearch, statusFilter]);

  const filteredOverdue = useMemo(() => {
    if (!data?.overdueTasks) return [];
    return data.overdueTasks.filter((task) => matchesTaskSearch(task, taskSearch.trim()));
  }, [data, taskSearch]);

  if (loading) return <p className="page-loading">Loading dashboard…</p>;
  if (error) return <div className="error-banner">{error}</div>;
  if (!data) return null;

  const { summary, recentProjects } = data;

  return (
    <>
      <header className="dashboard-hero">
        <div className="dashboard-hero-top">
          <AppBrand />
          <ThemeSelector />
        </div>
        <p className="dashboard-page-label">Dashboard</p>
        <p className="dashboard-page-desc">Overview of your projects, tasks, and deadlines</p>
      </header>

      <section className="card-grid">
        <article className="card stat-card">
          <h3>Total tasks</h3>
          <p className="value">{summary.totalTasks}</p>
        </article>
        <article className="card stat-card">
          <h3>Completed</h3>
          <p className="value">{summary.completedTasks}</p>
        </article>
        <article className="card stat-card">
          <h3>Active tasks</h3>
          <p className="value">{summary.myActiveTasks}</p>
        </article>
        <article className="card stat-card overdue">
          <h3>Overdue</h3>
          <p className="value">{summary.overdueCount}</p>
        </article>
        <article className="card stat-card">
          <h3>Projects</h3>
          <p className="value">{summary.projectCount}</p>
        </article>
        <article className="card stat-card">
          <h3>In progress</h3>
          <p className="value">{summary.byStatus.IN_PROGRESS}</p>
        </article>
      </section>

      <section className="card weekly-chart-card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.1rem', margin: '0 0 0.25rem' }}>This week</h2>
        <p className="task-meta" style={{ marginBottom: '1rem' }}>
          Tasks created in your projects ({data.weeklyChart?.weekLabel})
        </p>
        <WeeklyPieChart
          byStatus={data.weeklyChart?.byStatus ?? { TODO: 0, IN_PROGRESS: 0, DONE: 0 }}
          total={data.weeklyChart?.total ?? 0}
          weekLabel={null}
        />
      </section>

      <section className="card task-filters" style={{ marginBottom: '1.5rem' }}>
        <div className="filter-row">
          <div className="form-group filter-search">
            <label htmlFor="dashboard-search">Search tasks</label>
            <input
              id="dashboard-search"
              type="search"
              placeholder="Search by title or project…"
              value={taskSearch}
              onChange={(e) => setTaskSearch(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="dashboard-status">Status</label>
            <select
              id="dashboard-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All statuses</option>
              {Object.entries(STATUS_LABELS).map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {filteredOverdue.length > 0 && (
        <section style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Overdue tasks</h2>
          <div className="task-list">
            {filteredOverdue.map((task) => (
              <Link key={task.id} to={`/projects/${task.project.id}`} className="task-item overdue">
                <div>
                  <h4>{task.title}</h4>
                  <p className="task-meta">
                    {task.project.name} · Due {formatDate(task.dueDate)}
                  </p>
                </div>
                <span className="badge badge-overdue">Overdue</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.1rem', margin: '0 0 1rem' }}>My active tasks</h2>
        {filteredMyTasks.length === 0 ? (
          <p className="empty-state">
            {taskSearch || statusFilter ? 'No tasks match your filters' : 'No active tasks assigned to you'}
          </p>
        ) : (
          <div className="task-list">
            {filteredMyTasks.map((task) => (
              <Link key={task.id} to={`/projects/${task.project.id}`} className="task-item">
                <div>
                  <h4>{task.title}</h4>
                  <p className="task-meta">
                    {task.project.name}
                    {task.dueDate && ` · Due ${formatDate(task.dueDate)}`}
                  </p>
                </div>
                <StatusBadge status={task.status} />
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.1rem', margin: '0 0 1rem' }}>All active project tasks</h2>
        {filteredTeamTasks.length === 0 ? (
          <p className="empty-state">
            {taskSearch || statusFilter
              ? 'No tasks match your filters'
              : summary.projectCount === 0
                ? (
                    <>
                      No projects yet.{' '}
                      <Link to="/projects">Create a project</Link> or run{' '}
                      <code>npm run db:seed</code> for demo data.
                    </>
                  )
                : 'No open tasks in your projects.'}
          </p>
        ) : (
          <div className="task-list">
            {filteredTeamTasks.map((task) => (
              <Link key={task.id} to={`/projects/${task.project.id}`} className="task-item">
                <div>
                  <h4>{task.title}</h4>
                  <p className="task-meta">
                    {task.project.name}
                    {task.assignee && ` · ${task.assignee.name}`}
                    {task.dueDate && ` · Due ${formatDate(task.dueDate)}`}
                  </p>
                </div>
                <StatusBadge status={task.status} />
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="card">
        <h2 style={{ fontSize: '1.1rem', margin: '0 0 1rem' }}>Recent projects</h2>
        {recentProjects.length === 0 ? (
          <p className="empty-state">
            No projects yet. <Link to="/projects">Create your first project</Link>
          </p>
        ) : (
          <div className="project-grid">
            {recentProjects.map((p) => (
              <Link key={p.id} to={`/projects/${p.id}`} className="card project-card">
                <h3>{p.name}</h3>
                <p className="task-meta">
                  {p._count.tasks} tasks · {p._count.members} members
                </p>
                <span className={`badge badge-${p.myRole?.toLowerCase()}`}>{p.myRole}</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
