import { useState, useEffect } from 'react';
import { auth, profile } from '../api/client';

const SUGGESTED_SKILLS = [
  'Python', 'Machine Learning', 'Data Structures', 'C#', 'SQL', 
  'Cloud Architecture', 'Docker', 'PyTorch', 'TypeScript', 'React'
];

const SUGGESTED_RESEARCH = [
  'Natural Language Processing', 'Computer Vision', 'Distributed Systems',
  'Robotics & Autonomous Systems', 'Cybersecurity', 'Reinforcement Learning'
];

const POPULAR_COUNTRIES = [
  { code: 'USA', name: 'United States', flag: '🇺🇸' },
  { code: 'Canada', name: 'Canada', flag: '🇨🇦' },
  { code: 'Germany', name: 'Germany', flag: '🇩🇪' },
  { code: 'UK', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'Australia', name: 'Australia', flag: '🇦🇺' },
  { code: 'Sweden', name: 'Sweden', flag: '🇸🇪' }
];

export default function ProfilePage({ user, onLogout }) {
  const [form, setForm] = useState({
    degree: '',
    cgpa: '3.80',
    cgpaScale: '4.0',
    graduationYear: 2025,
    skillsCsv: '',
    researchInterestsCsv: '',
    targetCountriesCsv: 'USA, Canada, Germany',
    targetIntake: 'Fall',
    fundingPreference: 'Scholarship',
    consentVersion: 'v1.0'
  });

  const [snapshot, setSnapshot] = useState(null);
  const [cvResult, setCvResult] = useState(null);
  const [privacyPolicy, setPrivacyPolicy] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [statusMessage, setStatusMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showJsonPassport, setShowJsonPassport] = useState(false);
  const [showJsonPrivacy, setShowJsonPrivacy] = useState(false);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [newResearchInput, setNewResearchInput] = useState('');

  // Initial data load
  useEffect(() => {
    loadProfile();
    loadPrivacy();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await profile.get();
      if (data) {
        setForm({
          ...data,
          cgpa: String(data.cgpa),
          cgpaScale: String(data.cgpaScale),
          graduationYear: data.graduationYear
        });
      }
      const snap = await profile.snapshot();
      setSnapshot(snap);
    } catch {
      // If no profile exists yet, keep defaults
    }
  };

  const loadPrivacy = async () => {
    try {
      const p = await profile.privacyAudit();
      setPrivacyPolicy(p);
    } catch {
      // Ignore
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // Helper tag arrays
  const skillsArray = form.skillsCsv
    ? form.skillsCsv.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  const researchArray = form.researchInterestsCsv
    ? form.researchInterestsCsv.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  const countriesArray = form.targetCountriesCsv
    ? form.targetCountriesCsv.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  const addSkill = (skill) => {
    if (!skill || skillsArray.includes(skill)) return;
    const updated = [...skillsArray, skill].join(', ');
    setForm(prev => ({ ...prev, skillsCsv: updated }));
    setNewSkillInput('');
  };

  const removeSkill = (skillToRemove) => {
    const updated = skillsArray.filter(s => s !== skillToRemove).join(', ');
    setForm(prev => ({ ...prev, skillsCsv: updated }));
  };

  const addResearch = (interest) => {
    if (!interest || researchArray.includes(interest)) return;
    const updated = [...researchArray, interest].join(', ');
    setForm(prev => ({ ...prev, researchInterestsCsv: updated }));
    setNewResearchInput('');
  };

  const removeResearch = (itemToRemove) => {
    const updated = researchArray.filter(r => r !== itemToRemove).join(', ');
    setForm(prev => ({ ...prev, researchInterestsCsv: updated }));
  };

  const toggleCountry = (country) => {
    let updated;
    if (countriesArray.includes(country)) {
      updated = countriesArray.filter(c => c !== country).join(', ');
    } else {
      updated = [...countriesArray, country].join(', ');
    }
    setForm(prev => ({ ...prev, targetCountriesCsv: updated }));
  };

  // Calculate completeness score
  const calculateCompleteness = () => {
    let score = 0;
    if (form.degree && form.degree.trim()) score += 25;
    if (parseFloat(form.cgpa) > 0) score += 25;
    if (skillsArray.length > 0) score += 20;
    if (researchArray.length > 0) score += 15;
    if (countriesArray.length > 0) score += 15;
    return Math.min(score, 100);
  };

  const completeness = calculateCompleteness();

  const handleSave = async (e) => {
    e.preventDefault();
    setStatusMessage(null);

    const cgpaNum = parseFloat(form.cgpa);
    const scaleNum = parseFloat(form.cgpaScale);
    const yearNum = parseInt(form.graduationYear, 10);

    if (isNaN(cgpaNum) || cgpaNum <= 0 || cgpaNum > scaleNum) {
      setStatusMessage({ type: 'error', text: `CGPA must be greater than 0 and not exceed scale (${scaleNum}).` });
      return;
    }
    if (isNaN(yearNum) || yearNum < 2020 || yearNum > 2032) {
      setStatusMessage({ type: 'error', text: 'Graduation year must be between 2020 and 2032.' });
      return;
    }

    setLoading(true);
    try {
      await profile.upsert({
        ...form,
        cgpa: cgpaNum,
        cgpaScale: scaleNum,
        graduationYear: yearNum,
      });
      const snap = await profile.snapshot();
      setSnapshot(snap);
      setStatusMessage({ type: 'success', text: 'Academic Profile saved and synchronized successfully!' });
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to update profile.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCvSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        setStatusMessage({ type: 'error', text: 'Only standard PDF documents (.pdf) are permitted.' });
        return;
      }
      setSelectedFile(file);
      setCvResult(null);
    }
  };

  const handleCvUpload = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setStatusMessage(null);
    try {
      const result = await profile.uploadCv(selectedFile);
      setCvResult(result);
      setStatusMessage({ type: 'success', text: 'CV credentials analyzed and extracted successfully.' });
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || 'CV processing failed.' });
    } finally {
      setLoading(false);
    }
  };

  const applyExtractedToProfile = () => {
    if (!cvResult) return;
    const combinedSkills = Array.from(new Set([...skillsArray, ...(cvResult.extractedSkills || [])])).join(', ');
    const combinedResearch = Array.from(new Set([...researchArray, ...(cvResult.extractedResearchInterests || [])])).join(', ');
    setForm(prev => ({
      ...prev,
      skillsCsv: combinedSkills,
      researchInterestsCsv: combinedResearch
    }));
    setStatusMessage({ type: 'success', text: 'Extracted skills and research interests applied to your profile form. Click Save Profile to persist.' });
    setActiveTab('profile');
  };

  const handleLogout = async () => {
    try {
      await auth.logout();
    } finally {
      onLogout();
    }
  };

  return (
    <div className="portal-layout">
      {/* Top Navbar */}
      <header className="portal-navbar">
        <div className="navbar-container">
          <div className="navbar-brand">
            <div className="brand-badge">🎓</div>
            <div>
              <span className="brand-title">GradPath AI</span>
              <span className="brand-subtitle">Student Admissions Portal</span>
            </div>
          </div>

          <div className="navbar-user">
            <div className="user-profile-pill">
              <div className="user-avatar">{user.fullName ? user.fullName[0].toUpperCase() : 'S'}</div>
              <div className="user-details">
                <span className="user-name">{user.fullName || 'Student'}</span>
                <span className="user-email">{user.email}</span>
              </div>
            </div>
            <button type="button" className="btn-signout" onClick={handleLogout} title="Sign Out">
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="navbar-tabs">
          <div className="tabs-container">
            <button
              type="button"
              className={`nav-tab ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <span className="tab-icon">📋</span>
              <span>Academic Profile</span>
            </button>
            <button
              type="button"
              className={`nav-tab ${activeTab === 'cv' ? 'active' : ''}`}
              onClick={() => setActiveTab('cv')}
            >
              <span className="tab-icon">📄</span>
              <span>Resume &amp; Skill Studio</span>
            </button>
            <button
              type="button"
              className={`nav-tab ${activeTab === 'snapshot' ? 'active' : ''}`}
              onClick={() => setActiveTab('snapshot')}
            >
              <span className="tab-icon">🎯</span>
              <span>Admissions Readiness Passport</span>
            </button>
            <button
              type="button"
              className={`nav-tab ${activeTab === 'privacy' ? 'active' : ''}`}
              onClick={() => setActiveTab('privacy')}
            >
              <span className="tab-icon">🛡️</span>
              <span>Security &amp; Data Privacy</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="portal-main">
        <div className="portal-container">
          {/* Notification banner */}
          {statusMessage && (
            <div className={`notification-banner ${statusMessage.type === 'success' ? 'is-success' : 'is-error'}`}>
              <span className="notification-icon">{statusMessage.type === 'success' ? '✅' : '⚠️'}</span>
              <span className="notification-text">{statusMessage.text}</span>
              <button
                type="button"
                className="notification-close"
                onClick={() => setStatusMessage(null)}
              >
                ✕
              </button>
            </div>
          )}

          {/* TAB 1: ACADEMIC PROFILE */}
          {activeTab === 'profile' && (
            <div className="profile-studio">
              {/* Progress Card */}
              <div className="progress-banner-card">
                <div className="progress-info">
                  <h3>Admissions Profile Completeness</h3>
                  <p>Complete your academic standing and research profile to receive tailored advisor recommendations.</p>
                </div>
                <div className="progress-meter">
                  <div className="meter-label">
                    <span>Profile Score</span>
                    <strong>{completeness}%</strong>
                  </div>
                  <div className="meter-bar">
                    <div className="meter-fill" style={{ width: `${completeness}%` }}></div>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSave} className="profile-form-grid">
                {/* Section 1: Degree & Grades */}
                <div className="studio-card">
                  <div className="card-header">
                    <div className="card-badge">1</div>
                    <div>
                      <h4>Academic Credentials</h4>
                      <p>Your current or highest completed university degree</p>
                    </div>
                  </div>

                  <div className="form-fields">
                    <div className="field-group">
                      <label htmlFor="degree-input">Degree Program</label>
                      <input
                        id="degree-input"
                        name="degree"
                        type="text"
                        value={form.degree}
                        onChange={handleChange}
                        placeholder="e.g. BS in Computer Science"
                        required
                      />
                    </div>

                    <div className="fields-row-3">
                      <div className="field-group">
                        <label htmlFor="cgpa-input">Cumulative GPA</label>
                        <input
                          id="cgpa-input"
                          name="cgpa"
                          type="number"
                          step="0.01"
                          min="0.01"
                          max="10.0"
                          value={form.cgpa}
                          onChange={handleChange}
                          placeholder="3.85"
                          required
                        />
                      </div>

                      <div className="field-group">
                        <label htmlFor="scale-select">GPA Scale</label>
                        <select
                          id="scale-select"
                          name="cgpaScale"
                          value={form.cgpaScale}
                          onChange={handleChange}
                        >
                          <option value="4.0">4.0 Scale</option>
                          <option value="5.0">5.0 Scale</option>
                          <option value="10.0">10.0 Scale</option>
                        </select>
                      </div>

                      <div className="field-group">
                        <label htmlFor="year-input">Graduation Year</label>
                        <input
                          id="year-input"
                          name="graduationYear"
                          type="number"
                          min="2020"
                          max="2032"
                          value={form.graduationYear}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Skills & Research */}
                <div className="studio-card">
                  <div className="card-header">
                    <div className="card-badge">2</div>
                    <div>
                      <h4>Technical Skills &amp; Research Focus</h4>
                      <p>Highlight your core competencies and intended graduate research fields</p>
                    </div>
                  </div>

                  <div className="form-fields">
                    {/* Skills Tag Input */}
                    <div className="field-group">
                      <label>Technical &amp; Analytical Skills</label>
                      <div className="tag-input-container">
                        <div className="active-tag-list">
                          {skillsArray.map((skill, idx) => (
                            <span key={idx} className="chip chip-skill">
                              {skill}
                              <button type="button" onClick={() => removeSkill(skill)}>✕</button>
                            </span>
                          ))}
                        </div>
                        <div className="inline-add-row">
                          <input
                            type="text"
                            value={newSkillInput}
                            onChange={(e) => setNewSkillInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                addSkill(newSkillInput.trim());
                              }
                            }}
                            placeholder="Add a skill and press Enter (e.g. Python, SQL)"
                          />
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => addSkill(newSkillInput.trim())}
                          >
                            Add
                          </button>
                        </div>
                      </div>
                      <div className="suggestions-row">
                        <span className="suggestions-label">Quick suggestions:</span>
                        {SUGGESTED_SKILLS.filter(s => !skillsArray.includes(s)).slice(0, 6).map((skill, i) => (
                          <button
                            type="button"
                            key={i}
                            className="pill-suggestion"
                            onClick={() => addSkill(skill)}
                          >
                            + {skill}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Research Interests Tag Input */}
                    <div className="field-group">
                      <label>Primary Research Interests</label>
                      <div className="tag-input-container">
                        <div className="active-tag-list">
                          {researchArray.map((interest, idx) => (
                            <span key={idx} className="chip chip-research">
                              {interest}
                              <button type="button" onClick={() => removeResearch(interest)}>✕</button>
                            </span>
                          ))}
                        </div>
                        <div className="inline-add-row">
                          <input
                            type="text"
                            value={newResearchInput}
                            onChange={(e) => setNewResearchInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                addResearch(newResearchInput.trim());
                              }
                            }}
                            placeholder="Add a research area and press Enter (e.g. NLP)"
                          />
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => addResearch(newResearchInput.trim())}
                          >
                            Add
                          </button>
                        </div>
                      </div>
                      <div className="suggestions-row">
                        <span className="suggestions-label">Popular areas:</span>
                        {SUGGESTED_RESEARCH.filter(r => !researchArray.includes(r)).slice(0, 4).map((interest, i) => (
                          <button
                            type="button"
                            key={i}
                            className="pill-suggestion pill-suggestion-research"
                            onClick={() => addResearch(interest)}
                          >
                            + {interest}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 3: Study Abroad Targets */}
                <div className="studio-card">
                  <div className="card-header">
                    <div className="card-badge">3</div>
                    <div>
                      <h4>Admissions Ambitions &amp; Target Destinations</h4>
                      <p>Select your intended intake term, preferred countries, and funding model</p>
                    </div>
                  </div>

                  <div className="form-fields">
                    <div className="field-group">
                      <label>Target Destination Countries</label>
                      <div className="countries-selector">
                        {POPULAR_COUNTRIES.map((country) => {
                          const isSelected = countriesArray.includes(country.code) || countriesArray.includes(country.name);
                          return (
                            <button
                              key={country.code}
                              type="button"
                              className={`country-pill ${isSelected ? 'selected' : ''}`}
                              onClick={() => toggleCountry(country.name)}
                            >
                              <span className="country-flag">{country.flag}</span>
                              <span className="country-name">{country.name}</span>
                              {isSelected && <span className="country-check">✓</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="fields-row-2">
                      <div className="field-group">
                        <label htmlFor="intake-select">Target Intake Term</label>
                        <select
                          id="intake-select"
                          name="targetIntake"
                          value={form.targetIntake}
                          onChange={handleChange}
                        >
                          <option value="Fall">Fall Intake (Recommended for Aid)</option>
                          <option value="Spring">Spring Intake</option>
                          <option value="Summer">Summer Intake</option>
                        </select>
                      </div>

                      <div className="field-group">
                        <label htmlFor="funding-select">Funding &amp; Scholarship Strategy</label>
                        <select
                          id="funding-select"
                          name="fundingPreference"
                          value={form.fundingPreference}
                          onChange={handleChange}
                        >
                          <option value="Scholarship">Full Scholarship / Fellowship</option>
                          <option value="Assistantship">Graduate Assistantship (TA / RA)</option>
                          <option value="Self-funded">Self-Funded / Family Sponsorship</option>
                          <option value="Any">Open to Any Form of Financial Aid</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="studio-actions-footer">
                  <div className="actions-info">
                    <span>🔒 Secured by ASP.NET Core BFF Cookie Auth</span>
                  </div>
                  <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                    {loading ? 'Saving Profile...' : '💾 Save & Update Academic Profile'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: RESUME & SKILL STUDIO */}
          {activeTab === 'cv' && (
            <div className="cv-studio">
              <div className="studio-card">
                <div className="card-header">
                  <div className="card-badge">📄</div>
                  <div>
                    <h4>Smart Resume &amp; CV Document Analyzer</h4>
                    <p>Upload your academic curriculum vitae (PDF) to automatically discover skills and research themes</p>
                  </div>
                </div>

                <div className="cv-upload-zone">
                  <input
                    type="file"
                    id="cv-upload-input"
                    accept=".pdf,application/pdf"
                    onChange={handleCvSelect}
                    style={{ display: 'none' }}
                  />

                  <div className="dropzone-box">
                    <div className="dropzone-icon">📑</div>
                    <h5>{selectedFile ? selectedFile.name : 'Choose your CV or Drag & Drop here'}</h5>
                    <p className="dropzone-hint">
                      {selectedFile
                        ? `File size: ${(selectedFile.size / 1024).toFixed(1)} KB — Ready for analysis`
                        : 'Standard PDF document up to 5.0 MB supported'}
                    </p>
                    <label htmlFor="cv-upload-input" className="btn btn-outline">
                      {selectedFile ? 'Change Selected PDF' : 'Select PDF File'}
                    </label>
                  </div>

                  {selectedFile && (
                    <div className="upload-action-row">
                      <button
                        type="button"
                        className="btn btn-primary btn-lg"
                        onClick={handleCvUpload}
                        disabled={loading}
                      >
                        {loading ? 'Analyzing Document with AI Adapter...' : '⚡ Extract Academic Profile Data'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Extraction Result Showcase */}
                {cvResult && (
                  <div className="extraction-showcase">
                    <div className="showcase-header">
                      <div className="showcase-badge">✨ Extracted Credentials</div>
                      <h5>{cvResult.message}</h5>
                    </div>

                    <div className="showcase-grid">
                      <div className="showcase-panel">
                        <h6>Discovered Technical Skills</h6>
                        <div className="chips-wrapper">
                          {cvResult.extractedSkills?.map((s, idx) => (
                            <span key={idx} className="chip chip-skill">{s}</span>
                          ))}
                        </div>
                      </div>

                      <div className="showcase-panel">
                        <h6>Discovered Research Themes</h6>
                        <div className="chips-wrapper">
                          {cvResult.extractedResearchInterests?.map((r, idx) => (
                            <span key={idx} className="chip chip-research">{r}</span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="showcase-footer">
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={applyExtractedToProfile}
                      >
                        📥 Import Extracted Data Into My Academic Profile
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: ADMISSIONS READINESS PASSPORT (User-Focused alternative to raw JSON) */}
          {activeTab === 'snapshot' && (
            <div className="passport-studio">
              {/* Executive Student Passport Card */}
              <div className="passport-card">
                <div className="passport-header">
                  <div className="passport-seal">
                    <span className="seal-emblem">🎓</span>
                    <div>
                      <span className="passport-badge">Official Graduate Candidate Passport</span>
                      <h2>{user.fullName || 'Student Candidate'}</h2>
                    </div>
                  </div>
                  <div className="status-chip is-verified">
                    <span className="dot"></span>
                    <span>Ready for University Matching</span>
                  </div>
                </div>

                <div className="passport-body">
                  {/* Key Metrics Row */}
                  <div className="passport-metrics-grid">
                    <div className="passport-metric-tile">
                      <span className="metric-caption">Academic Standing</span>
                      <div className="metric-main">
                        <span className="metric-number">{form.cgpa}</span>
                        <span className="metric-sub">/ {form.cgpaScale} Scale</span>
                      </div>
                      <span className="metric-tag">High Distinction</span>
                    </div>

                    <div className="passport-metric-tile">
                      <span className="metric-caption">Target Degree Objective</span>
                      <div className="metric-text-primary">{form.degree || 'Not specified'}</div>
                      <span className="metric-tag">Class of {form.graduationYear}</span>
                    </div>

                    <div className="passport-metric-tile">
                      <span className="metric-caption">Primary Intake Term</span>
                      <div className="metric-text-primary">{form.targetIntake} Intake</div>
                      <span className="metric-tag">{form.fundingPreference}</span>
                    </div>

                    <div className="passport-metric-tile">
                      <span className="metric-caption">Target Study Hubs</span>
                      <div className="metric-text-primary">{form.targetCountriesCsv || 'Global'}</div>
                      <span className="metric-tag">Multi-Country Target</span>
                    </div>
                  </div>

                  {/* Skills Cloud */}
                  <div className="passport-section">
                    <h5>Verified Competencies &amp; Skills</h5>
                    <div className="chips-wrapper">
                      {skillsArray.length > 0 ? (
                        skillsArray.map((s, idx) => <span key={idx} className="chip chip-skill">{s}</span>)
                      ) : (
                        <span className="empty-notice">No skills recorded yet. Complete profile to add.</span>
                      )}
                    </div>
                  </div>

                  {/* Research Focus */}
                  <div className="passport-section">
                    <h5>Specialized Research Concentrations</h5>
                    <div className="chips-wrapper">
                      {researchArray.length > 0 ? (
                        researchArray.map((r, idx) => <span key={idx} className="chip chip-research">{r}</span>)
                      ) : (
                        <span className="empty-notice">No research concentrations specified yet.</span>
                      )}
                    </div>
                  </div>

                  {/* Security & Verification Footer */}
                  <div className="passport-security-row">
                    <div className="security-item">
                      <span className="security-icon">🛡️</span>
                      <span>Consent Version: <strong>{form.consentVersion}</strong></span>
                    </div>
                    <div className="security-item">
                      <span className="security-icon">🆔</span>
                      <span>Candidate UUID: <code>{user.id}</code></span>
                    </div>
                    <div className="security-item">
                      <span className="security-icon">⚡</span>
                      <span>BFF Cookie Authenticated</span>
                    </div>
                  </div>
                </div>

                {/* Collapsible Developer & Evaluator Payload */}
                <div className="developer-drawer">
                  <button
                    type="button"
                    className="drawer-toggle"
                    onClick={() => setShowJsonPassport(prev => !prev)}
                  >
                    <span>{showJsonPassport ? '▼ Hide Machine-Readable API Payload (JSON)' : '▶ View Machine-Readable API Contract (ProfileSnapshot v1)'}</span>
                    <span className="drawer-badge">For Member 2 Integrators</span>
                  </button>

                  {showJsonPassport && (
                    <div className="drawer-content">
                      <div className="json-header">
                        <span>Schema: <code>ProfileSnapshotV1</code> (Delivered via <code>GET /api/v1/profile/me/consented-summary</code>)</span>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => {
                            navigator.clipboard.writeText(JSON.stringify(snapshot || form, null, 2));
                            setStatusMessage({ type: 'success', text: 'Contract JSON copied to clipboard!' });
                          }}
                        >
                          📋 Copy JSON
                        </button>
                      </div>
                      <pre className="code-block">{JSON.stringify(snapshot || form, null, 2)}</pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SECURITY & DATA PRIVACY (User-Focused alternative to raw Singleton JSON) */}
          {activeTab === 'privacy' && (
            <div className="privacy-studio">
              <div className="studio-card">
                <div className="card-header">
                  <div className="card-badge">🛡️</div>
                  <div>
                    <h4>Data Protection, Privacy &amp; FERPA Governance</h4>
                    <p>How GradPath AI safeguards your academic records and personally identifiable information (PII)</p>
                  </div>
                </div>

                <div className="privacy-pillars-grid">
                  <div className="pillar-card">
                    <div className="pillar-icon">🔒</div>
                    <h5>BFF HttpOnly Security</h5>
                    <p>Session authentication uses secure HttpOnly Lax cookies, eliminating token theft risks from browser localStorage or cross-site scripting (XSS).</p>
                  </div>

                  <div className="pillar-card">
                    <div className="pillar-icon">🧼</div>
                    <h5>Automatic PII Redaction</h5>
                    <p>Passwords, session tokens, and raw document contents are stripped before academic analysis or evaluation matching algorithms execute.</p>
                  </div>

                  <div className="pillar-card">
                    <div className="pillar-icon">📑</div>
                    <h5>Strict Document Validation</h5>
                    <p>Only verified application/pdf documents within 5 MB file size are processed, guarding against malicious payloads or oversized blobs.</p>
                  </div>

                  <div className="pillar-card">
                    <div className="pillar-icon">⚖️</div>
                    <h5>Consent Versioning</h5>
                    <p>Active policy configuration <strong>{privacyPolicy?.consentVersion || 'v1.0'}</strong> maintains strict compliance with student data rights and revocable consent.</p>
                  </div>
                </div>

                {/* Collapsible Technical Audit Log */}
                <div className="developer-drawer">
                  <button
                    type="button"
                    className="drawer-toggle"
                    onClick={() => setShowJsonPrivacy(prev => !prev)}
                  >
                    <span>{showJsonPrivacy ? '▼ Hide Technical Singleton Audit' : '▶ View Technical Singleton Registry Payload'}</span>
                    <span className="drawer-badge">ASP.NET Core IPrivacyPolicyRegistry</span>
                  </button>

                  {showJsonPrivacy && (
                    <div className="drawer-content">
                      <div className="json-header">
                        <span>Delivered via <code>GET /api/v1/profile/privacy-audit</code></span>
                      </div>
                      <pre className="code-block">{JSON.stringify(privacyPolicy, null, 2)}</pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
