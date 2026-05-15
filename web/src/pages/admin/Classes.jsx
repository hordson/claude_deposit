import { useEffect, useState } from 'react';
import api from '../../api';

function toYMD(date) { return date.toISOString().slice(0, 10); }
function addDays(date, n) { const d = new Date(date); d.setDate(d.getDate() + n); return d; }
function startOfWeek(date) { const d = new Date(date); d.setDate(d.getDate() - d.getDay()); d.setHours(0,0,0,0); return d; }
function fmt(ymd) { const [y,m,d]=ymd.split('-').map(Number); return new Date(y,m-1,d).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}); }

const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const emptyDef = { title:'', description:'', instructor:'', duration_mins:75, capacity:20, location:'' };

export default function AdminClasses() {
  const [definitions, setDefinitions] = useState([]);
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date()));
  const [sessions, setSessions] = useState([]);
  const [showDefForm, setShowDefForm] = useState(false);
  const [editDef, setEditDef] = useState(null);
  const [defForm, setDefForm] = useState(emptyDef);
  const [showSchedule, setShowSchedule] = useState(null); // class def to schedule
  const [schedForm, setSchedForm] = useState({ dates: [], start_time: '', capacity_override: '' });
  const [roster, setRoster] = useState(null);
  const [error, setError] = useState('');

  const weekEnd = addDays(weekStart, 6);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const loadDefs = () => api.get('/classes/definitions').then(r => setDefinitions(r.data));
  const loadSessions = () => api.get('/classes/sessions', {
    params: { from: toYMD(weekStart), to: toYMD(weekEnd) }
  }).then(r => setSessions(r.data));

  useEffect(() => { loadDefs(); }, []);
  useEffect(() => { loadSessions(); }, [weekStart]);

  const setD = k => e => setDefForm(f => ({ ...f, [k]: e.target.value }));

  const saveDef = async e => {
    e.preventDefault(); setError('');
    try {
      if (editDef) { await api.put(`/classes/definitions/${editDef.id}`, defForm); setEditDef(null); }
      else { await api.post('/classes/definitions', defForm); setShowDefForm(false); }
      setDefForm(emptyDef); loadDefs();
    } catch (err) { setError(err.response?.data?.error || 'Failed'); }
  };

  const deleteDef = async id => {
    if (!confirm('Remove this class? All future sessions will be deactivated.')) return;
    await api.delete(`/classes/definitions/${id}`); loadDefs();
  };

  const toggleDate = ymd => {
    setSchedForm(f => ({
      ...f,
      dates: f.dates.includes(ymd) ? f.dates.filter(d => d !== ymd) : [...f.dates, ymd]
    }));
  };

  const submitSchedule = async e => {
    e.preventDefault(); setError('');
    if (!schedForm.dates.length) return setError('Select at least one date');
    if (!schedForm.start_time) return setError('Start time is required');
    try {
      await api.post('/classes/sessions', {
        class_id: showSchedule.id,
        dates: schedForm.dates,
        start_time: schedForm.start_time,
        capacity_override: schedForm.capacity_override || null,
      });
      setShowSchedule(null);
      setSchedForm({ dates: [], start_time: '', capacity_override: '' });
      loadSessions();
    } catch (err) { setError(err.response?.data?.error || 'Failed'); }
  };

  const cancelSession = async id => {
    if (!confirm('Cancel this session? Students will keep their bookings but no new bookings will be allowed.')) return;
    await api.delete(`/classes/sessions/${id}`); loadSessions();
  };

  const openRoster = async session => {
    const r = await api.get(`/classes/sessions/${session.id}/roster`);
    setRoster(r.data);
  };

  const Field = ({ label, name, type='text', form, setForm, required=false }) => (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input type={type} required={required} value={form[name]??''} onChange={e => setForm(f=>({...f,[name]:e.target.value}))}
        className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
    </div>
  );

  // Group sessions by date for week view
  const sessionsByDate = {};
  sessions.forEach(s => { if (!sessionsByDate[s.date]) sessionsByDate[s.date] = []; sessionsByDate[s.date].push(s); });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Classes</h2>
        <button onClick={() => { setShowDefForm(true); setEditDef(null); setDefForm(emptyDef); }}
          className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700">
          + New Class
        </button>
      </div>

      {/* Class Definitions */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Class Roster</h3>
        {definitions.length === 0 && <p className="text-gray-400 text-sm">No classes yet. Add your first class above.</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {definitions.map(cls => (
            <div key={cls.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="flex justify-between items-start mb-1">
                <h4 className="font-semibold text-gray-800">{cls.title}</h4>
                <span className="text-xs text-gray-400">cap: {cls.capacity}</span>
              </div>
              <p className="text-sm text-gray-500 mb-1">👤 {cls.instructor} · {cls.duration_mins} min</p>
              {cls.location && <p className="text-xs text-gray-400 mb-2">📍 {cls.location}</p>}
              <div className="flex gap-2 pt-2 border-t border-gray-100">
                <button onClick={() => { setShowSchedule(cls); setSchedForm({ dates: [], start_time: '', capacity_override: '' }); }}
                  className="text-xs bg-brand-50 text-brand-700 px-2 py-1 rounded hover:bg-brand-100">Schedule Dates</button>
                <button onClick={() => { setEditDef(cls); setDefForm({...cls}); setShowDefForm(true); }}
                  className="text-xs text-gray-500 hover:underline">Edit</button>
                <button onClick={() => deleteDef(cls.id)} className="text-xs text-red-400 hover:underline ml-auto">Remove</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly Session View */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Weekly Schedule</h3>
          <div className="flex items-center gap-2">
            <button onClick={() => setWeekStart(w => addDays(w,-7))} className="text-gray-400 hover:text-brand-600 px-2 text-xl">‹</button>
            <span className="text-sm font-medium text-gray-600">
              {weekStart.toLocaleDateString('en-US',{month:'short',day:'numeric'})} – {weekEnd.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}
            </span>
            <button onClick={() => setWeekStart(w => addDays(w,7))} className="text-gray-400 hover:text-brand-600 px-2 text-xl">›</button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day, i) => {
            const ymd = toYMD(day);
            const daySessions = sessionsByDate[ymd] || [];
            const isToday = ymd === toYMD(new Date());
            return (
              <div key={i} className="min-h-[120px]">
                <div className={`text-center py-1 rounded-t-lg text-xs font-semibold mb-1 ${isToday ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                  <div>{DAYS[i]}</div>
                  <div className="text-base font-bold">{day.getDate()}</div>
                </div>
                <div className="space-y-1">
                  {daySessions.sort((a,b) => a.start_time.localeCompare(b.start_time)).map(s => (
                    <div key={s.id} className="bg-white border border-gray-200 rounded p-1.5 text-xs shadow-sm">
                      <p className="font-semibold text-gray-800 truncate">{s.title}</p>
                      <p className="text-gray-400">{s.start_time}</p>
                      <p className="text-gray-400">{s.booked_count}/{s.capacity}</p>
                      <div className="flex gap-1 mt-1">
                        <button onClick={() => openRoster(s)} className="text-brand-600 hover:underline">Roster</button>
                        <button onClick={() => cancelSession(s.id)} className="text-red-400 hover:underline ml-auto">✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* New/Edit Class Definition Modal */}
      {(showDefForm || editDef) && (
        <Modal title={editDef ? `Edit: ${editDef.title}` : 'New Class'} onClose={() => { setShowDefForm(false); setEditDef(null); setError(''); }}>
          {error && <div className="text-red-600 text-sm mb-3">{error}</div>}
          <form onSubmit={saveDef} className="space-y-3">
            <Field label="Class Title *" name="title" form={defForm} setForm={setDefForm} required />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Instructor *" name="instructor" form={defForm} setForm={setDefForm} required />
              <Field label="Location" name="location" form={defForm} setForm={setDefForm} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Duration (min)" name="duration_mins" type="number" form={defForm} setForm={setDefForm} />
              <Field label="Default Capacity" name="capacity" type="number" form={defForm} setForm={setDefForm} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
              <textarea value={defForm.description||''} onChange={e=>setDefForm(f=>({...f,description:e.target.value}))} rows={2}
                className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => { setShowDefForm(false); setEditDef(null); }} className="px-4 py-2 text-sm text-gray-600">Cancel</button>
              <button type="submit" className="px-4 py-2 text-sm bg-brand-600 text-white rounded-lg hover:bg-brand-700">{editDef ? 'Save' : 'Create'}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Schedule Dates Modal */}
      {showSchedule && (
        <Modal title={`Schedule: ${showSchedule.title}`} onClose={() => { setShowSchedule(null); setError(''); }}>
          <p className="text-sm text-gray-500 mb-4">Select which dates this class will run. You can pick multiple dates at once.</p>
          {error && <div className="text-red-600 text-sm mb-3">{error}</div>}
          <form onSubmit={submitSchedule} className="space-y-4">
            {/* Simple date picker — show next 8 weeks */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Select dates</label>
              <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                {Array.from({ length: 56 }, (_, i) => {
                  const d = addDays(new Date(), i);
                  const ymd = toYMD(d);
                  const selected = schedForm.dates.includes(ymd);
                  return (
                    <button key={ymd} type="button" onClick={() => toggleDate(ymd)}
                      className={`text-xs py-1.5 px-2 rounded border transition ${selected ? 'bg-brand-600 text-white border-brand-600' : 'border-gray-200 text-gray-600 hover:border-brand-400'}`}>
                      {DAYS[d.getDay()]} {d.getDate()}/{d.getMonth()+1}
                    </button>
                  );
                })}
              </div>
              {schedForm.dates.length > 0 && (
                <p className="text-xs text-brand-600 mt-2">{schedForm.dates.length} date(s) selected</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Start Time *</label>
                <input type="time" value={schedForm.start_time} onChange={e=>setSchedForm(f=>({...f,start_time:e.target.value}))} required
                  className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Capacity override</label>
                <input type="number" placeholder={`Default: ${showSchedule.capacity}`} value={schedForm.capacity_override}
                  onChange={e=>setSchedForm(f=>({...f,capacity_override:e.target.value}))}
                  className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowSchedule(null)} className="px-4 py-2 text-sm text-gray-600">Cancel</button>
              <button type="submit" className="px-4 py-2 text-sm bg-brand-600 text-white rounded-lg hover:bg-brand-700">Add Sessions</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Roster Modal */}
      {roster && (
        <Modal title={`${roster.session.title} — ${fmt(roster.session.date)}`} onClose={() => setRoster(null)}>
          <p className="text-sm text-gray-500 mb-4">{roster.session.start_time} · {roster.session.instructor} · {roster.confirmed.length}/{roster.session.capacity_override ?? 'default'} confirmed</p>
          <h4 className="text-sm font-semibold mb-2">Confirmed ({roster.confirmed.length})</h4>
          {roster.confirmed.length === 0 ? <p className="text-sm text-gray-400 mb-4">No confirmed bookings</p> : (
            <ul className="mb-4 divide-y">
              {roster.confirmed.map(s => (
                <li key={s.id} className="py-1.5 text-sm flex justify-between">
                  <span>{s.first_name} {s.last_name}</span>
                  <span className="text-gray-400">{s.phone||s.email}</span>
                </li>
              ))}
            </ul>
          )}
          {roster.waitlist.length > 0 && (
            <>
              <h4 className="text-sm font-semibold mb-2 text-yellow-700">Waitlist ({roster.waitlist.length})</h4>
              <ul className="divide-y">
                {roster.waitlist.map(s => (
                  <li key={s.id} className="py-1.5 text-sm flex justify-between">
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
