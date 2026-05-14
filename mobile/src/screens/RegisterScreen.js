import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useAuth } from '../AuthContext';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [form, setForm] = useState({ email: '', password: '', first_name: '', last_name: '', phone: '', emergency_contact_name: '', emergency_contact_phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = k => v => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    setError(''); setLoading(true);
    try {
      await register(form);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed.');
    } finally { setLoading(false); }
  };

  const Field = ({ label, name, keyboard = 'default', secure = false }) => (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={styles.input} value={form[name]} onChangeText={set(name)}
        keyboardType={keyboard} secureTextEntry={secure} autoCapitalize="none" placeholderTextColor="#aaa" placeholder={label} />
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 24, paddingTop: 60 }}>
      <Text style={styles.title}>Create Account</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}><Field label="First Name" name="first_name" /></View>
        <View style={{ flex: 1 }}><Field label="Last Name" name="last_name" /></View>
      </View>
      <Field label="Email" name="email" keyboard="email-address" />
      <Field label="Password" name="password" secure />
      <Field label="Phone" name="phone" keyboard="phone-pad" />
      <Text style={styles.sectionLabel}>Emergency Contact</Text>
      <Field label="Contact Name" name="emergency_contact_name" />
      <Field label="Contact Phone" name="emergency_contact_phone" keyboard="phone-pad" />
      <TouchableOpacity style={styles.button} onPress={submit} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create Account</Text>}
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.link}>Already have an account? <Text style={styles.linkBold}>Sign in</Text></Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#faf5ff' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#7e22ce', marginBottom: 20 },
  error: { backgroundColor: '#fee2e2', color: '#b91c1c', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 14 },
  label: { fontSize: 13, color: '#555', marginBottom: 4, fontWeight: '500' },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 12, fontSize: 15, color: '#1a1a1a' },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: '#7e22ce', marginTop: 8, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  button: { backgroundColor: '#7e22ce', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8, marginBottom: 16 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  link: { textAlign: 'center', color: '#888', fontSize: 14 },
  linkBold: { color: '#7e22ce', fontWeight: '600' },
});
