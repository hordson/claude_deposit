import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import api from '../api';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function MyBookingsScreen() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => api.get('/bookings/mine').then(r => { setBookings(r.data); setLoading(false); });
  useEffect(() => { load(); }, []);

  const cancel = id => {
    Alert.alert('Cancel Booking', 'Are you sure you want to cancel?', [
      { text: 'No' },
      { text: 'Yes', style: 'destructive', onPress: async () => { await api.delete(`/bookings/${id}`); load(); } }
    ]);
  };

  const confirmed = bookings.filter(b => b.status === 'confirmed');
  const waitlisted = bookings.filter(b => b.status === 'waitlist');

  if (loading) return <View style={styles.center}><ActivityIndicator color="#7e22ce" size="large" /></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.heading}>My Bookings</Text>
      {bookings.length === 0 && <Text style={styles.empty}>No bookings yet. Head to the Calendar tab to book a class!</Text>}

      {confirmed.length > 0 && (
        <>
          <Text style={styles.sectionLabel}>Confirmed ({confirmed.length})</Text>
          {confirmed.map(b => <BookingCard key={b.id} b={b} onCancel={() => cancel(b.id)} />)}
        </>
      )}
      {waitlisted.length > 0 && (
        <>
          <Text style={[styles.sectionLabel, { color: '#d97706' }]}>Waitlist ({waitlisted.length})</Text>
          {waitlisted.map(b => <BookingCard key={b.id} b={b} onCancel={() => cancel(b.id)} />)}
        </>
      )}
    </ScrollView>
  );
}

function BookingCard({ b, onCancel }) {
  return (
    <View style={[styles.card, b.status === 'confirmed' ? styles.cardConfirmed : styles.cardWait]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardTitle}>{b.title}</Text>
        <Text style={styles.cardMeta}>{DAYS[b.day_of_week]} · {b.start_time} · {b.duration_mins} min</Text>
        <Text style={styles.cardMeta}>👤 {b.instructor}</Text>
        {b.status === 'waitlist' && <Text style={styles.waitText}>⏳ Waitlist position #{b.waitlist_position}</Text>}
      </View>
      <TouchableOpacity onPress={onCancel} style={styles.cancelBtn}>
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  heading: { fontSize: 22, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 16 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#7e22ce', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 8 },
  empty: { color: '#aaa', textAlign: 'center', marginTop: 40, lineHeight: 22 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', borderLeftWidth: 4, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  cardConfirmed: { borderLeftColor: '#86efac' },
  cardWait: { borderLeftColor: '#fcd34d' },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 3 },
  cardMeta: { fontSize: 13, color: '#666', marginBottom: 1 },
  waitText: { fontSize: 12, color: '#d97706', marginTop: 4, fontWeight: '600' },
  cancelBtn: { paddingHorizontal: 10, paddingVertical: 6 },
  cancelText: { color: '#ef4444', fontSize: 13, fontWeight: '500' },
});
