import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', first_name: '', last_name: '', phone: '', emergency_contact_name: '', emergency_contact_phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = key => e => setForm(f => ({ ...f, [key]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await register(form);
      navigate('/calendar');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally { setLoading(false); }
  };

  const Field = ({ label, name, type = 'text', required = false }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}{required && <span className="text-red-500 ml-1">*</span>}</label>
      <input type={type} required={required} value={form[name]} onChange={set(name)}
        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500" />
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 to-purple-100 py-10">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-8">
        <h1 className="text-3xl font-bold text-brand-700 mb-2">Join the studio</h1>
        <p className="text-gray-500 mb-6">Create your student account</p>
        {error && <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-3 mb-4 text-sm">{error}</div>}
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="First Name" name="first_name" required />
            <Field label="Last Name" name="last_name" required />
          </div>
          <Field label="Email" name="email" type="email" required />
          <Field label="Password" name="password" type="password" required />
          <Field label="Phone" name="phone" type="tel" />
          <div className="border-t pt-4">
            <p className="text-sm font-medium text-gray-600 mb-3">Emergency Contact</p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Name" name="emergency_contact_name" />
              <Field label="Phone" name="emergency_contact_phone" type="tel" />
            </div>
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-50">
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account? <Link to="/login" className="text-brand-600 font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
