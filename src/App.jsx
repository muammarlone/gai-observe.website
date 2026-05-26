import React, { useState, useEffect } from 'react';
import './index.css';
import { getChapterData, getBookConfig, getAvailableChapters } from './data/index.js';
import { supabase } from './lib/supabase.js';
import { useFeatureGate, canAccess } from './lib/featureGate.js';
import { logAuditEvent, flushAuditQueue } from './lib/auditLog.js';
import { verifyCipher, getSafeRedirectOrigin } from './lib/cipher.js';
import { Lock, FileText, CheckCircle, Cpu, LogIn, Mail, Download } from 'lucide-react';
import RICESandbox from './components/RICESandbox.jsx';
import ABTestCalculator from './components/ABTestCalculator.jsx';
import TemplateViewer from './components/TemplateViewer.jsx';

/* ─── Two-Step Access Gate ────────────────────────────────────────────────── */
const AccessGate = ({ onUnlock, bookId, config }) => {
  const [step, setStep] = useState('auth');
  const [authUser, setAuthUser] = useState(null);
  const [email, setEmail] = useState('');
  const [cipher, setCipher] = useState('');
  const [consentChecked, setConsentChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleOAuth = async (provider) => {
    if (!supabase) {
      setError('Supabase not configured. Use email login.');
      return;
    }
    setLoading(true);
    setError('');
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: getSafeRedirectOrigin() }
    });
    if (oauthError) {
      setError(oauthError.message);
      setLoading(false);
    }
  };

  const handleEmailAuth = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim())) {
      setError('Valid email required.');
      return;
    }
    setError('');

    if (supabase) {
      setLoading(true);
      const { error: magicError } = await supabase.auth.signInWithOtp({ email });
      setLoading(false);
      if (magicError) {
        setError(magicError.message);
        return;
      }
      setAuthUser({ email, pendingVerification: true });
      setStep('cipher');
      return;
    }

    setAuthUser({ email });
    setStep('cipher');
  };

  const handleCipherVerify = async () => {
    if (!cipher.trim()) {
      setError('Enter the access code from your book.');
      return;
    }
    const isValid = await verifyCipher(cipher, config?.auth?.validAnswerHashes || []);
    if (!isValid) {
      setError('Incorrect. Check your book!');
      return;
    }
    if (!consentChecked) {
      setError('You must consent to continue.');
      return;
    }
    setError('');

    const normalizedEmail = (authUser?.email || email).trim().toLowerCase().slice(0, 254);
    try {
      localStorage.setItem(`gai_access_${bookId}`, JSON.stringify({
        ts: Date.now(),
        email: normalizedEmail,
        provider: authUser?.app_metadata?.provider || 'email',
        verified: !!(authUser?.id || authUser?.app_metadata?.provider)
      }));
    } catch { /* storage unavailable */ }
    onUnlock(true);
  };

  useEffect(() => {
    if (!supabase) return;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') && session?.user) {
        setAuthUser(session.user);
        setEmail(session.user.email);
        setStep('cipher');
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="login-bg">
    <div className="panel login-panel">
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <Lock size={40} color="var(--accent-violet)" style={{ opacity: 0.9 }} />
        <div className="login-brand"><span>gai-observe</span>.online</div>
        <p className="login-subtitle">Digital Companion</p>
      </div>

      {error && (
        <div role="alert" style={{ padding: 12, marginBottom: 16, borderRadius: 6, background: 'rgba(239, 68, 68, 0.15)', color: 'var(--error-rose)', fontSize: '0.9rem' }}>
          {error}
        </div>
      )}

      {step === 'auth' && (
        <div>
          <label style={{ display: 'block', marginBottom: 8 }}>
            <LogIn size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />
            Step 1: Authenticate Identity
          </label>
          {supabase && (
            <>
              <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                <button className="btn-primary" disabled={loading} style={{ flex: 1, backgroundColor: '#0A66C2' }} onClick={() => handleOAuth('linkedin_oidc')}>LinkedIn</button>
                <button className="btn-primary" disabled={loading} style={{ flex: 1, backgroundColor: '#EA4335' }} onClick={() => handleOAuth('google')}>Google</button>
              </div>
              <div className="login-divider">OR CONTINUE WITH EMAIL</div>
            </>
          )}
          <input aria-label="Email address" className="input-field" type="email" placeholder="you@domain.com" value={email} onChange={e => setEmail(e.target.value)} />
          <button className="btn-primary" disabled={loading} style={{ width: '100%' }} onClick={handleEmailAuth}>
            <Mail size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />
            {loading ? 'Sending...' : 'Continue with Email'}
          </button>
        </div>
      )}

      {step === 'cipher' && (
        <div>
          <div style={{ padding: 12, marginBottom: 16, borderRadius: 6, background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success-emerald)', fontSize: '0.9rem' }}>
            Authenticated as <strong>{authUser?.email || email}</strong>
          </div>
          <label style={{ display: 'block', marginBottom: 8 }}>
            <Lock size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />
            Step 2: <b>Book Cipher</b> — {config?.auth?.cipherPrompt || 'Enter passcode.'}
          </label>
          <input
            className="input-field"
            type="text"
            aria-label="Book cipher access code"
            placeholder="Access code..."
            autoComplete="off"
            value={cipher}
            onChange={e => setCipher(e.target.value)}
          />
          <label className="checkbox-label">
            <input type="checkbox" onChange={e => setConsentChecked(e.target.checked)} required />
            I consent to receive updates from GAI-Observe.
          </label>
          <button className="btn-primary" style={{ width: '100%' }} onClick={handleCipherVerify}>Verify & Unlock</button>
          <button style={{ width: '100%', marginTop: 8, padding: '8px 0', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem' }} onClick={() => { setStep('auth'); setAuthUser(null); }}>
            Use a different account
          </button>
        </div>
      )}
    </div>
    </div>
  );
};

/* ─── Quiz Engine ─────────────────────────────────────────────────────────── */
const QuizEngine = ({ data }) => {
  const [selections, setSelections] = useState({});
  const [submitted, setSubmitted] = useState(false);

  if (!data?.questions?.length) {
    return <div className="panel"><p style={{ color: 'var(--error-rose)' }}>Quiz data unavailable.</p></div>;
  }

  const total = data.questions.length;
  const correct = submitted ? data.questions.filter(q => selections[q.id] === q.correctAnswer).length : 0;
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  const scoreColor = pct >= 80 ? 'var(--success-emerald)' : pct >= 60 ? '#F59E0B' : 'var(--error-rose)';

  const handleSelect = (qId, opt) => { if (!submitted) setSelections(prev => ({ ...prev, [qId]: opt })); };
  const handleSubmit = () => { setSubmitted(true); logAuditEvent('quiz_submit', { heading: data.heading, total, correct }); };
  const handleRetake = () => { setSelections({}); setSubmitted(false); };

  return (
    <div className="panel">
      <h3><CheckCircle size={20} style={{marginRight: 8, verticalAlign: 'middle', color: 'var(--success-emerald)'}}/> {data.heading}</h3>

      {submitted && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
          padding: '14px 18px', borderRadius: 8, marginBottom: 20,
          background: `${scoreColor}1A`, border: `2px solid ${scoreColor}` }}>
          <div>
            <span style={{ fontSize: '1.4rem', fontWeight: 800, color: scoreColor }}>{correct}/{total}</span>
            <span style={{ marginLeft: 10, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              {pct}% — {pct >= 80 ? 'Excellent!' : pct >= 60 ? 'Good effort' : 'Keep studying'}
            </span>
          </div>
          <button className="btn-primary" onClick={handleRetake} style={{ padding: '8px 18px', fontSize: '0.85rem' }}>Retake Quiz</button>
        </div>
      )}

      {data.questions.map(q => (
        <div key={q.id} style={{ marginBottom: 24 }}>
          <p>{q.text}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {q.options.map(opt => {
              const isSelected = selections[q.id] === opt;
              const isCorrect = submitted && opt === q.correctAnswer;
              const isWrong = submitted && isSelected && opt !== q.correctAnswer;
              return (
                <button
                  key={opt}
                  onClick={() => handleSelect(q.id, opt)}
                  style={{
                    padding: '10px 16px', borderRadius: 4,
                    background: isCorrect ? 'rgba(16,185,129,0.25)' : isWrong ? 'rgba(239,68,68,0.25)' : isSelected ? 'var(--accent-cyan)' : 'var(--bg-slate)',
                    color: 'white', border: isCorrect ? '2px solid var(--success-emerald)' : isWrong ? '2px solid var(--error-rose)' : '1px solid #334155',
                    cursor: submitted ? 'default' : 'pointer',
                    maxWidth: '100%', wordBreak: 'break-word', textAlign: 'left'
                  }}
                >
                  {opt}
                </button>
              );
            })}
          </div>
          {submitted && selections[q.id] && (
            <div style={{ marginTop: 16, padding: 12, borderRadius: 6, background: selections[q.id] === q.correctAnswer ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)' }}>
              <strong>{selections[q.id] === q.correctAnswer ? 'Correct!' : 'Incorrect.'}</strong> {q.hint}
            </div>
          )}
        </div>
      ))}

      {!submitted && (
        <button className="btn-primary" onClick={handleSubmit}>Submit Assessment</button>
      )}
    </div>
  );
};

/* ─── Reflection Journal ──────────────────────────────────────────────────── */
const ReflectionJournal = ({ data, bookId, chapterId, chapterTitle }) => {
  const storageKey = `gai_journal_${bookId}_${chapterId}_${data.id || data.heading?.replace(/\s+/g, '_')}`;
  const [text, setText] = useState(() => {
    try { return localStorage.getItem(storageKey) || ''; } catch { return ''; }
  });

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      try { localStorage.setItem(storageKey, text); } catch { /* storage unavailable */ }
    }, 1000);
    return () => clearTimeout(timeoutId);
  }, [text, storageKey]);

  return (
    <div className="panel">
      <h3><FileText size={20} style={{marginRight: 8, verticalAlign: 'middle', color: 'var(--accent-violet)'}}/> {data.heading}</h3>
      <p style={{ color: 'var(--text-muted)' }}>{data.prompt}</p>
      <textarea
        className="input-field"
        rows="4"
        aria-label={`Reflection journal: ${data.heading || 'Your response'}`}
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Draft your action plan here..."
      />
      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Auto-saves locally</span>
    </div>
  );
};

