import { useEffect, useState } from 'react';
import api from '../../api';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const FULL_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function startOfWeek(date) {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function toYMD(date) {
  return date.toISOString().slice(0, 10);
}

function fmt(dateStr) {
  // dateStr = YYYY-MM-DD, parse as local date
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function Calendar() {
  const thisWeek = startOfWeek(new Date());
  const nextWeek = addDays(thisWeek, 7);

  const [weekStart, setWeekStart] = useState(thisWeek);
  const [sessions, setSessions] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [selectedDay, setSelectedDay] = useState(new Date().getDay());
  const [bookingTarget, setBookingTarget] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const isThisWeek = toYMD(weekStart) === toYMD(thisWeek);
  const isNextWeek = toYMD(weekStart) === toYMD(nextWeek);

  const weekEnd = addDays(weekStart, 6);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  useEffect(() => {
    const from = toYMD(weekStart);
    const to = toYMD(weekEnd);
    Promise.all([
      api.get('/classes/sessions', { params: { from, to } }),
      api.get('/bookings/mine'),
    ]).then(([s, b]) => {
      setSessions(s.data);
      setMyBookings(b.data);
    });
  }, [weekStart]);

  const isBooked = sessionId => myBookings.find(b => b.session_id === sessionId);

  const book = async session => {
    setError(''); setMessage('');
    try {
      const { data } = await api.post('/bookings', { session_id: session.id });
      setMessage(data.message);
      setBookingTarget(null);
      // Refresh
      const from = toYMD(weekStart);
      const to = toYMD(weekEnd);
      Promise.all([api.get('/classes/sessions', { params: { from, to } }), api.get('/bookings/mine')])
        .then(([s, b]) => { setSessions(s.data); setMyBookings(b.data); });
    } catch (err) {
      setError(err.response?.data?.error || 'Booking failed');
    }
  };

  const cancel = async sessionId => {
    const b = myBookings.find(b => b.session_id === sessionId);
    if (!b || !confirm('Cancel this booking?')) return;
    await api.delete(`/bookings/${b.id}`);
    setMessage('Booking cancelled.');
    const from = toYMD(weekStart);
    const to = toYMD(weekEnd);
    Promise.all([api.get('/classes/sessions', { params: { from, to } }), api.get('/bookings/mine')])
      .then(([s, b]) => { setSessions(s.data); setMyBookings(b.data); });
  };

  const prevWeek = () => { if (!isThisWeek) setWeekStart(w => addDays(w, -7)); };
  const goNextWeek = () => { if (!isNextWeek) setWeekStart(w => addDays(w, 7)); };
  const goToday  = () => { setWeekStart(thisWeek); setSelectedDay(new Date().getDay()); };

  const selectedDate = toYMD(weekDays[selectedDay]);
  const dayClasses = sessions.filter(s => s.date === selectedDate).sort((a, b) => a.start_time.localeCompare(b.start_time));

  const weekLabel = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Class Schedule</h2>
        <button onClick={goToday} className="text-sm text-brand-600 hover:underline">Today</button>
      </div>

      {message && <div className="bg-green-50 text-green-700 border border-green-200 rounded-lg px-4 py-3 mb-4 text-sm">{message}</div>}
      {error   && <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-3 mb-4 text-sm">{error}</div>}

      {/* Week navigator */}
      <div className="flex items-center justify-between mb-4 bg-white rounded-xl shadow px-4 py-3">
        <button onClick={prevWeek} disabled={isThisWeek}
          className={`text-xl px-2 ${isThisWeek ? 'text-gray-200 cursor-not-allowed' : 'text-gray-400 hover:text-brand-600'}`}>‹</button>
        <div className="text-center">
          <span className="text-sm font-semibold text-gray-700">{weekLabel}</span>
          <p className="text-xs text-brand-600 font-medium">{isThisWeek ? 'This Week' : 'Next Week'}</p>
        </div>
        <button onClick={goNextWeek} disabled={isNextWeek}
          className={`text-xl px-2 ${isNextWeek ? 'text-gray-200 cursor-not-allowed' : 'text-gray-400 hover:text-brand-600'}`}>›</button>
      </div>

      {/* Day tabs */}
      <div className="grid grid-cols-7 gap-1 mb-6">
        {weekDays.map((day, i) => {
          const ymd = toYMD(day);
          const count = sessions.filter(s => s.date === ymd).length;
          const isToday = ymd === toYMD(new Date());
          const isSelected = selectedDay === i;
          return (
            <button key={i} onClick={() => setSelectedDay(i)}
              className={`flex flex-col items-center py-2 rounded-xl transition
                ${isSelected ? 'bg-brand-600 text-white shadow' : 'bg-white text-gray-600 hover:border-brand-300 border border-gray-100'}`}>
              <span className="text-xs font-medium">{DAYS[i]}</span>
              <span className={`text-lg font-bold ${isToday && !isSelected ? 'text-brand-600' : ''}`}>{day.getDate()}</span>
              {count > 0 && (
                <span className={`text-xs px-1.5 rounded-full mt-0.5 ${isSelected ? 'bg-white/30 text-white' : 'bg-brand-100 text-brand-700'}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Classes for selected day */}
      <h3 className="text-lg font-semibold text-gray-700 mb-3">
        {FULL_DAYS[selectedDay]}, {fmt(selectedDate)}
      </h3>

      {dayClasses.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-white rounded-xl">No classes scheduled this day</div>
      ) : (
        <div className="space-y-4">
          {dayClasses.map(session => {
            const booked = isBooked(session.id);
            const full = session.booked_count >= session.capacity;
            return (
              <div key={session.id} className={`bg-white rounded-xl shadow border-l-4 p-5 ${booked ? 'border-brand-500' : full ? 'border-yellow-400' : 'border-green-400'}`}>
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-gray-800 text-lg">{session.title}</h4>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${full ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                    {full ? `Full · ${session.waitlist_count} waiting` : `${session.capacity - session.booked_count} spots left`}
                  </span>
                </div>
                {session.description && <p className="text-sm text-gray-500 mb-2">{session.description}</p>}
                <div className="flex flex-wrap gap-x-4 text-sm text-gray-500 mb-4">
                  <span>🕐 {session.start_time} · {session.duration_mins} min</span>
                  <span>👤 {session.instructor}</span>
                  {session.location && <span>📍 {session.location}</span>}
                </div>

                {booked ? (
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${booked.status === 'waitlist' ? 'text-yellow-600' : 'text-green-600'}`}>
                      {booked.status === 'waitlist' ? `⏳ Waitlist #${booked.waitlist_position}` : '✓ Booked'}
                    </span>
                    <button onClick={() => cancel(session.id)} className="text-sm text-red-400 hover:underline">Cancel</button>
                  </div>
                ) : (
                  <button onClick={() => setBookingTarget(session)}
                    className="w-full bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium py-2 rounded-lg transition">
                    {full ? 'Join Waitlist' : 'Book Class'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Confirm modal */}
      {bookingTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <h3 className="text-lg font-semibold mb-1">{bookingTarget.title}</h3>
            <p className="text-sm text-gray-500 mb-1">{fmt(bookingTarget.date)} · {bookingTarget.start_time}</p>
            <p className="text-sm text-gray-500 mb-4">👤 {bookingTarget.instructor}</p>
            {bookingTarget.booked_count >= bookingTarget.capacity && (
              <p className="text-yellow-600 text-sm mb-4">This class is full — you'll be added to the waitlist.</p>
            )}
            {error && <div className="text-red-600 text-sm mb-3">{error}</div>}
            <div className="flex gap-3">
              <button onClick={() => { setBookingTarget(null); setError(''); }}
                className="flex-1 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={() => book(bookingTarget)}
                className="flex-1 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700">
                {bookingTarget.booked_count >= bookingTarget.capacity ? 'Join Waitlist' : 'Confirm Booking'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
