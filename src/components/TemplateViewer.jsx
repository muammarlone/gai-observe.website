import React, { useState, useMemo } from 'react';
import { Layout, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { logAuditEvent } from '../lib/auditLog.js';

export default function TemplateViewer({ data, bookId }) {
  const templates = useMemo(() => data?.templates || [], [data?.templates]);
  const [activeIdx, setActiveIdx] = useState(0);

  if (!templates.length) return null;

  const safeIdx = activeIdx < templates.length ? activeIdx : 0;
  const active = templates[safeIdx];

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = active.file;
    link.download = active.file.split('/').pop();
    link.click();
    logAuditEvent('tool_use', { component: 'TemplateViewer', action: 'download', template: active.name }, bookId);
  };

  return (
    <div className="panel">
      <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Layout size={20} style={{ color: 'var(--accent-violet)' }} />
        Frameworks & Templates
      </h3>
      <p style={{ color: 'var(--text-muted)', marginBottom: 16, fontSize: '0.9rem' }}>
        Printable reference cards and canvases for this chapter. Download and use in your workflow.
      </p>

      {templates.length > 1 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {templates.map((t, i) => (
            <button
              key={t.name || t.file || i}
              onClick={() => setActiveIdx(i)}
              style={{
                flex: 1,
                padding: '10px 12px',
                borderRadius: 8,
                border: safeIdx === i ? '1px solid var(--accent-violet)' : '1px solid #334155',
                background: safeIdx === i ? 'rgba(139, 92, 246, 0.15)' : 'var(--bg-slate)',
                color: safeIdx === i ? 'var(--text-primary)' : 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 600,
                transition: 'all 0.2s ease'
              }}
            >
              {t.name}
            </button>
          ))}
        </div>
      )}

      <div style={{
        background: 'var(--bg-slate)',
        borderRadius: 12,
        border: '1px solid #334155',
        overflow: 'hidden',
        marginBottom: 16
      }}>
        <img
          src={active.file}
          alt={active.name}
          style={{ width: '100%', height: 'auto', display: 'block' }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0, flex: 1, minWidth: 200 }}>
          {active.description}
        </p>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {templates.length > 1 && (
            <>
              <button
                aria-label="Previous template"
                onClick={() => setActiveIdx(i => i > 0 ? i - 1 : templates.length - 1)}
                style={{ padding: '8px', borderRadius: 6, border: '1px solid #334155', background: 'var(--bg-slate)', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <ChevronLeft size={16} />
              </button>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{activeIdx + 1}/{templates.length}</span>
              <button
                aria-label="Next template"
                onClick={() => setActiveIdx(i => i < templates.length - 1 ? i + 1 : 0)}
                style={{ padding: '8px', borderRadius: 6, border: '1px solid #334155', background: 'var(--bg-slate)', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <ChevronRight size={16} />
              </button>
            </>
          )}
          <button
            className="btn-primary"
            onClick={handleDownload}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Download size={16} /> Download SVG
          </button>
        </div>
      </div>
    </div>
  );
}
