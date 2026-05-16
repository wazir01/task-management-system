import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi } from '../api';
import StatusBadge from '../components/StatusBadge';
import WeeklyPieChart from '../components/WeeklyPieChart';
import ThemeSelector from '../components/ThemeSelector';

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi
      .get()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="page-loading">Loading dashboard…</p>;
  if (error) return <div className="error-banner">{error}</div>;

  const { summary, myTasks, overdueTasks, recentProjects } = data;

  return (
    <>
      <header className="page-header">
        <h1>Dashboard</h1>
        <p>Overview of your projects, tasks, and deadlines</p>
      </header>

      <ThemeSelector />

      <section className="card-grid">
        <article className="card stat-card">
          <h3>Projects</h3>
          <p className="value">{summary.projectCount}</p>
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

      {overdueTasks.length > 0 && (
        <section style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Overdue tasks</h2>
          <div className="task-list">
            {overdueTasks.map((task) => (
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
        {myTasks.length === 0 ? (
          <p className="empty-state">No active tasks assigned to you</p>
        ) : (
          <div className="task-list">
            {myTasks.map((task) => (
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
