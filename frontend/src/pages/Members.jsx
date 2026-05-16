import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { membersApi } from '../api';

function initials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('');
}

export default function Members() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    membersApi
      .list()
      .then((d) => setMembers(d.members))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return members;
    return members.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.projects.some((p) => p.name.toLowerCase().includes(q))
    );
  }, [members, search]);

  const adminCount = members.filter((m) =>
    m.projects.some((p) => p.role === 'ADMIN')
  ).length;

  return (
    <>
      <header className="page-header">
        <h1>Members</h1>
        <p>Every user in the system and the projects they're assigned to</p>
      </header>

      {!loading && !error && (
        <div className="card-grid" style={{ marginBottom: '1.5rem' }}>
          <article className="card stat-card">
            <h3>Total members</h3>
            <p className="value">{members.length}</p>
          </article>
          <article className="card stat-card">
            <h3>Admins</h3>
            <p className="value">{adminCount}</p>
          </article>
        </div>
      )}

      <div className="toolbar">
        <input
          type="search"
          className="filter-search-input"
          placeholder="Search by name, email, or project…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error && <p className="error-banner">{error}</p>}
      {loading ? (
        <p>Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="card empty-state">
          <p>{search ? 'No members match your search.' : 'No members yet.'}</p>
        </div>
      ) : (
        <div className="members-list">
          {filtered.map((m) => (
            <article key={m.id} className="card member-card">
              <div className="member-header">
                <div className="member-avatar" aria-hidden="true">
                  {initials(m.name)}
                </div>
                <div className="member-identity">
                  <h3>{m.name}</h3>
                  <p className="task-meta">{m.email}</p>
                </div>
                <div className="member-stats">
                  <span className="task-meta">
                    {m.projects.length} project{m.projects.length === 1 ? '' : 's'}
                  </span>
                  <span className="task-meta">
                    {m.assignedTaskCount} assigned task
                    {m.assignedTaskCount === 1 ? '' : 's'}
                  </span>
                </div>
              </div>

              {m.projects.length === 0 ? (
                <p className="task-meta member-empty">Not assigned to any project</p>
              ) : (
                <ul className="member-projects">
                  {m.projects.map((p) => (
                    <li key={p.id} className="member-project-row">
                      <Link to={`/projects/${p.id}`} className="member-project-name">
                        {p.name}
                      </Link>
                      <span className={`badge badge-${p.role.toLowerCase()}`}>
                        {p.role}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </div>
      )}
    </>
  );
}
