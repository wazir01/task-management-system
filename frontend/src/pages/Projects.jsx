import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { projectsApi } from '../api';
import Modal from '../components/Modal';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const load = () => {
    setLoading(true);
    projectsApi
      .list()
      .then((d) => setProjects(d.projects))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await projectsApi.create({ name, description });
      setShowModal(false);
      setName('');
      setDescription('');
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <header className="page-header">
        <h1>Projects</h1>
        <p>Manage teams and track work across projects</p>
      </header>

      <div className="toolbar">
        <input
          type="search"
          className="filter-search-input"
          placeholder="Search projects…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button type="button" className="btn btn-primary" onClick={() => setShowModal(true)}>
          + New project
        </button>
      </div>

      {error && <p className="error-banner">{error}</p>}
      {loading ? (
        <p>Loading…</p>
      ) : projects.length === 0 ? (
        <div className="card empty-state">
          <p>No projects yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="project-grid">
          {projects
            .filter((p) => {
              const q = search.trim().toLowerCase();
              if (!q) return true;
              return (
                p.name.toLowerCase().includes(q) ||
                (p.description || '').toLowerCase().includes(q)
              );
            })
            .map((p) => (
            <Link key={p.id} to={`/projects/${p.id}`} className="card project-card">
              <h3>{p.name}</h3>
              {p.description && <p className="task-meta">{p.description}</p>}
              <p className="task-meta">
                {p._count?.tasks ?? 0} tasks · Owner: {p.owner.name}
              </p>
              <span className={`badge badge-${p.myRole?.toLowerCase()}`}>{p.myRole}</span>
            </Link>
          ))}
        </div>
      )}

      {showModal && (
        <Modal title="Create project" onClose={() => setShowModal(false)}>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label htmlFor="pname">Project name</label>
              <input id="pname" value={name} onChange={(e) => setName(e.target.value)} required maxLength={120} />
            </div>
            <div className="form-group">
              <label htmlFor="pdesc">Description</label>
              <textarea id="pdesc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} />
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Creating…' : 'Create'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
