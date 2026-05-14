import { useEffect, useState } from 'react';
import api from '../../api';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const emptyForm = { email: '', password: '', first_name: '', last_name: '', phone: '', date_of_birth: '', emergency_contact_name: '', emergency_contact_phone: '', notes: '' };

export default function AdminStudents() {
  const [students, setStudents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const load = () => api.get('/students').then(r => setStudents(r.data));
  useEffect(() => { load(); }, []);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const addStudent = async e => {
    e.preventDefault(); setError('');
    try {
      await api.post('/students', form);
      setShowAdd(false); setForm(emptyForm); load();
    } catch (err) { setError(err.response?.data?.error || 'Failed'); }
  };

  const updateStudent = async e => {
    e.preventDefault(); setError('');
    try {
      await api.put(`/students/${selected.id}`, selected);
      load(); setSelected(null);
    } catch (err) { setError(err.response?.data?.error || 'Failed'); }
  };

  const toggleActive = async (student) => {
    await api.put(`/students/${student.id}`, { active: student.active ? 0 : 1 });
    load();
  };

  const filtered = students.filter(s =>
    `${s.first_name} ${s.last_name} ${s.email}`.toLowerCase().includes(search.toLowerCase())
  );

  const Field = ({ label, name, type = 'text', obj, setObj, required = false }) => (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input type={type} required={required} value={obj[name] || ''} onChange={e => setObj(o => ({ ...o, [name]: e.target.value }))}
        className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Students</h2>
        <button onClick={() => setShowAdd(true)} className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700">
          + Add Student
        </button>
      </div>

      <input placeholder="Search by name or email…" value={search} onChange={e => setSearch(e.target.value)}
        className="w-full max-w-sm border border-gray-300 rounded-lg px-4 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-brand-500" />

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
            <tr>
              {['Name', 'Email', 'Phone', 'Bookings', 'Status', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map(s => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{s.first_name} {s.last_name}</td>
                <td className="px-4 py-3 text-gray-500">{s.email}</td>
                <td className="px-4 py-3 text-gray-500">{s.phone || '—'}</td>
                <td className="px-4 py-3">{s.total_bookings}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {s.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 flex gap-2">
                  <button onClick={() => setSelected({ ...s })} className="text-brand-600 hover:underline text-xs">Edit</button>
                  <button onClick={() => toggleActive(s)} className="text-gray-400 hover:text-gray-700 text-xs">
                    {s.active ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="text-center py-8 text-gray-400">No students found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Student Modal */}
      {showAdd && (
        <Modal title="Add Student" onClose={() => { setShowAdd(false); setError(''); }}>
          {error && <div className="text-red-600 text-sm mb-3">{error}</div>}
          <form onSubmit={addStudent} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="First Name *" name="first_name" obj={form} setObj={setForm} required />
              <Field label="Last Name *" name="last_name" obj={form} setObj={setForm} required />
            </div>
            <Field label="Email *" name="email" type="email" obj={form} setObj={setForm} required />
            <Field label="Password *" name="password" type="password" obj={form} setObj={setForm} required />
            <Field label="Phone" name="phone" type="tel" obj={form} setObj={setForm} />
            <Field label="Date of Birth" name="date_of_birth" type="date" obj={form} setObj={setForm} />
            <div className="border-t pt-3">
              <p className="text-xs text-gray-500 mb-2">Emergency Contact</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Name" name="emergency_contact_name" obj={form} setObj={setForm} />
                <Field label="Phone" name="emergency_contact_phone" type="tel" obj={form} setObj={setForm} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
              <textarea value={form.notes} onChange={set('notes')} rows={2}
                className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
              <button type="submit" className="px-4 py-2 text-sm bg-brand-600 text-white rounded-lg hover:bg-brand-700">Add Student</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Student Modal */}
      {selected && (
        <Modal title={`Edit: ${selected.first_name} ${selected.last_name}`} onClose={() => { setSelected(null); setError(''); }}>
          {error && <div className="text-red-600 text-sm mb-3">{error}</div>}
          <form onSubmit={updateStudent} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="First Name" name="first_name" obj={selected} setObj={setSelected} />
              <Field label="Last Name" name="last_name" obj={selected} setObj={setSelected} />
            </div>
            <Field label="Phone" name="phone" type="tel" obj={selected} setObj={setSelected} />
            <Field label="Date of Birth" name="date_of_birth" type="date" obj={selected} setObj={setSelected} />
            <div className="border-t pt-3">
              <p className="text-xs text-gray-500 mb-2">Emergency Contact</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Name" name="emergency_contact_name" obj={selected} setObj={setSelected} />
                <Field label="Phone" name="emergency_contact_phone" type="tel" obj={selected} setObj={setSelected} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
              <textarea value={selected.notes || ''} onChange={e => setSelected(s => ({ ...s, notes: e.target.value }))} rows={2}
                className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            {selected.bookings && (
              <div className="border-t pt-3">
                <p className="text-xs text-gray-500 font-medium mb-2">Current Bookings</p>
                {selected.bookings.length === 0 ? <p className="text-xs text-gray-400">No bookings</p> : (
                  <ul className="space-y-1">
                    {selected.bookings.map(b => (
                      <li key={b.id} className="text-xs text-gray-600 flex justify-between">
                        <span>{b.title} — {DAYS[b.day_of_week]} {b.start_time}</span>
                        <span className={`px-1.5 rounded text-xs ${b.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{b.status}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setSelected(null)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
              <button type="submit" className="px-4 py-2 text-sm bg-brand-600 text-white rounded-lg hover:bg-brand-700">Save Changes</button>
            </div>
          </form>
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
