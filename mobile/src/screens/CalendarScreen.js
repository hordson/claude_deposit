import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, ActivityIndicator, Alert } from 'react-native';
import api from '../api';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function CalendarScreen() {
  const [classes, setClasses] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [selectedDay, setSelectedDay] = useState(new Date().getDay());
  const [bookingTarget, setBookingTarget] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [cls, bk] = await Promise.all([api.get('/classes'), api.get('/bookings/mine')]);
    setClasses(cls.data);
    setMyBookings(bk.data);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const isBooked = id => myBookings.find(b => b.class_id === id);

  const book = async cls => {
    try {
      const { data } = await api.post('/bookings', { class_id: cls.id });
      Alert.alert('Success', data.message);
      setBookingTarget(null);
      load();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Booking failed');
    }
  };

  const cancel = async classId => {
    const b = myBookings.find(b => b.class_id === classId);
    if (!b) return;
    Alert.alert('Cancel Booking', 'Are you sure?', [
      { text: 'No' },
      { text: 'Yes', style: 'destructive', onPress: async () => { await api.delete(`/bookings/${b.id}`); load(); } }
    ]);
  };

  const daysWithClasses = [...new Set(classes.map(c => c.day_of_week))].sort();
  const dayClasses = classes.filter(c => c.day_of_week === selectedDay).sort((a, b) => a.start_time.localeCompare(b.start_time));

  if (loading) return <View style={styles.center}><ActivityIndicator color="#7e22ce" size="large" /></View>;

  return (
    <View style={styles.container}>
      {/* Day tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayTabs} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}>
        {DAYS.map((day, i) => {
          const has = daysWithClasses.includes(i);
          const selected = selectedDay === i;
          return (
            <TouchableOpacity key={i} onPress={() => has && setSelectedDay(i)} disabled={!has}
              style={[styles.dayTab, selected && styles.dayTabActive, !has && styles.dayTabDisabled]}>
              <Text style={[styles.dayTabText, selected && styles.dayTabTextActive, !has && { color: '#ccc' }]}>
                {day.slice(0, 3)}
              </Text>
              {has && <View style={[styles.dot, selected && styles.dotActive]} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={styles.dayHeading}>{DAYS[selectedDay]}</Text>
        {dayClasses.length === 0 && <Text style={styles.empty}>No classes this day</Text>}
        {dayClasses.map(cls => {
          const booked = isBooked(cls.id);
          const full = cls.booked_count >= cls.capacity;
          return (
            <View key={cls.id} style={[styles.card, booked && styles.cardBooked]}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{cls.title}</Text>
                <Text style={[styles.badge, full ? styles.badgeFull : styles.badgeOpen]}>
                  {full ? `Full · ${cls.waitlist_count} wait` : `${cls.capacity - cls.booked_count} left`}
                </Text>
              </View>
              <Text style={styles.cardMeta}>🕐 {cls.start_time} · {cls.duration_mins} min</Text>
              <Text style={styles.cardMeta}>👤 {cls.instructor}</Text>
              {cls.location ? <Text style={styles.cardMeta}>📍 {cls.location}</Text> : null}
              {booked ? (
                <View style={styles.cardFooter}>
                  <Text style={styles.bookedText}>{booked.status === 'waitlist' ? `⏳ Waitlist #${booked.waitlist_position}` : '✓ Booked'}</Text>
                  <TouchableOpacity onPress={() => cancel(cls.id)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.bookBtn} onPress={() => setBookingTarget(cls)}>
                  <Text style={styles.bookBtnText}>{full ? 'Join Waitlist' : 'Book Class'}</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Confirm modal */}
      <Modal visible={!!bookingTarget} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{bookingTarget?.title}</Text>
            <Text style={styles.modalMeta}>{DAYS[bookingTarget?.day_of_week]} · {bookingTarget?.start_time} · {bookingTarget?.instructor}</Text>
            {bookingTarget?.booked_count >= bookingTarget?.capacity &&
              <Text style={{ color: '#d97706', marginBottom: 12 }}>This class is full — you'll join the waitlist.</Text>}
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setBookingTarget(null)}>
                <Text style={{ color: '#555' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={() => book(bookingTarget)}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>
                  {bookingTarget?.booked_count >= bookingTarget?.capacity ? 'Join Waitlist' : 'Confirm'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  dayTabs: { backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee' },
  dayTab: { alignItems: 'center', paddingHorizontal: 14, paddingVertical: 4, marginRight: 4, borderRadius: 20 },
  dayTabActive: { backgroundColor: '#7e22ce' },
  dayTabDisabled: { opacity: 0.4 },
  dayTabText: { fontSize: 13, fontWeight: '600', color: '#555' },
  dayTabTextActive: { color: '#fff' },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#7e22ce', marginTop: 3 },
  dotActive: { backgroundColor: '#fff' },
  dayHeading: { fontSize: 20, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 12 },
  empty: { color: '#aaa', textAlign: 'center', marginTop: 40 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: '#86efac', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardBooked: { borderLeftColor: '#a855f7' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1a1a1a', flex: 1 },
  badge: { fontSize: 11, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, fontWeight: '600', overflow: 'hidden' },
  badgeOpen: { backgroundColor: '#dcfce7', color: '#15803d' },
  badgeFull: { backgroundColor: '#fef9c3', color: '#a16207' },
  cardMeta: { fontSize: 13, color: '#666', marginBottom: 2 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  bookedText: { fontSize: 13, color: '#7e22ce', fontWeight: '600' },
  cancelText: { fontSize: 13, color: '#ef4444' },
  bookBtn: { backgroundColor: '#7e22ce', borderRadius: 10, padding: 12, alignItems: 'center', marginTop: 10 },
  bookBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 6 },
  modalMeta: { fontSize: 14, color: '#666', marginBottom: 16 },
  modalButtons: { flexDirection: 'row', gap: 12 },
  modalCancel: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#ddd', alignItems: 'center' },
  modalConfirm: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#7e22ce', alignItems: 'center' },
});
