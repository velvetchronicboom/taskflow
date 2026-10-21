
import { useEffect, useState } from 'react'
import { apiRequest } from './api'
import './App.css'

const DEMO_TASKS = [
  {
    id: 'demo-1',
    title: 'Explore TaskFlow',
    description: 'Try changing the status and priority of this task.',
    priority: 'HIGH',
    status: 'TODO',
    estimatedMinutes: 15,
  },
  {
    id: 'demo-2',
    title: 'Learn Spring Boot',
    description: 'Build your first REST API.',
    priority: 'MEDIUM',
    status: 'IN_PROGRESS',
    estimatedMinutes: 60,
  },
  {
    id: 'demo-3',
    title: 'Review Java collections',
    description: 'Revise lists, maps, and sets.',
    priority: 'LOW',
    status: 'DONE',
    estimatedMinutes: 30,
  },
]

function App() {
  const [token, setToken] = useState(
      () => localStorage.getItem('taskflow_token'),
  )
  const [demoMode, setDemoMode] = useState(false)
  const [user, setUser] = useState(null)
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [authMode, setAuthMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('ALL')
  const [showForm, setShowForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newPriority, setNewPriority] = useState('MEDIUM')
  const [estimatedMinutes, setEstimatedMinutes] = useState('30')

  // Demo mode: all changes stay in React state.
  function startDemo() {
    setDemoMode(true)
    setUser({ email: 'demo@taskflow.local' })
    setTasks(DEMO_TASKS.map((task) => ({ ...task })))
    setError('')
    setSearch('')
    setActiveFilter('ALL')
    setShowForm(false)
  }

  async function logout() {
    localStorage.removeItem('taskflow_token')
    setToken(null)
    setDemoMode(false)
    setUser(null)
    setTasks([])
    setError('')
    setSearch('')
    setActiveFilter('ALL')
    setShowForm(false)
    setEmail('')
    setPassword('')
  }

  // Load real user and tasks only when authenticated outside demo mode.
  useEffect(() => {
    if (!token || demoMode) return

    let cancelled = false

    async function loadUserAndTasks() {
      setLoading(true)
      setError('')

      try {
        const me = await apiRequest('/api/auth/me', { token })
        const data = await apiRequest('/api/tasks', { token })

        if (!cancelled) {
          setUser(me)
          setTasks(data)
        }
      } catch (err) {
        if (!cancelled) {
          localStorage.removeItem('taskflow_token')
          setToken(null)
          setUser(null)
          setTasks([])
          setError(`Session expired or API unavailable: ${err.message}`)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadUserAndTasks()

    return () => {
      cancelled = true
    }
  }, [token, demoMode])

  async function handleAuth(event) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (authMode === 'register') {
        await apiRequest('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        })
      }

      const result = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })

      localStorage.setItem('taskflow_token', result.token)
      setDemoMode(false)
      setToken(result.token)
      setPassword('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function addTask(event) {
    event.preventDefault()
    setError('')

    const taskDetails = {
      title: newTitle.trim(),
      description: newDescription.trim(),
      priority: newPriority,
      estimatedMinutes: Number(estimatedMinutes),
    }

    if (!taskDetails.title || taskDetails.estimatedMinutes < 1) {
      setError('Enter a task title and a valid estimated time.')
      return
    }

    if (demoMode) {
      const created = {
        id: `demo-${Date.now()}`,
        ...taskDetails,
        status: 'TODO',
      }

      setTasks((current) => [created, ...current])
      setNewTitle('')
      setNewDescription('')
      setNewPriority('MEDIUM')
      setEstimatedMinutes('30')
      setShowForm(false)
      return
    }

    try {
      const created = await apiRequest('/api/tasks', {
        token,
        method: 'POST',
        body: JSON.stringify(taskDetails),
      })

      setTasks((current) => [created, ...current])
      setNewTitle('')
      setNewDescription('')
      setNewPriority('MEDIUM')
      setEstimatedMinutes('30')
      setShowForm(false)
    } catch (err) {
      setError(err.message)
    }
  }

  async function updateTask(task, changes) {
    setError('')

    if (demoMode) {
      setTasks((current) =>
          current.map((item) =>
              item.id === task.id ? { ...item, ...changes } : item,
          ),
      )
      return
    }

    const updatedTask = {
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      status: task.status,
      estimatedMinutes: task.estimatedMinutes || 30,
      ...changes,
    }

    try {
      const updated = await apiRequest(`/api/tasks/${task.id}`, {
        token,
        method: 'PUT',
        body: JSON.stringify(updatedTask),
      })

      setTasks((current) =>
          current.map((item) => (item.id === task.id ? updated : item)),
      )
    } catch (err) {
      setError(err.message)
    }
  }

  async function deleteTask(taskId) {
    setError('')

    if (demoMode) {
      setTasks((current) =>
          current.filter((task) => task.id !== taskId),
      )
      return
    }

    try {
      await apiRequest(`/api/tasks/${taskId}`, {
        token,
        method: 'DELETE',
      })

      setTasks((current) =>
          current.filter((task) => task.id !== taskId),
      )
    } catch (err) {
      setError(err.message)
    }
  }

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
        task.title.toLowerCase().includes(search.toLowerCase()) ||
        (task.description || '').toLowerCase().includes(search.toLowerCase())

    return (
        matchesSearch &&
        (activeFilter === 'ALL' || task.status === activeFilter)
    )
  })

  const todoCount = tasks.filter((task) => task.status === 'TODO').length
  const progressCount = tasks.filter(
      (task) => task.status === 'IN_PROGRESS',
  ).length
  const doneCount = tasks.filter((task) => task.status === 'DONE').length

  if (!demoMode && (!token || !user)) {
    return (
        <main className="auth-page">
          <form className="auth-card" onSubmit={handleAuth}>
            <a className="brand" href="#">
              <span className="brand-icon">T</span>
              <span>
              taskflow<span className="brand-dot">.</span>
            </span>
            </a>

            <h1>
              {authMode === 'login'
                  ? 'Welcome back'
                  : 'Create your account'}
            </h1>

            <p className="subtitle">
              {authMode === 'login'
                  ? 'Sign in to pick up where you left off.'
                  : 'Get organized and make progress every day.'}
            </p>

            {error && <p className="error-message">{error}</p>}

            <label htmlFor="email">Email</label>
            <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoComplete="email"
            />

            <label htmlFor="password">Password</label>
            <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                autoComplete={
                  authMode === 'login' ? 'current-password' : 'new-password'
                }
            />

            <button
                className="primary-button"
                type="submit"
                disabled={loading}
            >
              {loading
                  ? 'Please wait...'
                  : authMode === 'login'
                      ? 'Sign in'
                      : 'Register'}
            </button>

            <button
                className="demo-button"
                type="button"
                onClick={startDemo}
                disabled={loading}
            >
              Try demo — no account needed
            </button>

            <p className="auth-switch">
              {authMode === 'login'
                  ? "Don't have an account?"
                  : 'Already registered?'}{' '}
              <button
                  type="button"
                  onClick={() => {
                    setAuthMode(authMode === 'login' ? 'register' : 'login')
                    setError('')
                  }}
              >
                {authMode === 'login' ? 'Register' : 'Sign in'}
              </button>
            </p>
          </form>
        </main>
    )
  }

  return (
      <div className="app-shell">
        <aside className="sidebar">
          <a className="brand" href="#">
            <span className="brand-icon">T</span>
            <span>
            taskflow<span className="brand-dot">.</span>
          </span>
          </a>

          <p className="nav-label">WORKSPACE</p>
          <button className="nav-item active" type="button">
            <span>▦</span> My Tasks <span className="nav-count">{tasks.length}</span>
          </button>

          <div className="sidebar-bottom">
            <div className="profile-avatar">TF</div>
            <div>
              <strong>{user?.email}</strong>
              <span>{demoMode ? 'Demo workspace' : 'Personal workspace'}</span>
            </div>
          </div>
        </aside>

        <main className="main-content">
          <header className="topbar">
          <span className="breadcrumb">
            Workspace / <strong>My Tasks</strong>
          </span>
            <div className="topbar-actions">
              {demoMode && <span className="demo-badge">Demo mode</span>}
              <button className="filter-button" type="button" onClick={logout}>
                {demoMode ? 'Exit demo' : 'Log out'}
              </button>
            </div>
          </header>

          <section className="page-content">
            <div className="page-heading">
              <div>
                <p className="eyebrow">YOUR WORKSPACE</p>
                <h1>
                  My Tasks<span className="heading-dot">.</span>
                </h1>
                <p className="subtitle">
                  A little progress each day adds up to big results.
                </p>
              </div>
              <button
                  className="primary-button"
                  type="button"
                  onClick={() => setShowForm(!showForm)}
              >
                ＋ New task
              </button>
            </div>

            {demoMode && (
                <p className="demo-notice">
                  You're exploring with sample data. Changes won't be saved after
                  you exit or refresh the demo.
                </p>
            )}

            {error && <p className="error-message">{error}</p>}
            {loading && <p className="subtitle">Loading your tasks...</p>}

            <section className="stats-grid">
              <article className="stat-card">
                <span className="stat-icon total-icon">▤</span>
                <p>Total tasks</p>
                <strong>{tasks.length}</strong>
                <span className="stat-note">Across your workspace</span>
              </article>
              <article className="stat-card">
                <span className="stat-icon todo-icon">◷</span>
                <p>To do</p>
                <strong>{todoCount}</strong>
                <span className="stat-note">Ready when you are</span>
              </article>
              <article className="stat-card">
                <span className="stat-icon progress-icon">↗</span>
                <p>In progress</p>
                <strong>{progressCount}</strong>
                <span className="stat-note">Keep the momentum</span>
              </article>
              <article className="stat-card">
                <span className="stat-icon done-icon">✓</span>
                <p>Completed</p>
                <strong>{doneCount}</strong>
                <span className="stat-note">Nice work!</span>
              </article>
            </section>

            {showForm && (
                <form className="task-form" onSubmit={addTask}>
                  <div className="form-heading">
                    <h2>Create a task</h2>
                    <button
                        className="close-button"
                        type="button"
                        onClick={() => setShowForm(false)}
                    >
                      ×
                    </button>
                  </div>

                  <label htmlFor="task-title">Task title</label>
                  <input
                      id="task-title"
                      value={newTitle}
                      onChange={(event) => setNewTitle(event.target.value)}
                      maxLength={150}
                      required
                  />

                  <label htmlFor="task-description">Description</label>
                  <textarea
                      id="task-description"
                      value={newDescription}
                      onChange={(event) => setNewDescription(event.target.value)}
                      maxLength={1000}
                      rows="2"
                  />

                  <label htmlFor="task-priority">Priority</label>
                  <select
                      id="task-priority"
                      value={newPriority}
                      onChange={(event) => setNewPriority(event.target.value)}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>

                  <label htmlFor="estimated-minutes">Estimated minutes</label>
                  <input
                      id="estimated-minutes"
                      type="number"
                      min="1"
                      value={estimatedMinutes}
                      onChange={(event) => setEstimatedMinutes(event.target.value)}
                      required
                  />

                  <button className="primary-button" type="submit">
                    Create task
                  </button>
                </form>
            )}

            <section className="tasks-section">
              <div className="tasks-heading">
                <div>
                  <h2>All tasks</h2>
                  <p>Manage your work, one task at a time.</p>
                </div>
                <span className="task-total">{filteredTasks.length} tasks</span>
              </div>

              <div className="task-toolbar">
                <div className="search-box">
                  <span>⌕</span>
                  <input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search tasks..."
                      aria-label="Search tasks"
                  />
                </div>

                <div className="filter-group">
                  {['ALL', 'TODO', 'IN_PROGRESS', 'DONE'].map((filter) => (
                      <button
                          key={filter}
                          className={`filter-button ${
                              activeFilter === filter ? 'selected' : ''
                          }`}
                          type="button"
                          onClick={() => setActiveFilter(filter)}
                      >
                        {{
                          ALL: 'All',
                          TODO: 'To do',
                          IN_PROGRESS: 'In progress',
                          DONE: 'Completed',
                        }[filter]}
                      </button>
                  ))}
                </div>
              </div>

              <div className="task-list">
                {filteredTasks.map((task) => (
                    <article className="task-row" key={task.id}>
                      <button
                          type="button"
                          className={`task-check ${
                              task.status === 'DONE' ? 'checked' : ''
                          }`}
                          aria-label={
                            task.status === 'DONE'
                                ? `Mark incomplete: ${task.title}`
                                : `Mark complete: ${task.title}`
                          }
                          aria-pressed={task.status === 'DONE'}
                          onClick={() =>
                              updateTask(task, {
                                status: task.status === 'DONE' ? 'TODO' : 'DONE',
                              })
                          }
                      >
                        {task.status === 'DONE' ? '✓' : ''}
                      </button>

                      <div className="task-info">
                        <h3 className={task.status === 'DONE' ? 'completed-title' : ''}>
                          {task.title}
                        </h3>
                        <p>
                          {task.description || 'No description'} ·{' '}
                          {task.estimatedMinutes} min
                        </p>
                      </div>

                      <span
                          className={`priority-badge ${(task.priority || 'MEDIUM').toLowerCase()}`}
                      >
                    <span>●</span> {task.priority}
                  </span>

                      <select
                          className={`status-select ${(task.status || 'TODO').toLowerCase()}`}
                          aria-label={`Status for ${task.title}`}
                          value={task.status}
                          onChange={(event) =>
                              updateTask(task, { status: event.target.value })
                          }
                      >
                        <option value="TODO">To do</option>
                        <option value="IN_PROGRESS">In progress</option>
                        <option value="DONE">Completed</option>
                      </select>

                      <select
                          className="status-select"
                          aria-label={`Priority for ${task.title}`}
                          value={task.priority}
                          onChange={(event) =>
                              updateTask(task, { priority: event.target.value })
                          }
                      >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                      </select>

                      <button
                          className="delete-button"
                          type="button"
                          aria-label={`Delete ${task.title}`}
                          onClick={() => deleteTask(task.id)}
                      >
                        ×
                      </button>
                    </article>
                ))}

                {!loading && filteredTasks.length === 0 && (
                    <div className="empty-state">
                      <span>⌕</span>
                      <h3>No tasks found</h3>
                      <p>Try another search or create a new task.</p>
                    </div>
                )}
              </div>
            </section>

            <footer className="page-footer">
              <span>Made for focused work.</span>
              <span>
              TaskFlow <span className="heading-dot">●</span>
            </span>
            </footer>
          </section>
        </main>
      </div>
  )
}

export default App
