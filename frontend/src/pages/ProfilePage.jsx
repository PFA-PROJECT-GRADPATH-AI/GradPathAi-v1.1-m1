import { useState, useEffect } from 'react';
import { auth, profile } from '../api/client';
import {
  IconGraduation,
  IconFileText,
  IconCompass,
  IconSettings,
  IconUpload,
  IconDownload,
  IconCheck,
  IconAlert,
  IconLogOut,
  IconGlobe,
  IconBook
} from '../components/Icons';

const SUGGESTED_SKILLS = [
  'Python', 'Machine Learning', 'Data Structures', 'C++', 'SQL', 
  'TensorFlow', 'Keras', 'Scikit-learn', 'Pandas', 'NumPy', 'React.js', 'Node.js', 'AWS', 'Docker'
];

const SUGGESTED_RESEARCH = [
  'Natural Language Processing', 'Computer Vision',
  'Predictive Modeling', 'Cloud & Distributed Systems'
];

const POPULAR_COUNTRIES = [
  { code: 'USA', name: 'United States' },
  { code: 'Canada', name: 'Canada' },
  { code: 'Germany', name: 'Germany' },
  { code: 'UK', name: 'United Kingdom' },
  { code: 'Australia', name: 'Australia' },
  { code: 'Sweden', name: 'Sweden' }
];

