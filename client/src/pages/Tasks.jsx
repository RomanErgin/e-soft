import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import './Tasks.css';

function statusColor(task) {
  const now = new Date();
  if (task.status === 'done') return 'green';
  if (new Date(task.dueDate) < now) return 'red';
  return 'gray';
}

function TaskModal({ onClose, onCreated, currentUser }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('medium');
  const [error, setError] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [options, setOptions] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    // current user + subordinates
    axios
      .get('http://localhost:8000/api/users/subordinates', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((r) => {
        const subs = r.data;
        const opts = [
          { id: currentUser.id, firstName: currentUser.firstName, lastName: currentUser.lastName },
          ...subs,
        ];
        setOptions(opts);
        setAssigneeId(currentUser.id);
      });
  }, [currentUser]);
  async function submit() {
    try {
      if (!title.trim() || !dueDate) {
        setError('Заполните заголовок и срок');
        return;
      }
      const token = localStorage.getItem('token');
      const body = {
        title,
        description,
        dueDate: new Date(dueDate).toISOString(),
        priority,
        assigneeId: assigneeId || currentUser.id,
      };
      const res = await axios.post('http://localhost:8000/api/tasks', body, {
        headers: { Authorization: `Bearer ${token}` },
      });
      onCreated(res.data);
    } catch (e) {
      const srv = e.response?.data;
      const msg =
        srv?.message ||
        (Array.isArray(srv?.errors)
          ? srv.errors.map((er) => er.msg).join(', ')
          : 'Ошибка сохранения');
      setError(msg);
    }
  }
  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>Новая задача</h3>
        <div>
          <input placeholder="Заголовок" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <textarea
            placeholder="Описание"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div>
          <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
            {options.map((o) => (
              <option key={o.id} value={o.id}>
                {o.firstName} {o.lastName}
              </option>
            ))}
          </select>
        </div>
        <div>
          <input
            type="datetime-local"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>
        <div>
          <select value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="high">Высокий</option>
            <option value="medium">Средний</option>
            <option value="low">Низкий</option>
          </select>
        </div>
        {error && <div style={{ color: 'red' }}>{error}</div>}
        <div className="modal-actions">
          <button onClick={submit}>Создать</button>
          <button onClick={onClose}>Отмена</button>
        </div>
      </div>
    </div>
  );
}

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [mode, setMode] = useState('all');
  const [currentUser, setCurrentUser] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    axios
      .get('http://localhost:8000/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => setCurrentUser(r.data.user));
    axios
      .get(`http://localhost:8000/api/tasks?mode=${mode}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((r) => setTasks(r.data));
  }, [mode]);

  const groupedByDue = useMemo(() => {
    const now = new Date();
    const weekAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return {
      today: tasks.filter((t) => new Date(t.dueDate).toDateString() === now.toDateString()),
      week: tasks.filter((t) => new Date(t.dueDate) > now && new Date(t.dueDate) <= weekAhead),
      future: tasks.filter((t) => new Date(t.dueDate) > weekAhead),
    };
  }, [tasks]);

  const groupedByAssignee = useMemo(() => {
    const map = {};
    for (const t of tasks) {
      const key = t.assignee?.id || 'unknown';
      if (!map[key]) map[key] = { assignee: t.assignee, items: [] };
      map[key].items.push(t);
    }
    return map;
  }, [tasks]);

  async function removeTask(taskId) {
    const token = localStorage.getItem('token');
    await axios.delete(`http://localhost:8000/api/tasks/${taskId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  }

  async function markDone(task) {
    const token = localStorage.getItem('token');
    await axios.put(
      `http://localhost:8000/api/tasks/${task.id}`,
      { status: 'done' },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    // Перезагрузим список, чтобы вернуть связи (creator/assignee)
    const r = await axios.get(`http://localhost:8000/api/tasks?mode=${mode}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setTasks(r.data);
  }

  return (
    <div className="tasks-page">
      <div className="tasks-controls">
        <select value={mode} onChange={(e) => setMode(e.target.value)}>
          <option value="all">Все</option>
          <option value="my">Мои</option>
          <option value="managed">Подчиненных</option>
        </select>
        <button onClick={() => setShowModal(true)}>Новая задача</button>
      </div>

      <h3>Группировка по дате завершения</h3>
      {['today', 'week', 'future'].map((k) => (
        <div key={k} className="group-section">
          <h4>{k === 'today' ? 'Сегодня' : k === 'week' ? 'На неделю' : 'Будущее'}</h4>
          {groupedByDue[k].map((t) => (
            <div key={t.id} className="task-card">
              <div className="task-card__main">
                <div className={`task-title ${statusColor(t)}`}>{t.title}</div>
                {t.description && <div className="task-desc">{t.description}</div>}
                <small>
                  Приоритет: {t.priority} | Дедлайн: {new Date(t.dueDate).toLocaleDateString()} |
                  Отв.: {t.assignee ? `${t.assignee.firstName} ${t.assignee.lastName}` : '-'} |
                  Статус: {t.status} | Создатель: {t.creator ? `${t.creator.firstName} ${t.creator.lastName}` : 'Неизвестно'}
                </small>
              </div>
              <div className="task-toolbar">
                {t.status !== 'done' &&
                  currentUser &&
                  t.creator &&
                  (t.creator.id === currentUser.id || t.creator.managerId === currentUser.id) && (
                    <button onClick={() => markDone(t)}>Выполнено</button>
                  )}
                {currentUser &&
                  t.creator &&
                  (t.creator.id === currentUser.id || t.creator.managerId === currentUser.id) && (
                    <button
                      onClick={() => {
                        if (window.confirm('Удалить задачу?')) removeTask(t.id);
                      }}
                    >
                      Удалить
                    </button>
                  )}
              </div>
            </div>
          ))}
        </div>
      ))}

      <div className="section-separator"></div>
      <h3 className="section-title">Группировка по ответственным</h3>
      {Object.values(groupedByAssignee).map((group) => (
        <div key={group.assignee?.id || 'unknown'} className="group-section">
          <h4>
            {group.assignee
              ? `${group.assignee.firstName} ${group.assignee.lastName}`
              : 'Не указан'}
          </h4>
          {group.items.map((t) => (
            <div key={t.id} className="task-card">
              <div className="task-card__main">
                <div className={`task-title ${statusColor(t)}`}>{t.title}</div>
                {t.description && <div className="task-desc">{t.description}</div>}
                <small>
                  Приоритет: {t.priority} | Дедлайн: {new Date(t.dueDate).toLocaleDateString()} |
                  Отв.: {t.assignee ? `${t.assignee.firstName} ${t.assignee.lastName}` : '-'} |
                  Статус: {t.status} | Создатель: {t.creator ? `${t.creator.firstName} ${t.creator.lastName}` : 'Неизвестно'}
                </small>
              </div>
              <div className="task-toolbar">
                {t.status !== 'done' &&
                  currentUser &&
                  t.creator &&
                  (t.creator.id === currentUser.id || t.creator.managerId === currentUser.id) && (
                    <button onClick={() => markDone(t)}>Выполнено</button>
                  )}
                {currentUser &&
                  t.creator &&
                  (t.creator.id === currentUser.id || t.creator.managerId === currentUser.id) && (
                    <button
                      onClick={() => {
                        if (window.confirm('Удалить задачу?')) removeTask(t.id);
                      }}
                    >
                      Удалить
                    </button>
                  )}
              </div>
            </div>
          ))}
        </div>
      ))}

      {showModal && currentUser && (
        <TaskModal
          currentUser={currentUser}
          onClose={() => setShowModal(false)}
          onCreated={(t) => {
            setShowModal(false);
            // Добавляем новую задачу в начало списка (теперь она содержит полную информацию)
            setTasks((prev) => [t, ...prev]);
          }}
        />
      )}
    </div>
  );
}
