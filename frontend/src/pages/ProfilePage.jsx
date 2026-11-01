import { useState, useEffect } from 'react';
import { auth, profile } from '../api/client';

const INITIAL_FORM = {
  degree: '',
  cgpa: '',
  cgpaScale: '4.0',
  graduationYear: new Date().getFullYear(),
  skillsCsv: '',
  researchInterestsCsv: '',
  targetCountriesCsv: '',
  targetIntake: 'Fall',
  fundingPreference: 'Scholarship',
  consentVersion: 'v1.0',
};

export default function ProfilePage({ user, onLogout }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [snapshot, setSnapshot] = useState(null);
  const [cvResult, setCvResult] = useState(null);
  const [privacyPolicy, setPrivacyPolicy] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    profile.get().then(data => {
      if (data) {
        setForm({
          ...data,
          cgpa: String(data.cgpa),
          cgpaScale: String(data.cgpaScale),
          graduationYear: data.graduationYear
        });
      }
    }).catch(() => {});

    profile.privacyAudit().then(setPrivacyPolicy).catch(() => {});
  }, []);

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus('');
    try {
      await profile.upsert({
        ...form,
        cgpa: parseFloat(form.cgpa),
        cgpaScale: parseFloat(form.cgpaScale),
        graduationYear: parseInt(form.graduationYear, 10),
      });
      const snap = await profile.snapshot();
      setSnapshot(snap);
      setStatus('✅ Profile saved successfully! (M1-UC03 Complete)');
    } catch (err) {
      setStatus(`❌ ${err.message || 'Error saving profile'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCvUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    setCvResult(null);
    try {
      const result = await profile.uploadCv(file);
      setCvResult(result);
    } catch (err) {
      setCvResult({ message: `❌ Error: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await auth.logout();
    onLogout();
  };

  return (
    <div className="profile-container">
      <header className="app-header">
        <div className="header-brand">
          <h1>🎓 GradPath AI</h1>
          <span className="subtitle">Student Academic Profile &amp; Identity</span>
        </div>
        <div className="user-info">
          <span className="session-badge">🟢 {user.fullName || user.email}</span>
          <button className="btn-logout" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <div className="profile-tabs">
        <button
          className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          📋 Academic Profile (M1-UC03)
        </button>
        <button
          className={`tab ${activeTab === 'cv' ? 'active' : ''}`}
          onClick={() => setActiveTab('cv')}
        >
          📄 CV Adapter (M1-UC04)
        </button>
        <button
          className={`tab ${activeTab === 'snapshot' ? 'active' : ''}`}
          onClick={() => setActiveTab('snapshot')}
        >
          🔍 ProfileSnapshot v1
        </button>
        <button
          className={`tab ${activeTab === 'privacy' ? 'active' : ''}`}
          onClick={() => setActiveTab('privacy')}
        >
          🛡️ Privacy Policy Singleton
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'profile' && (
          <form className="profile-form" onSubmit={handleSave}>
            <div className="section-title">
              <h2>Student Academic Credentials</h2>
              <p>Configure academic record and research parameters for downstream AI evaluation</p>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>Degree Program</label>
                <input
                  name="degree"
                  value={form.degree}
                  onChange={handleChange}
                  placeholder="e.g. BS Computer Science"
                  required
                />
              </div>
              <div className="form-group">
                <label>CGPA</label>
                <input
                  name="cgpa"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="10.0"
                  value={form.cgpa}
                  onChange={handleChange}
                  placeholder="3.65"
                  required
                />
              </div>
              <div className="form-group">
                <label>CGPA Scale</label>
                <select name="cgpaScale" value={form.cgpaScale} onChange={handleChange}>
                  <option value="4.0">4.0</option>
                  <option value="5.0">5.0</option>
                  <option value="10.0">10.0</option>
                </select>
              </div>
              <div className="form-group">
                <label>Graduation Year</label>
                <input
                  name="graduationYear"
                  type="number"
                  value={form.graduationYear}
                  onChange={handleChange}
                  min="2020"
                  max="2032"
                  required
                />
              </div>
              <div className="form-group full">
                <label>Skills (comma-separated)</label>
                <input
                  name="skillsCsv"
                  value={form.skillsCsv}
                  onChange={handleChange}
                  placeholder="Python, C#, Machine Learning, SQL, Docker"
                />
              </div>
              <div className="form-group full">
                <label>Research Interests (comma-separated)</label>
                <input
                  name="researchInterestsCsv"
                  value={form.researchInterestsCsv}
                  onChange={handleChange}
                  placeholder="Natural Language Processing, Distributed Systems, Computer Vision"
                />
              </div>
              <div className="form-group full">
                <label>Target Countries (comma-separated)</label>
                <input
                  name="targetCountriesCsv"
                  value={form.targetCountriesCsv}
                  onChange={handleChange}
                  placeholder="USA, Canada, Germany, Sweden"
                />
              </div>
              <div className="form-group">
                <label>Target Intake</label>
                <select name="targetIntake" value={form.targetIntake} onChange={handleChange}>
                  <option value="Fall">Fall</option>
                  <option value="Spring">Spring</option>
                  <option value="Summer">Summer</option>
                </select>
              </div>
              <div className="form-group">
                <label>Funding Preference</label>
                <select name="fundingPreference" value={form.fundingPreference} onChange={handleChange}>
                  <option value="Scholarship">Scholarship / Fellowship</option>
                  <option value="Assistantship">Graduate Assistantship (TA/RA)</option>
                  <option value="Self-funded">Self-funded</option>
                  <option value="Any">Any / Open</option>
                </select>
              </div>
            </div>

            {status && (
              <div className={`status-banner ${status.startsWith('✅') ? 'success' : 'error'}`}>
                {status}
              </div>
            )}

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving...' : '💾 Save Profile (M1-UC03)'}
            </button>
          </form>
        )}

        {activeTab === 'cv' && (
          <div className="cv-upload-card">
            <h2>📄 CV Extractor — Adapter Pattern (M1-UC04)</h2>
            <p className="hint">
              Upload a PDF CV (maximum 5 MB). The <code>SimulatedPdfCvExtractorAdapter</code> demonstrates
              decoupled OCR/LLM document processing without modifying <code>ProfileService</code>.
            </p>
            <div className="upload-zone">
              <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleCvUpload}
                id="cv-file"
                style={{ display: 'none' }}
              />
              <label htmlFor="cv-file" className="btn-upload">
                {loading ? 'Extracting via Adapter...' : '📎 Select PDF CV Document'}
              </label>
            </div>
            {cvResult && (
              <div className="cv-result">
                <h3>{cvResult.message}</h3>
                {cvResult.extractedSkills && (
                  <div className="extracted-tags">
                    <div>
                      <strong>Extracted Skills:</strong>
                      <div className="tag-list">
                        {cvResult.extractedSkills.map((s, i) => (
                          <span key={i} className="tag">{s}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <strong>Extracted Research Interests:</strong>
                      <div className="tag-list">
                        {cvResult.extractedResearchInterests.map((r, i) => (
                          <span key={i} className="tag tag-interest">{r}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'snapshot' && (
          <div className="snapshot-panel">
            <h2>🔍 ProfileSnapshot v1 — Contract for Member 2</h2>
            <p className="hint">
              This endpoint (<code>GET /api/v1/profile/me/consented-summary</code>) provides the immutable
              snapshot schema consumed by downstream recommendation engines.
            </p>
            {snapshot ? (
              <pre className="json-preview">{JSON.stringify(snapshot, null, 2)}</pre>
            ) : (
              <div className="hint-card">
                No active snapshot cached yet. Click "Refresh Snapshot" or save your profile first.
              </div>
            )}
            <button
              className="btn-secondary"
              onClick={async () => {
                try {
                  const s = await profile.snapshot();
                  setSnapshot(s);
                } catch (e) {
                  setSnapshot({ error: e.message });
                }
              }}
            >
              🔄 Refresh Snapshot
            </button>
          </div>
        )}

        {activeTab === 'privacy' && (
          <div className="snapshot-panel">
            <h2>🛡️ Privacy Policy Singleton Audit</h2>
            <p className="hint">
              Loaded directly from the ASP.NET Core Singleton instance <code>IPrivacyPolicyRegistry</code>.
            </p>
            {privacyPolicy ? (
              <pre className="json-preview">{JSON.stringify(privacyPolicy, null, 2)}</pre>
            ) : (
              <div className="hint-card">Loading policy configuration...</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