export default function ProfilePage({ user, onLogout }) {
  const [form, setForm] = useState({
    degree: '',
    cgpa: '3.45',
    cgpaScale: '4.0',
    graduationYear: 2027,
    skillsCsv: '',
    researchInterestsCsv: '',
    targetCountriesCsv: 'United States, Canada, Germany',
    targetIntake: 'Fall',
    fundingPreference: 'Scholarship',
    consentVersion: 'v1.0'
  });

  const [snapshot, setSnapshot] = useState(null);
  const [cvResult, setCvResult] = useState(null);
  const [activeNav, setActiveNav] = useState('profile'); // 'profile' | 'resume' | 'admissions' | 'settings'
  const [statusMessage, setStatusMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showJsonRaw, setShowJsonRaw] = useState(false);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [newResearchInput, setNewResearchInput] = useState('');

  useEffect(() => {
    loadProfile();
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
      // Use defaults if profile is new
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

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
      setStatusMessage({ type: 'error', text: `GPA must be greater than 0 and not exceed ${scaleNum}.` });
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
      setStatusMessage({ type: 'success', text: 'Your academic profile has been saved successfully.' });
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
        setStatusMessage({ type: 'error', text: 'Only PDF documents (.pdf) are supported.' });
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
      setStatusMessage({
        type: 'success',
        text: 'Resume analyzed successfully. Review the extracted credentials below.'
      });
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || 'Document processing failed.' });
    } finally {
      setLoading(false);
    }
  };

  const autoPopulateAllFromCv = () => {
    if (!cvResult) return;

    const combinedSkills = Array.from(new Set([...skillsArray, ...(cvResult.extractedSkills || [])])).join(', ');
    const combinedResearch = Array.from(new Set([...researchArray, ...(cvResult.extractedResearchInterests || [])])).join(', ');

    setForm(prev => ({
      ...prev,
      degree: cvResult.degree || prev.degree,
      cgpa: cvResult.cgpa ? String(cvResult.cgpa) : prev.cgpa,
      cgpaScale: cvResult.cgpaScale ? String(cvResult.cgpaScale) : prev.cgpaScale,
      graduationYear: cvResult.graduationYear || prev.graduationYear,
      skillsCsv: combinedSkills,
      researchInterestsCsv: combinedResearch
    }));

    setStatusMessage({
      type: 'success',
      text: 'Extracted credentials applied to your profile. Click "Save Changes" to confirm.'
    });
    setActiveNav('profile');
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await profile.exportFile();
      setStatusMessage({
        type: 'success',
        text: 'Your profile data file was downloaded successfully.'
      });
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || 'Export failed.' });
    } finally {
      setExporting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.logout();
    } finally {
      onLogout();
    }
  };

  return (
    <div className="app-shell">
      {/* ── Left Sidebar ── */}
      <aside className="app-sidebar" aria-label="Sidebar Navigation">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <IconGraduation size={24} />
          </div>
          <div className="sidebar-brand">
            <span className="brand-name">GradPath AI</span>
            <span className="brand-desc">Admissions Portal</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-group-label">WORKSPACE</div>
          <button
            type="button"
            className={`sidebar-nav-item ${activeNav === 'profile' ? 'active' : ''}`}
            onClick={() => { setActiveNav('profile'); setStatusMessage(null); }}
          >
            <IconGraduation size={18} className="nav-icon" />
            <span>Academic Profile</span>
          </button>

          <button
            type="button"
            className={`sidebar-nav-item ${activeNav === 'resume' ? 'active' : ''}`}
            onClick={() => { setActiveNav('resume'); setStatusMessage(null); }}
          >
            <IconFileText size={18} className="nav-icon" />
            <span>Resume &amp; Documents</span>
          </button>

          <button
            type="button"
            className={`sidebar-nav-item ${activeNav === 'admissions' ? 'active' : ''}`}
            onClick={() => { setActiveNav('admissions'); setStatusMessage(null); }}
          >
            <IconCompass size={18} className="nav-icon" />
            <span>Admissions Summary</span>
          </button>

          <div className="nav-group-label" style={{ marginTop: '1.5rem' }}>PREFERENCES</div>
          <button
            type="button"
            className={`sidebar-nav-item ${activeNav === 'settings' ? 'active' : ''}`}
            onClick={() => { setActiveNav('settings'); setStatusMessage(null); }}
          >
            <IconSettings size={18} className="nav-icon" />
            <span>Account Settings</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="user-mini-card">
            <div className="user-initials">
              {user.fullName ? user.fullName[0].toUpperCase() : 'S'}
            </div>
            <div className="user-meta">
              <span className="user-name">{user.fullName || 'Student'}</span>
              <span className="user-email">{user.email}</span>
            </div>
            <button
              type="button"
              className="btn-logout-icon"
              onClick={handleLogout}
              title="Sign Out"
              aria-label="Sign Out"
            >
              <IconLogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main Content View ── */}
      <div className="app-main">
        {/* Top Header Bar */}
        <header className="main-topbar">
          <div className="topbar-title">
            {activeNav === 'profile' && <h2>Academic Profile</h2>}
            {activeNav === 'resume' && <h2>Resume &amp; Documents</h2>}
            {activeNav === 'admissions' && <h2>Admissions Summary</h2>}
            {activeNav === 'settings' && <h2>Account Settings</h2>}
          </div>

          <div className="topbar-actions">
            {activeNav === 'admissions' && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleExport}
                disabled={exporting}
              >
                <IconDownload size={16} />
                <span>{exporting ? 'Downloading...' : 'Export Profile (.json)'}</span>
              </button>
            )}
            {activeNav === 'profile' && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSave}
                disabled={loading}
              >
                <IconCheck size={16} />
                <span>{loading ? 'Saving...' : 'Save Changes'}</span>
              </button>
            )}
          </div>
        </header>

        {/* Scrollable View Area */}
        <div className="main-scrollable">
          <div className="content-container">
            {/* Status alert banner */}
            {statusMessage && (
              <div className={`app-alert ${statusMessage.type === 'success' ? 'alert-success' : 'alert-error'}`}>
                {statusMessage.type === 'success' ? <IconCheck size={18} /> : <IconAlert size={18} />}
                <div className="alert-text">{statusMessage.text}</div>
                <button
                  type="button"
                  className="alert-close"
                  onClick={() => setStatusMessage(null)}
                >
                  ✕
                </button>
              </div>
            )}

            {/* ── VIEW 1: ACADEMIC PROFILE ── */}
            {activeNav === 'profile' && (
              <div className="view-profile">
                {/* Profile Completeness Bar */}
                <div className="section-card completeness-card">
                  <div className="completeness-header">
                    <div>
                      <h3>Profile Completion</h3>
                      <p>Add your academic degree, coursework, and target preferences to unlock admissions matching.</p>
                    </div>
                    <span className="completeness-score">{completeness}%</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${completeness}%` }}></div>
                  </div>
                </div>

                <form onSubmit={handleSave}>
                  {/* Card 1: Degree & Grades */}
                  <div className="section-card">
                    <div className="section-card-header">
                      <h4>Education &amp; Grades</h4>
                      <p>Your current or highest completed degree program</p>
                    </div>

                    <div className="form-grid">
                      <div className="form-row-full">
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

                      <div className="form-row-3">
                        <div>
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
                            placeholder="3.45"
                            required
                          />
                        </div>

                        <div>
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

                        <div>
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

                  {/* Card 2: Skills & Research */}
                  <div className="section-card">
                    <div className="section-card-header">
                      <h4>Technical Skills &amp; Research Focus</h4>
                      <p>Highlight your core competencies and intended areas of study</p>
                    </div>

                    <div className="form-grid">
                      {/* Skills */}
                      <div className="form-row-full">
                        <label>Technical Skills</label>
                        <div className="tags-container">
                          <div className="tags-list">
                            {skillsArray.map((skill, idx) => (
                              <span key={idx} className="app-tag">
                                {skill}
                                <button type="button" onClick={() => removeSkill(skill)}>✕</button>
                              </span>
                            ))}
                          </div>
                          <div className="tag-input-row">
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
                              placeholder="Type a skill and press Enter"
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

                        <div className="quick-suggestions">
                          <span className="suggestions-title">Suggestions:</span>
                          {SUGGESTED_SKILLS.filter(s => !skillsArray.includes(s)).slice(0, 6).map((skill, i) => (
                            <button
                              type="button"
                              key={i}
                              className="suggestion-pill"
                              onClick={() => addSkill(skill)}
                            >
                              + {skill}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Research */}
                      <div className="form-row-full">
                        <label>Research Concentrations</label>
                        <div className="tags-container">
                          <div className="tags-list">
                            {researchArray.map((r, idx) => (
                              <span key={idx} className="app-tag">
                                {r}
                                <button type="button" onClick={() => removeResearch(r)}>✕</button>
                              </span>
                            ))}
                          </div>
                          <div className="tag-input-row">
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
                              placeholder="Type a research area and press Enter"
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

                        <div className="quick-suggestions">
                          <span className="suggestions-title">Suggestions:</span>
                          {SUGGESTED_RESEARCH.filter(r => !researchArray.includes(r)).slice(0, 4).map((r, i) => (
                            <button
                              type="button"
                              key={i}
                              className="suggestion-pill"
                              onClick={() => addResearch(r)}
                            >
                              + {r}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Study Abroad Targets */}
                  <div className="section-card">
                    <div className="section-card-header">
                      <h4>Admissions Ambitions</h4>
                      <p>Target intake terms, study destinations, and funding preferences</p>
                    </div>

                    <div className="form-grid">
                      <div className="form-row-full">
                        <label>Preferred Destination Countries</label>
                        <div className="countries-grid">
                          {POPULAR_COUNTRIES.map((country) => {
                            const isSelected = countriesArray.includes(country.name);
                            return (
                              <button
                                key={country.code}
                                type="button"
                                className={`country-box ${isSelected ? 'active' : ''}`}
                                onClick={() => toggleCountry(country.name)}
                              >
                                <span className="country-name">{country.name}</span>
                                {isSelected && <span className="check-mark">✓</span>}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="form-row-2">
                        <div>
                          <label htmlFor="intake-select">Target Intake Term</label>
                          <select
                            id="intake-select"
                            name="targetIntake"
                            value={form.targetIntake}
                            onChange={handleChange}
                          >
                            <option value="Fall">Fall Intake</option>
                            <option value="Spring">Spring Intake</option>
                            <option value="Summer">Summer Intake</option>
                          </select>
                        </div>

                        <div>
                          <label htmlFor="funding-select">Funding Preference</label>
                          <select
                            id="funding-select"
                            name="fundingPreference"
                            value={form.fundingPreference}
                            onChange={handleChange}
                          >
                            <option value="Scholarship">Scholarship / Fellowship</option>
                            <option value="Assistantship">Graduate Assistantship (TA / RA)</option>
                            <option value="Self-funded">Self-Funded</option>
                            <option value="Any">Open to Any Financial Aid</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="form-actions-bar">
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                      <IconCheck size={16} />
                      <span>{loading ? 'Saving...' : 'Save Changes'}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ── VIEW 2: RESUME & DOCUMENTS ── */}
            {activeNav === 'resume' && (
              <div className="view-resume">
                <div className="section-card">
                  <div className="section-card-header">
                    <h4>Resume Upload &amp; Document Parsing</h4>
                    <p>Upload your academic curriculum vitae (PDF) to parse verified credentials, skills, and projects</p>
                  </div>

                  <div className="upload-dropzone">
                    <input
                      type="file"
                      id="cv-file-input"
                      accept=".pdf,application/pdf"
                      onChange={handleCvSelect}
                      style={{ display: 'none' }}
                    />

                    <div className="dropzone-inner">
                      <div className="dropzone-icon">
                        <IconUpload size={32} />
                      </div>
                      <h5>{selectedFile ? selectedFile.name : 'Select or drop your PDF Resume'}</h5>
                      <p className="dropzone-note">
                        {selectedFile
                          ? `Size: ${(selectedFile.size / 1024).toFixed(1)} KB — Ready to analyze`
                          : 'Standard PDF files up to 5 MB supported'}
                      </p>
                      <label htmlFor="cv-file-input" className="btn btn-secondary">
                        {selectedFile ? 'Change PDF File' : 'Browse Files'}
                      </label>
                    </div>

                    {selectedFile && (
                      <div className="upload-action-center">
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={handleCvUpload}
                          disabled={loading}
                        >
                          <IconFileText size={16} />
                          <span>{loading ? 'Analyzing Document...' : 'Extract Profile Information'}</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Extraction Results */}
                  {cvResult && (
                    <div className="extraction-results">
                      <div className="extraction-header">
                        <h5>Extracted Credentials</h5>
                        <p>{cvResult.message}</p>
                      </div>

                      {/* Summary Metrics */}
                      <div className="extracted-meta-grid">
                        <div className="meta-card">
                          <span className="meta-label">Candidate Name</span>
                          <span className="meta-value">{cvResult.candidateName || 'Candidate'}</span>
                        </div>
                        <div className="meta-card">
                          <span className="meta-label">Detected Degree</span>
                          <span className="meta-value">{cvResult.degree || 'Not detected'}</span>
                        </div>
                        <div className="meta-card">
                          <span className="meta-label">Cumulative GPA</span>
                          <span className="meta-value">{cvResult.cgpa ? `${cvResult.cgpa} / ${cvResult.cgpaScale}` : 'N/A'}</span>
                        </div>
                        <div className="meta-card">
                          <span className="meta-label">Graduation Year</span>
                          <span className="meta-value">{cvResult.graduationYear || 'N/A'}</span>
                        </div>
                      </div>

                      {/* Discovered Skills */}
                      <div className="extracted-group">
                        <label>Technical Skills ({cvResult.extractedSkills?.length || 0})</label>
                        <div className="tags-list">
                          {cvResult.extractedSkills?.map((s, idx) => (
                            <span key={idx} className="app-tag">{s}</span>
                          ))}
                        </div>
                      </div>

                      {/* Discovered Research Areas */}
                      <div className="extracted-group">
                        <label>Research Areas ({cvResult.extractedResearchInterests?.length || 0})</label>
                        <div className="tags-list">
                          {cvResult.extractedResearchInterests?.map((r, idx) => (
                            <span key={idx} className="app-tag">{r}</span>
                          ))}
                        </div>
                      </div>

                      {/* Projects */}
                      {cvResult.extractedProjects?.length > 0 && (
                        <div className="extracted-group">
                          <label>Notable Projects ({cvResult.extractedProjects.length})</label>
                          <div className="tags-list">
                            {cvResult.extractedProjects.map((p, idx) => (
                              <span key={idx} className="app-tag">{p}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="apply-extracted-footer">
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={autoPopulateAllFromCv}
                        >
                          <IconCheck size={16} />
                          <span>Apply Extracted Details to Academic Profile</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── VIEW 3: ADMISSIONS SUMMARY (Direct Items, No Redundant Outer Box) ── */}
            {activeNav === 'admissions' && (
              <div className="view-admissions">
                {/* Clean Top Header Row */}
                <div className="page-header-row">
                  <div>
                    <h3>Candidate Admissions Summary</h3>
                    <p>A consolidated record of your verified degree, academic standing, and study abroad preferences.</p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleExport}
                    disabled={exporting}
                  >
                    <IconDownload size={16} />
                    <span>{exporting ? 'Exporting...' : 'Export Profile (.json)'}</span>
                  </button>
                </div>

                {/* Direct Key Metric Tiles */}
                <div className="candidate-summary-tiles">
                  <div className="summary-tile">
                    <span className="tile-title">Degree Program</span>
                    <strong className="tile-text">{form.degree || 'BS in Computer Science'}</strong>
                    <span className="tile-sub">Class of {form.graduationYear}</span>
                  </div>

                  <div className="summary-tile">
                    <span className="tile-title">Academic Standing</span>
                    <strong className="tile-text">{form.cgpa} <span className="scale">/ {form.cgpaScale}</span></strong>
                    <span className="tile-sub">Cumulative GPA</span>
                  </div>

                  <div className="summary-tile">
                    <span className="tile-title">Target Intake</span>
                    <strong className="tile-text">{form.targetIntake} Intake</strong>
                    <span className="tile-sub">{form.fundingPreference}</span>
                  </div>

                  <div className="summary-tile">
                    <span className="tile-title">Destination Hubs</span>
                    <div className="tile-countries-wrap">
                      {countriesArray.length > 0 ? (
                        countriesArray.map((c, i) => <span key={i} className="country-subtle-tag">{c}</span>)
                      ) : (
                        <span className="tile-text">Global</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Direct Section 1: Technical Competencies */}
                <div className="section-card">
                  <div className="section-card-header">
                    <h4>Technical Competencies</h4>
                    <p>Verified technical capabilities, languages, and frameworks</p>
                  </div>
                  <div className="tags-list">
                    {skillsArray.length > 0 ? (
                      skillsArray.map((s, idx) => <span key={idx} className="app-tag">{s}</span>)
                    ) : (
                      <span className="empty-caption">No skills listed yet. Complete your profile to add skills.</span>
                    )}
                  </div>
                </div>

                {/* Direct Section 2: Research Specializations */}
                <div className="section-card">
                  <div className="section-card-header">
                    <h4>Research Specializations</h4>
                    <p>Primary areas of scientific inquiry and graduate study concentrations</p>
                  </div>
                  <div className="tags-list">
                    {researchArray.length > 0 ? (
                      researchArray.map((r, idx) => <span key={idx} className="app-tag">{r}</span>)
                    ) : (
                      <span className="empty-caption">No research areas listed yet. Complete your profile to add research focus.</span>
                    )}
                  </div>
                </div>

                {/* Direct Section 3: Data Export Format */}
                <div className="section-card">
                  <div className="raw-data-header">
                    <div>
                      <h4>Export Data Preview (.json)</h4>
                      <p>Machine-readable payload formatted for graduate admissions matching</p>
                    </div>
                    <div className="raw-data-actions">
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          navigator.clipboard.writeText(JSON.stringify(snapshot || form, null, 2));
                          setStatusMessage({ type: 'success', text: 'Data copied to clipboard.' });
                        }}
                      >
                        Copy JSON
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => setShowJsonRaw(prev => !prev)}
                      >
                        {showJsonRaw ? 'Collapse Preview' : 'Expand Preview'}
                      </button>
                    </div>
                  </div>

                  {showJsonRaw && (
                    <div className="accordion-body">
                      <pre className="code-view">{JSON.stringify(snapshot || form, null, 2)}</pre>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── VIEW 4: ACCOUNT SETTINGS ── */}
            {activeNav === 'settings' && (
              <div className="view-settings">
                <div className="section-card">
                  <div className="section-card-header">
                    <h4>Account Details</h4>
                    <p>Manage your account credentials and personal information</p>
                  </div>

                  <div className="settings-fields">
                    <div className="field-row">
                      <label>Full Name</label>
                      <input type="text" value={user.fullName || 'Student'} disabled />
                    </div>

                    <div className="field-row">
                      <label>Email Address</label>
                      <input type="email" value={user.email} disabled />
                    </div>

                    <div className="field-row">
                      <label>Session Status</label>
                      <div className="session-status-text">
                        <span className="status-indicator-dot"></span>
                        <span>Active</span>
                      </div>
                    </div>
                  </div>

                  <div className="settings-footer">
                    <button type="button" className="btn btn-secondary" onClick={handleLogout}>
                      <IconLogOut size={16} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
