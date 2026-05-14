import { useEffect, useState } from 'react';
import api from '../../api';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get('/students'),
      api.get('/classes'),
      api.get('/bookings'),
    ]).then(([s, c, b]) => {
      const students = s.data;
      const classes = c.data;
      const bookings = b.data;
      setStats({
        totalStudents: students.length,
        activeStudents: students.filter(s => s.active).length,
        totalClasses: classes.length,
        totalBookings: bookings.filter(b => b.status === 'confirmed').length,
        waitlisted: bookings.filter(b => b.status === 'waitlist').length,
      });
    }).catch(console.error);
  }, []);

  const Card = ({ label, value, color }) => (
    <div className={`bg-white rounded-xl shadow p-6 border-l-4 ${color}`}>
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className="text-4xl font-bold text-gray-800">{value ?? '—'}</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Admin Dashboard</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card label="Total Students" value={stats?.totalStudents} color="border-brand-500" />
        <Card label="Active Students" value={stats?.activeStudents} color="border-green-500" />
        <Card label="Weekly Classes" value={stats?.totalClasses} color="border-blue-500" />
        <Card label="Confirmed Bookings" value={stats?.totalBookings} color="border-indigo-500" />
      </div>
      {stats?.waitlisted > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-yellow-800 text-sm">
          ⏳ <strong>{stats.waitlisted}</strong> student{stats.waitlisted > 1 ? 's' : ''} currently on waitlist across all classes.
        </div>
      )}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { title: 'Manage Students', desc: 'View profiles, add or deactivate students', href: '/admin/students', color: 'bg-brand-600' },
          { title: 'Manage Classes', desc: 'Add weekly classes, set capacity and schedule', href: '/admin/classes', color: 'bg-blue-600' },
          { title: 'View Bookings', desc: 'See all bookings and class rosters', href: '/admin/bookings', color: 'bg-indigo-600' },
        ].map(card => (
          <a key={card.href} href={card.href}
            className={`${card.color} text-white rounded-xl p-6 hover:opacity-90 transition block`}>
            <h3 className="text-lg font-semibold mb-1">{card.title}</h3>
            <p className="text-sm opacity-80">{card.desc}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