/* ─── Market Shift Timeline ───────────────────────────────────────────────── */
const MarketShiftExplorer = ({ data }) => (
  <div className="panel">
    <h3><Cpu size={20} style={{marginRight: 8, verticalAlign: 'middle', color: 'var(--accent-cyan)'}}/> Market Shift Timeline</h3>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
      {(data?.eras || []).map(era => (
        <div key={era.year} style={{ padding: 16, background: 'var(--bg-slate)', borderLeft: '3px solid var(--accent-violet)', borderRadius: '4px' }}>
          <h4 style={{ margin: '0 0 8px 0', color: 'var(--accent-cyan)' }}>{era.year}</h4>
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>{era.focus}</p>
        </div>
      ))}
    </div>
  </div>
);

/* ─── Core Engine Router ──────────────────────────────────────────────────── */
export default function App() {
  const bookId = 'pm_handbook';
  const [chapterId, setChapterId] = useState('chapter1');

  const bookConfig = getBookConfig(bookId);
  const availableChapters = getAvailableChapters(bookId);
  const gate = useFeatureGate(bookId);

  const [unlocked, setUnlocked] = useState(() => {
    try {
      const stored = localStorage.getItem(`gai_access_${bookId}`);
      if (!stored) return false;
      const data = JSON.parse(stored);
      if (typeof data !== 'object' || data === null) return false;
      const ts = typeof data.ts === 'number' ? data.ts : 0;
      if (typeof data.email !== 'string' || typeof data.provider !== 'string') {
        try { localStorage.removeItem(`gai_access_${bookId}`); } catch { /* ignore */ }
        return false;
      }
      return (Date.now() - ts) < 30 * 24 * 60 * 60 * 1000;
    } catch {
      try { localStorage.removeItem(`gai_access_${bookId}`); } catch { /* ignore */ }
      return false;
    }
  });

  useEffect(() => { flushAuditQueue(); }, []);

  if (!unlocked) return <AccessGate onUnlock={setUnlocked} bookId={bookId} config={bookConfig} />;

  if (gate.loading) {
    return <div className="app-container"><p style={{ color: 'var(--text-muted)' }}>Loading your access level...</p></div>;
  }

  const chapterData = getChapterData(bookId, chapterId);
  if (!chapterData) return <div className="app-container"><h2>Module Under Maintenance</h2></div>;

  return (
    <div className="app-container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <h1 style={{ margin: 0, fontSize: '1.25rem' }}><span style={{color: 'var(--accent-violet)'}}>gai-observe.online</span> Digital Companion</h1>
        <select
          aria-label="Select chapter"
          className="input-field"
          style={{ width: 'auto', marginBottom: 0 }}
          value={chapterId}
          onChange={e => setChapterId(e.target.value)}
        >
          {availableChapters.map(ch => (
            <option key={ch.id} value={ch.id}>{ch.title}</option>
          ))}
        </select>
      </header>

      {chapterData.sections.map((sec, i) => {
        const sectionKey = sec.id || `${sec.type}-${i}`;
        if (!canAccess(sec, gate)) return null;
        if (sec.type === 'quiz') return <QuizEngine key={sectionKey} data={sec} />;
        if (sec.type === 'reflection') return <ReflectionJournal key={sectionKey} data={sec} bookId={bookId} chapterId={chapterId} chapterTitle={chapterData.title} />;
        if (sec.type === 'templates') return <TemplateViewer key={sectionKey} data={sec} bookId={bookId} />;
        if (sec.type === 'tool') {
          if (sec.component === 'MarketShiftTool') return <MarketShiftExplorer key={sectionKey} data={sec.data} />;
          if (sec.component === 'RICESandbox') return <RICESandbox key={sectionKey} data={sec.data} bookId={bookId} />;
          if (sec.component === 'ABTestCalculator') return <ABTestCalculator key={sectionKey} data={sec.data} bookId={bookId} />;
        }
        return null;
      })}
    </div>
  );
}
