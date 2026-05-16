import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { projectsApi, tasksApi } from '../api';
import Modal from '../components/Modal';
import TaskFilters from '../components/TaskFilters';
import KanbanBoard from '../components/kanban/KanbanBoard';
import { COLUMNS } from '../components/kanban/constants';

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toISOString().slice(0, 10);
}

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [tab, setTab] = useState('board');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [taskModal, setTaskModal] = useState(false);
  const [memberModal, setMemberModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [filters, setFilters] = useState({ q: '', status: '', priority: '', assigneeId: '' });

  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    status: 'TODO',
    priority: 'MEDIUM',
    assigneeId: '',
    dueDate: '',
  });
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState('MEMBER');
  const [projectModal, setProjectModal] = useState(false);
  const [projectForm, setProjectForm] = useState({ name: '', description: '' });

  const isAdmin = project?.myRole === 'ADMIN';
  const isOwner = project?.ownerId === user?.id;
  const members = project?.members || [];

  const loadProject = useCallback(() => {
    return projectsApi.get(id).then((p) => setProject(p.project));
  }, [id]);

  const loadTasks = useCallback(() => {
    return tasksApi.list(id, filters).then((t) => setTasks(t.tasks));
  }, [id, filters]);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([loadProject(), loadTasks()])
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [loadProject, loadTasks]);

  useEffect(() => {
    const t = setTimeout(() => {
      loadTasks().catch((e) => setError(e.message));
    }, filters.q ? 300 : 0);
    return () => clearTimeout(t);
  }, [filters, loadTasks]);

  useEffect(() => {
    loadProject().catch((e) => setError(e.message));
  }, [loadProject]);

  const openNewTask = () => {
    setEditTask(null);
    setTaskForm({
      title: '',
      description: '',
      status: 'TODO',
      priority: 'MEDIUM',
      assigneeId: '',
      dueDate: '',
    });
    setTaskModal(true);
  };

  const openEditTask = (task) => {
    setEditTask(task);
    setTaskForm({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority || 'MEDIUM',
      assigneeId: task.assigneeId || '',
      dueDate: task.dueDate ? formatDate(task.dueDate) : '',
    });
    setTaskModal(true);
  };

  const saveTask = async (e) => {
    e.preventDefault();
    setError('');
    const body = {
      title: taskForm.title,
      description: taskForm.description,
      status: taskForm.status,
      priority: taskForm.priority,
      assigneeId: taskForm.assigneeId || null,
      dueDate: taskForm.dueDate || null,
    };
    try {
      if (editTask) {
        await tasksApi.update(editTask.id, body);
      } else {
        await tasksApi.create(id, body);
      }
      setTaskModal(false);
      loadTasks();
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await tasksApi.remove(taskId);
      loadTasks();
    } catch (err) {
      setError(err.message);
    }
  };

  const addMember = async (e) => {
    e.preventDefault();
    try {
      await projectsApi.addMember(id, { email: memberEmail, role: memberRole });
      setMemberModal(false);
      setMemberEmail('');
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const updateMemberRole = async (userId, role) => {
    try {
      await projectsApi.updateMember(id, userId, { role });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const removeMember = async (userId) => {
    if (!window.confirm('Remove this member?')) return;
    try {
      await projectsApi.removeMember(id, userId);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const openEditProject = () => {
    setProjectForm({ name: project.name, description: project.description || '' });
    setProjectModal(true);
  };

  const saveProject = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { project: updated } = await projectsApi.update(id, projectForm);
      setProject(updated);
      setProjectModal(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteProject = async () => {
    if (!window.confirm('Delete this project and all its tasks? This cannot be undone.')) return;
    try {
      await projectsApi.remove(id);
      navigate('/projects');
    } catch (err) {
      setError(err.message);
    }
  };

  const boardStats = useMemo(() => {
    const counts = Object.fromEntries(COLUMNS.map((c) => [c.id, 0]));
    tasks.forEach((t) => {
      if (counts[t.status] !== undefined) counts[t.status]++;
    });
    return counts;
  }, [tasks]);

  if (loading && !project) return <p>Loading project…</p>;
  if (!project) return <p className="error-banner">{error || 'Project not found'}</p>;

  return (
    <>
      <header className="page-header">
        <div className="page-header-row">
          <div>
            <h1>{project.name}</h1>
            <p>{project.description || 'No description'}</p>
            <span className={`badge badge-${project.myRole?.toLowerCase()}`}>Your role: {project.myRole}</span>
          </div>
          {isAdmin && (
            <div className="page-header-actions">
              <button type="button" className="btn btn-ghost" onClick={openEditProject}>
                Edit project
              </button>
              {isOwner && (
                <button type="button" className="btn btn-danger" onClick={deleteProject}>
                  Delete project
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      {error && <p className="error-banner">{error}</p>}

      <nav className="tabs">
        <button type="button" className={`tab ${tab === 'board' ? 'active' : ''}`} onClick={() => setTab('board')}>
          Board
        </button>
        <button type="button" className={`tab ${tab === 'members' ? 'active' : ''}`} onClick={() => setTab('members')}>
          Team ({members.length})
        </button>
      </nav>

      {tab === 'board' && (
        <>
          <TaskFilters filters={filters} onChange={setFilters} members={members} />
          <div className="toolbar">
            <button type="button" className="btn btn-primary" onClick={openNewTask}>
              + Add task
            </button>
            <div className="board-stats">
              {COLUMNS.map((c) => (
                <span key={c.id} style={{ color: c.color }}>
                  {c.title}: {boardStats[c.id]}
                </span>
              ))}
            </div>
          </div>
          <KanbanBoard
            tasks={tasks}
            onTasksChange={setTasks}
            onTaskClick={openEditTask}
            onError={setError}
          />
        </>
      )}

      {tab === 'members' && (
        <section className="card">
          {isAdmin && (
            <div className="toolbar">
              <button type="button" className="btn btn-primary" onClick={() => setMemberModal(true)}>
                + Invite member
              </button>
            </div>
          )}
          <table className="members-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id}>
                  <td>{m.user.name}</td>
                  <td>{m.user.email}</td>
                  <td>
                    {isAdmin && m.userId !== project.ownerId ? (
                      <select
                        value={m.role}
                        onChange={(e) => updateMemberRole(m.userId, e.target.value)}
                      >
                        <option value="ADMIN">Admin</option>
                        <option value="MEMBER">Member</option>
                      </select>
                    ) : (
                      <span className={`badge badge-${m.role.toLowerCase()}`}>{m.role}</span>
                    )}
                  </td>
                  {isAdmin && (
                    <td>
                      {m.userId !== project.ownerId && (
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => removeMember(m.userId)}
                        >
                          Remove
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {taskModal && (
        <Modal title={editTask ? 'Edit task' : 'New task'} onClose={() => setTaskModal(false)}>
          <form onSubmit={saveTask}>
            <div className="form-group">
              <label>Title</label>
              <input
                value={taskForm.title}
                onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                required
                disabled={!isAdmin && !!editTask}
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                rows={2}
                value={taskForm.description}
                onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                disabled={!isAdmin && !!editTask}
              />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select
                value={taskForm.status}
                onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}
              >
                {COLUMNS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
            {isAdmin && (
              <>
                <div className="form-group">
                  <label>Priority</label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Assignee</label>
                  <select
                    value={taskForm.assigneeId}
                    onChange={(e) => setTaskForm({ ...taskForm, assigneeId: e.target.value })}
                  >
                    <option value="">Unassigned</option>
                    {members.map((m) => (
                      <option key={m.userId} value={m.userId}>
                        {m.user.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Due date</label>
                  <input
                    type="date"
                    value={taskForm.dueDate}
                    onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                  />
                </div>
              </>
            )}
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setTaskModal(false)}>
                Cancel
              </button>
              {editTask && (isAdmin || editTask.createdBy?.id === user?.id) && (
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => {
                    setTaskModal(false);
                    deleteTask(editTask.id);
                  }}
                >
                  Delete
                </button>
              )}
              <button type="submit" className="btn btn-primary">
                Save
              </button>
            </div>
          </form>
        </Modal>
      )}

      {projectModal && (
        <Modal title="Edit project" onClose={() => setProjectModal(false)}>
          <form onSubmit={saveProject}>
            <div className="form-group">
              <label htmlFor="edit-pname">Project name</label>
              <input
                id="edit-pname"
                value={projectForm.name}
                onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                required
                maxLength={120}
              />
            </div>
            <div className="form-group">
              <label htmlFor="edit-pdesc">Description</label>
              <textarea
                id="edit-pdesc"
                rows={3}
                value={projectForm.description}
                onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                maxLength={500}
              />
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setProjectModal(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Save changes
              </button>
            </div>
          </form>
        </Modal>
      )}

      {memberModal && (
        <Modal title="Invite team member" onClose={() => setMemberModal(false)}>
          <form onSubmit={addMember}>
            <div className="form-group">
              <label>Email address</label>
              <input
                type="email"
                value={memberEmail}
                onChange={(e) => setMemberEmail(e.target.value)}
                required
                placeholder="user@company.com"
              />
            </div>
            <div className="form-group">
              <label>Role</label>
              <select value={memberRole} onChange={(e) => setMemberRole(e.target.value)}>
                <option value="MEMBER">Member</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setMemberModal(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Invite
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
