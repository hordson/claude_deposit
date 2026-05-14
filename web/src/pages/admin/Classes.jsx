import { useEffect, useState } from 'react';
import api from '../../api';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const emptyForm = { title: '', description: '', instructor: '', day_of_week: 1, start_time: '09:00', duration_mins: 60, capacity: 15, location: '' };

export default function AdminClasses() {
  const [classes, setClasses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [roster, setRoster] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  const load = () => api.get('/classes').then(r => setClasses(r.data));
  useEffect(() => { load(); }, []);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const openRoster = async cls => {
    const r = await api.get(`/classes/${cls.id}/roster`);
    setRoster({ cls, ...r.data });
  };

  const submit = async e => {
    e.preventDefault(); setError('');
    try {
      if (editing) {
        await api.put(`/classes/${editing.id}`, form);
        setEditing(null);
      } else {
        await api.post('/classes', form);
        setShowForm(false);
      }
      setForm(emptyForm); load();
    } catch (err) { setError(err.response?.data?.error || 'Failed'); }
  };

  const deactivate = async id => {
    if (!confirm('Deactivate this class? Existing bookings will remain.')) return;
    await api.delete(`/classes/${id}`);
    load();
  };

  const openEdit = cls => { setEditing(cls); setForm({ ...cls }); setShowForm(false); };

  const Field = ({ label, name, type = 'text', required = false }) => (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input type={type} required={required} value={form[name] ?? ''} onChange={set(name)}
        className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
    </div>
  );

  const ClassForm = ({ title, onClose }) => (
    <Modal title={title} onClose={onClose}>
      {error && <div className="text-red-600 text-sm mb-3">{error}</div>}
      <form onSubmit={submit} className="space-y-3">
        <Field label="Class Title *" name="title" required />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Instructor *" name="instructor" required />
          <Field label="Location" name="location" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Day *</label>
            <select value={form.day_of_week} onChange={set('day_of_week')} required
              className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
              {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
            </select>
          </div>
          <Field label="Start Time *" name="start_time" type="time" required />
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Duration (min)</label>
            <input type="number" min="15" max="180" value={form.duration_mins} onChange={set('duration_mins')}
              className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Capacity</label>
          <input type="number" min="1" max="100" value={form.capacity} onChange={set('capacity')}
            className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
          <textarea value={form.description || ''} onChange={set('description')} rows={2}
            className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600">Cancel</button>
          <button type="submit" className="px-4 py-2 text-sm bg-brand-600 text-white rounded-lg hover:bg-brand-700">
            {editing ? 'Save Changes' : 'Create Class'}
          </button>
        </div>
      </form>
    </Modal>
  );

  const byDay = DAYS.map((day, i) => ({ day, classes: classes.filter(c => c.day_of_week === i) }))
    .filter(g => g.classes.length > 0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Weekly Classes</h2>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm(emptyForm); }}
          className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700">
          + New Class
        </button>
      </div>

      {byDay.length === 0 && (
        <div className="text-center py-16 text-gray-400">No classes yet. Add your first class!</div>
      )}

      <div className="space-y-6">
        {byDay.map(({ day, classes: dayCls }) => (
          <div key={day}>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">{day}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dayCls.map(cls => (
                <div key={cls.id} className="bg-white rounded-xl shadow border border-gray-100 p-5">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-gray-800">{cls.title}</h4>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${cls.booked_count >= cls.capacity ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {cls.booked_count}/{cls.capacity}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">🕐 {cls.start_time} · {cls.duration_mins} min</p>
                  <p className="text-sm text-gray-500">👤 {cls.instructor}</p>
                  {cls.location && <p className="text-sm text-gray-500">📍 {cls.location}</p>}
                  {cls.waitlist_count > 0 && <p className="text-xs text-yellow-600 mt-1">⏳ {cls.waitlist_count} on waitlist</p>}
                  <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                    <button onClick={() => openRoster(cls)} className="text-xs text-brand-600 hover:underline">Roster</button>
                    <button onClick={() => openEdit(cls)} className="text-xs text-gray-500 hover:underline">Edit</button>
                    <button onClick={() => deactivate(cls.id)} className="text-xs text-red-400 hover:underline ml-auto">Remove</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {(showForm || editing) && (
        <ClassForm
          title={editing ? `Edit: ${editing.title}` : 'New Class'}
          onClose={() => { setShowForm(false); setEditing(null); setForm(emptyForm); setError(''); }}
        />
      )}

      {roster && (
        <Modal title={`Roster: ${roster.cls.title}`} onClose={() => setRoster(null)}>
          <p className="text-sm text-gray-500 mb-4">{DAYS[roster.cls.day_of_week]} · {roster.cls.start_time} · {roster.confirmed.length}/{roster.cls.capacity} confirmed</p>
          <h4 className="text-sm font-semibold mb-2">Confirmed ({roster.confirmed.length})</h4>
          {roster.confirmed.length === 0 ? <p className="text-sm text-gray-400 mb-4">No confirmed bookings</p> : (
            <ul className="mb-4 space-y-1">
              {roster.confirmed.map(s => (
                <li key={s.id} className="text-sm flex justify-between">
                  <span>{s.first_name} {s.last_name}</span>
                  <span className="text-gray-400">{s.phone}</span>
                </li>
              ))}
            </ul>
          )}
          {roster.waitlist.length > 0 && (
            <>
              <h4 className="text-sm font-semibold mb-2 text-yellow-700">Waitlist ({roster.waitlist.length})</h4>
              <ul className="space-y-1">
                {roster.waitlist.map(s => (
                  <li key={s.id} className="text-sm flex justify-between">
                    <span>#{s.waitlist_position} {s.first_name} {s.last_name}</span>
                    <span className="text-gray-400">{s.email}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">&times;</button>
        </div>
        {children}
      </div>
    </div>
  );
}
