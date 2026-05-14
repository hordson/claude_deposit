import { useEffect, useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useAuth } from '../AuthContext';
import api from '../api';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/students/me/profile').then(r => { setProfile(r.data); setForm(r.data); setLoading(false); });
  }, []);

  const save = async () => {
    await api.put('/students/me/profile', form);
    setProfile({ ...profile, ...form });
    setEditing(false);
    Alert.alert('Saved', 'Profile updated!');
  };

  const set = k => v => setForm(f => ({ ...f, [k]: v }));

  const Field = ({ label, name, keyboard = 'default' }) => (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.label}>{label}</Text>
      {editing
        ? <TextInput style={styles.input} value={form[name] || ''} onChangeText={set(name)} keyboardType={keyboard} autoCapitalize="none" />
        : <Text style={styles.value}>{profile?.[name] || <Text style={{ color: '#aaa' }}>Not provided</Text>}</Text>
      }
    </View>
  );

  if (loading) return <View style={styles.center}><ActivityIndicator color="#7e22ce" size="large" /></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      {/* Avatar */}
      <View style={styles.avatarRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{profile?.first_name?.[0]}{profile?.last_name?.[0]}</Text>
        </View>
        <View>
          <Text style={styles.name}>{profile?.first_name} {profile?.last_name}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Personal Info</Text>
          {!editing && <TouchableOpacity onPress={() => setEditing(true)}><Text style={styles.editBtn}>Edit</Text></TouchableOpacity>}
        </View>
        <Field label="Phone" name="phone" keyboard="phone-pad" />
        <Field label="Date of Birth" name="date_of_birth" />
        <Text style={styles.sectionLabel}>Emergency Contact</Text>
        <Field label="Name" name="emergency_contact_name" />
        <Field label="Phone" name="emergency_contact_phone" keyboard="phone-pad" />
        <View style={{ marginBottom: 8 }}>
          <Text style={styles.label}>Member Since</Text>
          <Text style={styles.value}>{profile?.joined_at ? new Date(profile.joined_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : '—'}</Text>
        </View>
        {editing && (
          <View style={styles.editButtons}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => { setEditing(false); setForm(profile); }}>
              <Text style={{ color: '#555' }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={save}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Save</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={() => Alert.alert('Log Out', 'Are you sure?', [
        { text: 'Cancel' },
        { text: 'Log Out', style: 'destructive', onPress: logout }
      ])}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20, marginTop: 8 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#ede9fe', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 20, fontWeight: 'bold', color: '#7e22ce' },
  name: { fontSize: 18, fontWeight: 'bold', color: '#1a1a1a' },
  email: { fontSize: 13, color: '#888', marginTop: 2 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1a1a1a' },
  editBtn: { color: '#7e22ce', fontWeight: '600', fontSize: 14 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#7e22ce', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, marginTop: 4 },
  label: { fontSize: 12, color: '#888', marginBottom: 2, fontWeight: '500' },
  value: { fontSize: 15, color: '#1a1a1a' },
  input: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 10, fontSize: 15, color: '#1a1a1a', backgroundColor: '#fafafa' },
  editButtons: { flexDirection: 'row', gap: 10, marginTop: 8 },
  cancelBtn: { flex: 1, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#ddd', alignItems: 'center' },
  saveBtn: { flex: 1, padding: 12, borderRadius: 10, backgroundColor: '#7e22ce', alignItems: 'center' },
  logoutBtn: { backgroundColor: '#fee2e2', padding: 14, borderRadius: 12, alignItems: 'center', marginBottom: 32 },
  logoutText: { color: '#b91c1c', fontWeight: '600', fontSize: 15 },
});
