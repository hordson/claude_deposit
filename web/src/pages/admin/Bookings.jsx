import { useEffect, useState } from 'react';
import api from '../../api';

function toYMD(date) { return date.toISOString().slice(0, 10); }
function fmt(ymd) { const [y,m,d]=ymd.split('-').map(Number); return new Date(y,m-1,d).toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'}); }

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState(toYMD(new Date()));
  const [to, setTo] = useState(toYMD(new Date(Date.now() + 7 * 86400000)));

  const load = () => api.get('/bookings', { params: { from, to } }).then(r => setBookings(r.data));
  useEffect(() => { load(); }, [from, to]);

  const cancel = async id => {
    if (!confirm('Cancel this booking? If confirmed, the next waitlisted student will be promoted.')) return;
    await api.delete(`/bookings/admin/${id}`); load();
  };

  const filtered = bookings.filter(b => {
    if (filter !== 'all' && b.status !== filter) return false;
    if (search) return `${b.first_name} ${b.last_name} ${b.email} ${b.title}`.toLowerCase().includes(search.toLowerCase());
    return true;
  });

  // Group by session
  const grouped = filtered.reduce((acc, b) => {
    const key = b.session_id;
    if (!acc[key]) acc[key] = { title: b.title, date: b.date, time: b.start_time, instructor: b.instructor, bookings: [] };
    acc[key].bookings.push(b);
    return acc;
  }, {});

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Bookings</h2>

      <div className="flex flex-wrap gap-3 mb-6 items-center">
        <div className="flex items-center gap-2 text-sm">
          <label className="text-gray-500">From</label>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <div className="flex items-center gap-2 text-sm">
          <label className="text-gray-500">To</label>
          <input type="date" value={to} onChange={e => setTo(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <input placeholder="Search student or class…" value={search} onChange={e => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 w-56" />
        {['all','confirmed','waitlist'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium capitalize ${filter===s ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {s}
          </button>
        ))}
      </div>

      {Object.values(grouped).length === 0 && (
        <div className="text-center py-16 text-gray-400">No bookings found for this period</div>
      )}

      <div className="space-y-6">
        {Object.values(grouped).sort((a,b) => a.date.localeCompare(b.date)||a.time.localeCompare(b.time)).map(group => (
          <div key={group.date+group.time+group.title} className="bg-white rounded-xl shadow overflow-hidden">
            <div className="bg-brand-600 text-white px-5 py-3 flex items-center gap-3 flex-wrap">
              <h3 className="font-semibold">{group.title}</h3>
              <span className="text-brand-200 text-sm">{fmt(group.date)} · {group.time} · {group.instructor}</span>
              <span className="ml-auto text-xs bg-white/20 px-2 py-0.5 rounded-full">
                {group.bookings.filter(b=>b.status==='confirmed').length} confirmed
              </span>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-400 text-xs uppercase">
                <tr>{['Student','Email','Status','Booked','Action'].map(h=>(
                  <th key={h} className="px-4 py-2 text-left">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {group.bookings.map(b => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium">{b.first_name} {b.last_name}</td>
                    <td className="px-4 py-2 text-gray-500">{b.email}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${b.status==='confirmed'?'bg-green-100 text-green-700':'bg-yellow-100 text-yellow-700'}`}>
                        {b.status==='waitlist'?`Waitlist #${b.waitlist_position}`:'Confirmed'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-gray-400 text-xs">{new Date(b.booked_at).toLocaleDateString()}</td>
                    <td className="px-4 py-2">
                      <button onClick={() => cancel(b.id)} className="text-xs text-red-400 hover:underline">Cancel</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}
