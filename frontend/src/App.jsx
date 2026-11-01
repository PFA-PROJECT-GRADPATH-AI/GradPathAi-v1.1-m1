import { useState, useEffect } from 'react';
import { auth } from './api/client';
import AuthPage from './pages/AuthPage';
import ProfilePage from './pages/ProfilePage';
import './App.css';

export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    auth.me()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setChecking(false));
  }, []);

  if (checking) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Connecting to GradPath AI...</p>
      </div>
    );
  }

  return user ? (
    <ProfilePage user={user} onLogout={() => setUser(null)} />
  ) : (
    <AuthPage onAuthenticated={setUser} />
  );
}

