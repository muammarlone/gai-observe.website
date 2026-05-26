import React, { useState } from 'react';
import { FlaskConical, AlertTriangle } from 'lucide-react';

export default function ABTestCalculator({ data }) {
  const [baselineRate, setBaselineRate] = useState(5);
  const [mde, setMde] = useState(10);
  const [confidence, setConfidence] = useState(95);
  const [dailyTraffic, setDailyTraffic] = useState(1000);

  const zAlpha = { 80: 1.28, 90: 1.645, 95: 1.96, 99: 2.576 }[confidence] ?? 1.96;
  const zBeta = 0.84;
  const p1 = baselineRate / 100;
  const p2 = p1 * (1 + mde / 100);
  const pooledP = (p1 + p2) / 2;
  const delta = p2 - p1;
  const samplePerVariant = delta > 0
    ? Math.ceil(((zAlpha + zBeta) ** 2 * 2 * pooledP * (1 - pooledP)) / (delta ** 2))
    : 0;
  const totalSample = samplePerVariant * 2;
  const daysNeeded = dailyTraffic > 0 ? Math.ceil(totalSample / dailyTraffic) : 0;

  const heading = data?.heading || 'A/B Test Sample Size Calculator';
  const durationColor = daysNeeded <= 14 ? 'var(--success-emerald)' : daysNeeded <= 30 ? '#F59E0B' : 'var(--error-rose)';

  const sliders = [
    { label: 'Baseline Conversion Rate', value: baselineRate, set: setBaselineRate, min: 0.5, max: 30, step: 0.5, display: `${baselineRate}%` },
    { label: 'Minimum Detectable Effect', value: mde, set: setMde, min: 1, max: 50, step: 1, display: `${mde}%` },
    { label: 'Daily Traffic', value: dailyTraffic, set: setDailyTraffic, min: 100, max: 100000, step: 100, display: dailyTraffic.toLocaleString() },
  ];

  const cards = [
    { label: 'Per Variant', value: samplePerVariant.toLocaleString(), color: 'var(--accent-cyan)' },
    { label: 'Total Sample', value: totalSample.toLocaleString(), color: 'var(--accent-violet)' },
    { label: 'Est. Duration', value: `${daysNeeded} days`, color: durationColor },
  ];

  const alertStyle = (bg, color) => ({
    display: 'flex', alignItems: 'center', gap: 12, padding: 14, borderRadius: 8,
    background: bg, color, fontSize: '0.9rem', marginTop: 16,
  });

  return (
    <div className="panel" style={{ padding: 24 }}>
      <h3 style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <FlaskConical size={22} /> {heading}
      </h3>

      {sliders.map(s => (
        <div key={s.label} style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 4 }}>
            <span>{s.label}</span><span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{s.display}</span>
          </div>
          <input type="range" min={s.min} max={s.max} step={s.step} value={s.value}
            aria-label={s.label}
            onChange={e => s.set(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--accent-violet)' }} />
        </div>
      ))}

      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 4 }}>
          <span>Confidence Level</span><span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{confidence}%</span>
        </div>
        <select value={confidence} onChange={e => setConfidence(Number(e.target.value))}
          style={{ width: '100%', padding: '8px 12px', borderRadius: 6, background: 'var(--bg-slate)', color: 'var(--text-primary)', border: '1px solid var(--text-muted)' }}>
          {[80, 90, 95, 99].map(v => <option key={v} value={v}>{v}%</option>)}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12, marginTop: 20 }}>
        {cards.map(c => (
          <div key={c.label} style={{
            background: 'var(--bg-slate)', borderRadius: 8, padding: 16, textAlign: 'center',
            border: `2px solid ${c.color}`,
          }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4 }}>{c.label}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      {mde < 5 && dailyTraffic < 5000 && (
        <div style={alertStyle('rgba(245, 158, 11, 0.15)', '#F59E0B')}>
          <AlertTriangle size={20} /> Small effects need large samples
        </div>
      )}
      {daysNeeded > 90 ? (
        <div style={alertStyle('rgba(239, 68, 68, 0.15)', '#EF4444')}>
          <AlertTriangle size={20} /> Test unlikely to reach significance
        </div>
      ) : daysNeeded > 30 && (
        <div style={alertStyle('rgba(245, 158, 11, 0.15)', '#F59E0B')}>
          <AlertTriangle size={20} /> Test may take too long
        </div>
      )}
    </div>
  );
}
