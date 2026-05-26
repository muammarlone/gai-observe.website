import React, { useState, useRef } from 'react';
import { BarChart3, Plus, Trash2 } from 'lucide-react';
import { logAuditEvent } from '../lib/auditLog.js';

export default function RICESandbox({ data, bookId }) {
  const featureIdRef = useRef(100);
  const emptyFeature = () => {
    featureIdRef.current += 1;
    return { id: featureIdRef.current, name: '', reach: 5, impact: 5, confidence: 5, effort: 5 };
  };
  const [features, setFeatures] = useState([
    { id: 1, name: 'AI-Powered Search', reach: 8, impact: 7, confidence: 9, effort: 4 },
    { id: 2, name: 'Dark Mode UI', reach: 6, impact: 4, confidence: 10, effort: 2 },
    { id: 3, name: 'Export to PDF', reach: 5, impact: 6, confidence: 7, effort: 6 }
  ]);

  const riceScore = (f) => f.effort > 0 ? ((f.reach * f.impact * f.confidence) / f.effort) : 0;

  const sortedFeatures = [...features].sort((a, b) => riceScore(b) - riceScore(a));

  const updateFeature = (id, field, value) => {
    setFeatures(prev => prev.map(f =>
      f.id === id ? { ...f, [field]: field === 'name' ? value : Number(value) } : f
    ));
  };

  const addFeature = () => {
    setFeatures(prev => [...prev, emptyFeature()]);
    logAuditEvent('tool_use', { component: 'RICESandbox', action: 'add_feature' }, bookId);
  };

  const removeFeature = (id) => setFeatures(prev => prev.filter(f => f.id !== id));

  const sliderField = (feature, field, label) => (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 4 }}>
        <span style={{ color: 'var(--text-muted)' }}>{label}</span>
        <span style={{ fontWeight: 600 }}>{feature[field]}</span>
      </div>
      <input
        type="range"
        min="1"
        max="10"
        step="1"
        aria-label={`${label} for ${feature.name || 'feature'}`}
        value={feature[field]}
        onChange={e => updateFeature(feature.id, field, e.target.value)}
        style={{ width: '100%', accentColor: 'var(--accent-violet)', height: 4 }}
      />
    </div>
  );

  return (
    <div className="panel">
      <h3 style={{ color: 'var(--accent-cyan)' }}>
        <BarChart3 size={20} style={{ marginRight: 8, verticalAlign: 'middle' }} />
        {data?.heading || 'RICE Feature Prioritization'}
      </h3>
      <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>
        Score features on Reach, Impact, Confidence & Effort. The leaderboard auto-sorts by (R x I x C) / E.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
        {features.map(f => (
          <div key={f.id} style={{
            background: 'var(--bg-slate)',
            borderRadius: 8,
            padding: 16,
            borderLeft: '3px solid var(--accent-violet)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <input
                type="text"
                value={f.name}
                onChange={e => updateFeature(f.id, 'name', e.target.value)}
                placeholder="Feature name..."
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  background: 'var(--panel-slate)',
                  border: '1px solid #334155',
                  color: 'var(--text-primary)',
                  borderRadius: 6,
                  fontSize: '0.9rem'
                }}
              />
              {features.length > 1 && (
                <button
                  onClick={() => removeFeature(f.id)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--error-rose)',
                    cursor: 'pointer',
                    padding: 4
                  }}
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: 12
            }}>
              {sliderField(f, 'reach', 'Reach')}
              {sliderField(f, 'impact', 'Impact')}
              {sliderField(f, 'confidence', 'Confidence')}
              {sliderField(f, 'effort', 'Effort')}
            </div>
          </div>
        ))}
      </div>

      <button
        className="btn-primary"
        style={{ width: '100%', marginBottom: 24, backgroundColor: 'transparent', border: '2px dashed #334155', color: 'var(--text-muted)' }}
        onClick={addFeature}
      >
        <Plus size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />
        Add Feature
      </button>

      <h4 style={{ color: 'var(--accent-violet)', marginBottom: 12 }}>Priority Leaderboard</h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {sortedFeatures.map((f, idx) => {
          const score = riceScore(f);
          const maxScore = riceScore(sortedFeatures[0]) || 1;
          const barWidth = (score / maxScore) * 100;
          return (
            <div key={f.id} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 14px',
              background: 'var(--bg-slate)',
              borderRadius: 6,
              transition: 'all 0.3s ease'
            }}>
              <span style={{
                fontWeight: 800,
                fontSize: '1.1rem',
                color: idx === 0 ? 'var(--accent-cyan)' : 'var(--text-muted)',
                minWidth: 24,
                textAlign: 'center'
              }}>
                {idx + 1}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 4 }}>
                  {f.name || 'Unnamed Feature'}
                </div>
                <div style={{
                  height: 6,
                  background: '#334155',
                  borderRadius: 3,
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${barWidth}%`,
                    background: idx === 0 ? 'var(--accent-cyan)' : 'var(--accent-violet)',
                    borderRadius: 3,
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>
              <span style={{
                fontWeight: 700,
                color: idx === 0 ? 'var(--accent-cyan)' : 'var(--text-primary)',
                fontSize: '1rem',
                minWidth: 50,
                textAlign: 'right'
              }}>
                {score.toFixed(0)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
