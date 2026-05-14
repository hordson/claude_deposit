import { useEffect, useState } from 'react';
import api from '../../api';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function Calendar() {
  const [classes, setClasses] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [selectedDay, setSelectedDay] = useState(new Date().getDay());
  const [booking, setBooking] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    const [cls, bk] = await Promise.all([api.get('/classes'), api.get('/bookings/mine')]);
    setClasses(cls.data);
    setMyBookings(bk.data);
  };
  useEffect(() => { load(); }, []);

  const isBooked = classId => myBookings.find(b => b.class_id === classId);

  const book = async cls => {
    setError(''); setMessage('');
    try {
      const { data } = await api.post('/bookings', { class_id: cls.id });
      setMessage(data.message);
      setBooking(null);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Booking failed');
    }
  };

  const cancel = async classId => {
    const b = myBookings.find(b => b.class_id === classId);
    if (!b) return;
    if (!confirm('Cancel this booking?')) return;
    await api.delete(`/bookings/${b.id}`);
    setMessage('Booking cancelled.');
    load();
  };

  const daysWithClasses = [...new Set(classes.map(c => c.day_of_week))].sort();

  const dayClasses = classes.filter(c => c.day_of_week === selectedDay).sort((a, b) => a.start_time.localeCompare(b.start_time));

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Weekly Class Schedule</h2>
      <p className="text-gray-500 text-sm mb-6">Browse and book your classes for the week</p>

      {message && <div className="bg-green-50 text-green-700 border border-green-200 rounded-lg px-4 py-3 mb-4 text-sm">{message}</div>}
      {error && <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-3 mb-4 text-sm">{error}</div>}

      {/* Day selector */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {DAYS.map((day, i) => {
          const hasCls = daysWithClasses.includes(i);
          const isSelected = selectedDay === i;
          return (
            <button key={i} onClick={() => setSelectedDay(i)} disabled={!hasCls}
              className={`flex flex-col items-center px-4 py-3 rounded-xl min-w-[72px] transition font-medium
                ${isSelected ? 'bg-brand-600 text-white shadow' : hasCls ? 'bg-white text-gray-700 border border-gray-200 hover:border-brand-400' : 'bg-gray-50 text-gray-300 cursor-not-allowed'}`}>
              <span className="text-xs mb-0.5">{SHORT_DAYS[i]}</span>
              {hasCls && (
                <span className={`text-xs rounded-full w-5 h-5 flex items-center justify-center ${isSelected ? 'bg-white/20' : 'bg-brand-100 text-brand-700'}`}>
                  {classes.filter(c => c.day_of_week === i).length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Class cards */}
      <h3 className="text-lg font-semibold text-gray-700 mb-4">{DAYS[selectedDay]}</h3>
      {dayClasses.length === 0 ? (
        <div className="text-center py-16 text-gray-400">No classes on {DAYS[selectedDay]}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dayClasses.map(cls => {
            const existingBooking = isBooked(cls.id);
            const isFull = cls.booked_count >= cls.capacity;
            return (
              <div key={cls.id} className={`bg-white rounded-xl shadow border-l-4 p-5 ${existingBooking ? 'border-brand-500' : isFull ? 'border-yellow-400' : 'border-green-400'}`}>
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-gray-800 text-lg">{cls.title}</h4>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${isFull ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                    {isFull ? `Full · ${cls.waitlist_count} waitlisted` : `${cls.capacity - cls.booked_count} spots left`}
                  </span>
                </div>
                {cls.description && <p className="text-sm text-gray-500 mb-2">{cls.description}</p>}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 mb-4">
                  <span>🕐 {cls.start_time} · {cls.duration_mins} min</span>
                  <span>👤 {cls.instructor}</span>
                  {cls.location && <span>📍 {cls.location}</span>}
                </div>

                {existingBooking ? (
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${existingBooking.status === 'waitlist' ? 'text-yellow-600' : 'text-green-600'}`}>
                      {existingBooking.status === 'waitlist' ? `⏳ Waitlist #${existingBooking.waitlist_position}` : '✓ Booked'}
                    </span>
                    <button onClick={() => cancel(cls.id)} className="text-sm text-red-400 hover:underline">Cancel</button>
                  </div>
                ) : (
                  <button onClick={() => setBooking(cls)}
                    className="w-full bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium py-2 rounded-lg transition">
                    {isFull ? 'Join Waitlist' : 'Book Class'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Confirm booking modal */}
      {booking && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <h3 className="text-lg font-semibold mb-1">{booking.title}</h3>
            <p className="text-sm text-gray-500 mb-4">
              {DAYS[booking.day_of_week]} · {booking.start_time} · {booking.instructor}
              {booking.booked_count >= booking.capacity && <span className="block text-yellow-600 mt-1">This class is full — you'll be added to the waitlist.</span>}
            </p>
            {error && <div className="text-red-600 text-sm mb-3">{error}</div>}
            <div className="flex gap-3">
              <button onClick={() => { setBooking(null); setError(''); }} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={() => book(booking)} className="flex-1 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700">
                {booking.booked_count >= booking.capacity ? 'Join Waitlist' : 'Confirm Booking'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
