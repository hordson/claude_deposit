import { useEffect, useState } from 'react';
import api from '../../api';
import { useAuth } from '../../AuthContext';

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.get('/students/me/profile').then(r => { setProfile(r.data); setForm(r.data); });
  }, []);

  const save = async e => {
    e.preventDefault();
    await api.put('/students/me/profile', form);
    setProfile({ ...profile, ...form });
    setEditing(false);
    setMessage('Profile updated!');
  };

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const Field = ({ label, name, type = 'text' }) => (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      {editing
        ? <input type={type} value={form[name] || ''} onChange={set(name)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        : <p className="text-sm text-gray-800">{profile?.[name] || <span className="text-gray-400">Not provided</span>}</p>
      }
    </div>
  );

  if (!profile) return <div className="text-center py-16 text-gray-400">Loading…</div>;

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <div className="bg-white rounded-2xl shadow p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-xl font-bold">
            {profile.first_name?.[0]}{profile.last_name?.[0]}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">{profile.first_name} {profile.last_name}</h2>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>
          {!editing && (
            <button onClick={() => setEditing(true)} className="ml-auto text-sm text-brand-600 hover:underline">Edit</button>
          )}
        </div>

        {message && <div className="bg-green-50 text-green-700 border border-green-200 rounded-lg px-4 py-2 mb-4 text-sm">{message}</div>}

        <form onSubmit={save} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="First Name" name="first_name" />
            <Field label="Last Name" name="last_name" />
          </div>
          <Field label="Phone" name="phone" type="tel" />
          <Field label="Date of Birth" name="date_of_birth" type="date" />
          <div className="border-t pt-4">
            <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">Emergency Contact</p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Name" name="emergency_contact_name" />
              <Field label="Phone" name="emergency_contact_phone" type="tel" />
            </div>
          </div>
          <div className="border-t pt-4">
            <p className="text-xs font-medium text-gray-500 mb-1">Member Since</p>
            <p className="text-sm text-gray-800">{new Date(profile.joined_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          {editing && (
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => { setEditing(false); setForm(profile); }} className="px-4 py-2 text-sm text-gray-600">Cancel</button>
              <button type="submit" className="px-4 py-2 text-sm bg-brand-600 text-white rounded-lg hover:bg-brand-700">Save Changes</button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
