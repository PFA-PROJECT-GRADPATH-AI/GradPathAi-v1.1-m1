import { useState } from 'react';
import { auth } from '../api/client';

export default function AuthPage({ onAuthenticated }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ email: '', password: '', fullName: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Client-side quick checks
    if (mode === 'register' && (!form.fullName || form.fullName.trim().length < 2)) {
      setError('Please provide your full legal name.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must contain at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      let user;
      if (mode === 'register') {
        user = await auth.register({
          email: form.email.trim(),
          password: form.password,
          fullName: form.fullName.trim()
        });
      } else {
        user = await auth.login({
          email: form.email.trim(),
          password: form.password
        });
      }
      onAuthenticated(user);
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const user = await auth.login({ email: 'demo@gradpath.ai', password: 'Demo@123' });
      onAuthenticated(user);
    } catch (err) {
      setError(err.message || 'Demo student sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-wrapper">
        {/* Brand header */}
        <div className="auth-brand">
          <div className="brand-icon">🎓</div>
          <h1>GradPath AI</h1>
          <p className="brand-tagline">Intelligent Graduate School Admissions &amp; Profile Studio</p>
        </div>

        {/* Card */}
        <div className="auth-card">
          <div className="tab-pill-container">
            <button
              type="button"
              className={`pill-tab ${mode === 'login' ? 'active' : ''}`}
              onClick={() => { setMode('login'); setError(''); }}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`pill-tab ${mode === 'register' ? 'active' : ''}`}
              onClick={() => { setMode('register'); setError(''); }}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div className="alert alert-error" role="alert">
              <span className="alert-icon">⚠️</span>
              <div className="alert-message">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {mode === 'register' && (
              <div className="field-group">
                <label htmlFor="reg-name">Full Legal Name</label>
                <div className="input-affix">
                  <span className="affix-icon">👤</span>
                  <input
                    id="reg-name"
                    name="fullName"
                    type="text"
                    value={form.fullName}
                    onChange={handleChange}
                    placeholder="e.g. Sarah Jenkins"
                    required
                  />
                </div>
              </div>
            )}

            <div className="field-group">
              <label htmlFor="auth-email">University or Personal Email</label>
              <div className="input-affix">
                <span className="affix-icon">✉️</span>
                <input
                  id="auth-email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="student@university.edu"
                  required
                />
              </div>
            </div>

            <div className="field-group">
              <div className="field-header">
                <label htmlFor="auth-password">Password</label>
                {mode === 'register' && (
                  <span className="field-hint">Min. 6 characters &amp; 1 digit</span>
                )}
              </div>
              <div className="input-affix">
                <span className="affix-icon">🔒</span>
                <input
                  id="auth-password"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? (
                <span className="spinner-inline">Processing...</span>
              ) : mode === 'login' ? (
                'Sign In to Dashboard'
              ) : (
                'Create Free Student Account'
              )}
            </button>
          </form>

          <div className="auth-separator">
            <span>or test with 1-click</span>
          </div>

          <button
            type="button"
            className="btn btn-outline btn-block btn-demo"
            onClick={handleDemoLogin}
            disabled={loading}
          >
            <span className="btn-icon">⚡</span>
            <span>Instant Demo Student Login</span>
          </button>

          <div className="auth-footer-note">
            <span>Pre-loaded credentials: <code>demo@gradpath.ai</code></span>
          </div>
        </div>

        {/* Security / trust badge */}
        <div className="trust-badges">
          <span>🔒 256-Bit SSL Protection</span>
          <span>•</span>
          <span>FERPA &amp; GDPR Compliant</span>
          <span>•</span>
          <span>BFF Secure Session</span>
        </div>
      </div>
    </div>
  );
}
