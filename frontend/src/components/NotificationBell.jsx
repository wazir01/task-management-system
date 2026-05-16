import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { notificationsApi } from '../api';
import { requestPushPermission } from '../utils/pushNotifications';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [settings, setSettings] = useState(null);

  const load = () => {
    notificationsApi
      .list()
      .then((d) => {
        setItems(d.notifications);
        setUnread(d.unreadCount);
      })
      .catch(() => {});
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (open) {
      notificationsApi.getSettings().then((d) => setSettings(d.settings)).catch(() => {});
    }
  }, [open]);

  const markRead = async (id) => {
    await notificationsApi.markRead(id);
    load();
  };

  const markAllRead = async () => {
    await notificationsApi.markAllRead();
    load();
  };

  const toggleSetting = async (key) => {
    if (!settings) return;
    const updated = await notificationsApi.updateSettings({
      [key]: !settings[key],
    });
    setSettings(updated.settings);
  };

  const enablePush = async () => {
    try {
      await requestPushPermission();
      load();
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div className="notification-bell">
      <button
        type="button"
        className="btn btn-ghost notification-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
      >
        <span className="bell-icon">🔔</span>
        {unread > 0 && <span className="notification-badge">{unread > 9 ? '9+' : unread}</span>}
      </button>

      {open && (
        <>
          <button
            type="button"
            className="notification-backdrop"
            aria-label="Close"
            onClick={() => setOpen(false)}
          />
          <div className="notification-panel card">
            <header className="notification-panel-header">
              <h3>Notifications</h3>
              {unread > 0 && (
                <button type="button" className="btn btn-ghost btn-sm" onClick={markAllRead}>
                  Mark all read
                </button>
              )}
            </header>

            {settings && (
              <div className="notification-settings">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.deadlineAlerts}
                    onChange={() => toggleSetting('deadlineAlerts')}
                  />
                  Deadline alerts
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={settings.emailReminders}
                    onChange={() => toggleSetting('emailReminders')}
                  />
                  Email reminders
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={settings.pushNotifications}
                    onChange={() => toggleSetting('pushNotifications')}
                  />
                  Push notifications
                </label>
                <button type="button" className="btn btn-ghost btn-sm" onClick={enablePush}>
                  Enable browser push
                </button>
              </div>
            )}

            <ul className="notification-list">
              {items.length === 0 ? (
                <li className="notification-empty">No notifications yet</li>
              ) : (
                items.map((n) => (
                  <li
                    key={n.id}
                    className={`notification-item ${n.read ? '' : 'unread'}`}
                    onClick={() => !n.read && markRead(n.id)}
                  >
                    <strong>{n.title}</strong>
                    <p>{n.message}</p>
                    <span className="notification-meta">
                      {new Date(n.createdAt).toLocaleString()}
                      {n.sentEmail && ' · ✉'}
                      {n.sentPush && ' · 🔔'}
                    </span>
                    {n.projectId && (
                      <Link
                        to={`/projects/${n.projectId}`}
                        className="notification-link"
                        onClick={() => setOpen(false)}
                      >
                        View project →
                      </Link>
                    )}
                  </li>
                ))
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
