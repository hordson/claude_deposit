import { useEffect, useState } from 'react';
import api from '../../api';

function fmt(ymd) { const [y,m,d]=ymd.split('-').map(Number); return new Date(y,m-1,d).toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'}); }

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [message, setMessage] = useState('');

  const load = () => api.get('/bookings/mine').then(r => setBookings(r.data));
  useEffect(() => { load(); }, []);

  const cancel = async id => {
    if (!confirm('Cancel this booking?')) return;
    await api.delete(`/bookings/${id}`);
    setMessage('Booking cancelled. If you were confirmed, the next waitlisted student has been moved up.');
    load();
  };

  const confirmed = bookings.filter(b => b.status === 'confirmed');
  const waitlisted = bookings.filter(b => b.status === 'waitlist');

  const BookingCard = ({ b }) => (
    <div className="bg-white rounded-xl shadow border border-gray-100 p-4 flex items-center gap-4">
      <div className={`w-2 self-stretch rounded-full ${b.status === 'confirmed' ? 'bg-green-400' : 'bg-yellow-400'}`} />
      <div className="flex-1">
        <h4 className="font-semibold text-gray-800">{b.title}</h4>
        <p className="text-sm text-gray-500">{fmt(b.date)} · {b.start_time} · {b.duration_mins} min</p>
        <p className="text-sm text-gray-500">👤 {b.instructor}</p>
        {b.location && <p className="text-xs text-gray-400">📍 {b.location}</p>}
        {b.status === 'waitlist' && <p className="text-xs text-yellow-600 mt-1 font-medium">⏳ Waitlist position #{b.waitlist_position}</p>}
      </div>
      <button onClick={() => cancel(b.id)} className="text-sm text-red-400 hover:underline ml-2">Cancel</button>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">My Upcoming Bookings</h2>
      {message && <div className="bg-green-50 text-green-700 border border-green-200 rounded-lg px-4 py-3 mb-4 text-sm">{message}</div>}

      {bookings.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          No upcoming bookings. <a href="/calendar" className="text-brand-600 hover:underline">Browse classes →</a>
        </div>
      )}

      {confirmed.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Confirmed ({confirmed.length})</h3>
          <div className="space-y-3">{confirmed.map(b => <BookingCard key={b.id} b={b} />)}</div>
        </div>
      )}
      {waitlisted.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-yellow-600 uppercase tracking-wide mb-3">Waitlist ({waitlisted.length})</h3>
          <div className="space-y-3">{waitlisted.map(b => <BookingCard key={b.id} b={b} />)}</div>
        </div>
      )}
    </div>
  );
}
